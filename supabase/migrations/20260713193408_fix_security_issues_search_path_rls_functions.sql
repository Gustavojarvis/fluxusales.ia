/*
# Security Hardening: Search Paths, RLS Policies, SECURITY DEFINER Functions

1. Function Search Path Mutable
   - All 4 functions (update_updated_at_column, generate_order_number, upsert_customer,
     update_customer_stats) had a mutable search_path, allowing search_path hijacking
     attacks. Fixed by setting an explicit `search_path = public` on each function.

2. RLS Policy Always True
   - Multiple anon INSERT/UPDATE policies used `WITH CHECK (true)` or `USING (true)`,
     which bypasses RLS entirely. Replaced with proper company-existence checks:
     - conversations: anon INSERT/UPDATE must reference a valid (non-deleted) company
     - messages: anon INSERT must reference a valid conversation → company
     - customers: anon INSERT/UPDATE must reference a valid company
     - order_items: anon INSERT must reference a valid order → company
     - orders: anon INSERT must reference a valid company
   - Anon SELECT policies on conversations, messages, order_items, customers remain
     `USING (true)` — these are intentionally public for the storefront chat experience
     (anyone can view chat history and order details by conversation). This is the
     intended design for a no-auth public storefront.

3. SECURITY DEFINER Functions Executable by Public
   - `generate_order_number`, `upsert_customer`, `update_customer_stats` were
     SECURITY DEFINER with default EXECUTE granted to anon and authenticated.
   - `update_customer_stats` is a trigger function — it only runs internally when
     the orders trigger fires, never via RPC. Revoke all EXECUTE privileges.
   - `generate_order_number` and `upsert_customer` are called from the client via
     `.rpc()`. Switched to SECURITY INVOKER so they execute with the caller's
     privileges (RLS applies). EXECUTE remains on anon/authenticated since the
     public storefront chat needs to create orders and customers.
   - `update_updated_at_column` is a trigger function — revoke all EXECUTE.

4. Notes
   - No data is lost; only security metadata changes.
   - All policies remain idempotent (DROP IF EXISTS before CREATE).
   - The storefront (anon) can still: read companies/categories/products, create
     orders, create conversations/messages, create customers, read order_items.
     But now each write is constrained to reference a valid company.
*/

-- ============================================================
-- 1. Fix mutable search_path on all functions
-- ============================================================

-- update_updated_at_column (trigger function, no args)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- generate_order_number
CREATE OR REPLACE FUNCTION public.generate_order_number(company_uuid uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  next_num int;
BEGIN
  SELECT COALESCE(MAX(order_number), 0) + 1
  INTO next_num
  FROM orders
  WHERE orders.company_id = company_uuid;
  RETURN next_num;
END;
$$;

-- upsert_customer
CREATE OR REPLACE FUNCTION public.upsert_customer(
  p_company_id uuid,
  p_name text,
  p_phone text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  customer_id uuid;
BEGIN
  -- Try to find existing customer by phone
  SELECT id INTO customer_id
  FROM customers
  WHERE company_id = p_company_id
    AND phone = p_phone
    AND deleted_at IS NULL
  LIMIT 1;

  IF customer_id IS NULL THEN
    INSERT INTO customers (company_id, name, phone)
    VALUES (p_company_id, p_name, p_phone)
    RETURNING id INTO customer_id;
  ELSE
    UPDATE customers SET name = p_name, updated_at = now()
    WHERE id = customer_id;
  END IF;

  RETURN customer_id;
END;
$$;

-- update_customer_stats (trigger function, no args)
CREATE OR REPLACE FUNCTION public.update_customer_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.customer_id IS NOT NULL AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status != 'completed')) THEN
    UPDATE customers
    SET
      total_spent = total_spent + CASE WHEN TG_OP = 'INSERT' THEN NEW.total ELSE 0 END,
      order_count = order_count + CASE WHEN TG_OP = 'INSERT' THEN 1 ELSE 0 END,
      last_order_at = now()
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================
-- 2. Revoke EXECUTE on trigger-only SECURITY DEFINER functions
-- ============================================================

-- update_updated_at_column: trigger-only, never called via RPC
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;

-- update_customer_stats: trigger-only, never called via RPC
REVOKE EXECUTE ON FUNCTION public.update_customer_stats() FROM PUBLIC;

-- ============================================================
-- 3. Fix RLS policies that were always-true (WITH CHECK true)
-- ============================================================

-- ---------- conversations ----------
-- Replace anon INSERT (was WITH CHECK true)
DROP POLICY IF EXISTS "anon_insert_conversations" ON conversations;
CREATE POLICY "anon_insert_conversations" ON conversations FOR INSERT
  TO anon, authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = conversations.company_id AND companies.deleted_at IS NULL)
  );

-- Replace anon UPDATE (was USING true WITH CHECK true)
DROP POLICY IF EXISTS "anon_update_conversations" ON conversations;
CREATE POLICY "anon_update_conversations" ON conversations FOR UPDATE
  TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = conversations.company_id AND companies.deleted_at IS NULL)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = conversations.company_id AND companies.deleted_at IS NULL)
  );

-- ---------- messages ----------
-- Replace anon INSERT (was WITH CHECK true)
DROP POLICY IF EXISTS "anon_insert_messages" ON messages;
CREATE POLICY "anon_insert_messages" ON messages FOR INSERT
  TO anon, authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      JOIN companies ON companies.id = conversations.company_id
      WHERE conversations.id = messages.conversation_id
        AND companies.deleted_at IS NULL
    )
  );

-- ---------- customers ----------
-- Replace anon INSERT (was WITH CHECK true)
DROP POLICY IF EXISTS "anon_insert_customers" ON customers;
CREATE POLICY "anon_insert_customers" ON customers FOR INSERT
  TO anon, authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = customers.company_id AND companies.deleted_at IS NULL)
  );

-- Replace anon UPDATE (was USING true WITH CHECK true)
DROP POLICY IF EXISTS "anon_update_customers" ON customers;
CREATE POLICY "anon_update_customers" ON customers FOR UPDATE
  TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = customers.company_id AND companies.deleted_at IS NULL)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = customers.company_id AND companies.deleted_at IS NULL)
  );

-- ---------- order_items ----------
-- Replace anon INSERT (was WITH CHECK true)
DROP POLICY IF EXISTS "anon_insert_order_items" ON order_items;
CREATE POLICY "anon_insert_order_items" ON order_items FOR INSERT
  TO anon, authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      JOIN companies ON companies.id = orders.company_id
      WHERE orders.id = order_items.order_id
        AND companies.deleted_at IS NULL
    )
  );

-- ---------- orders ----------
-- Replace anon INSERT (was WITH CHECK true)
DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = orders.company_id AND companies.deleted_at IS NULL)
  );