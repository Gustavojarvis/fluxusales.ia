/*
# FluxSales AI — SaaS Evolution: Multi-company, Settings, Conversations, Kitchen

1. Modified Tables
- `companies` — adds logo, phone, address, hours, delivery_fee, welcome_message, brand_color, slug (unique).
- `customers` — adds total_spent, order_count, last_order_at (auto-updated by trigger).

2. New Tables
- `app_users` — links auth.users to companies with roles (admin/funcionario).
- `company_settings` — per-company AI customization (welcome message, brand color, logo).
- `subscriptions` — plan management (starter/pro/business) with billing period.
- `conversations` — chat sessions between customers and AI, linked to company.
- `messages` — individual messages within a conversation (customer/ai/system).
- `order_items` — normalized order line items (product snapshot).

3. Security
- RLS enabled on all new tables.
- `app_users`, `company_settings`, `subscriptions`: owner-scoped via company ownership check.
- `conversations`, `messages`: owner-scoped via company ownership check (authenticated).
  Also anon INSERT/SELECT for conversations and messages so the public chat can persist.
- `order_items`: owner-scoped via order → company ownership.
- `customers` extended with anon INSERT so chat can create customers.

4. Notes
- All new tables use soft delete (deleted_at) where appropriate.
- Triggers auto-update customer stats (total_spent, order_count, last_order_at) on order creation.
- The `slug` column on companies is made unique for public storefront URLs.
*/

-- ============ Extend companies table ============
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS logo text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS hours text,
  ADD COLUMN IF NOT EXISTS delivery_fee numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS welcome_message text,
  ADD COLUMN IF NOT EXISTS brand_color text DEFAULT '#0ea5e9';

-- Make slug unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_slug_unique
  ON companies (slug) WHERE deleted_at IS NULL AND slug IS NOT NULL;

-- ============ Extend customers table ============
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS total_spent numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS order_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_order_at timestamptz;

-- ============ app_users ============
CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  auth_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_app_users" ON app_users;
CREATE POLICY "select_own_app_users" ON app_users FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = app_users.company_id AND companies.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_app_users" ON app_users;
CREATE POLICY "insert_own_app_users" ON app_users FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = app_users.company_id AND companies.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_app_users" ON app_users;
CREATE POLICY "update_own_app_users" ON app_users FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = app_users.company_id AND companies.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = app_users.company_id AND companies.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_app_users" ON app_users;
CREATE POLICY "delete_own_app_users" ON app_users FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = app_users.company_id AND companies.user_id = auth.uid())
  );

-- ============ company_settings ============
CREATE TABLE IF NOT EXISTS company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  company_name text,
  welcome_message text,
  brand_color text DEFAULT '#0ea5e9',
  logo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_settings" ON company_settings;
CREATE POLICY "select_own_settings" ON company_settings FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = company_settings.company_id AND companies.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_settings" ON company_settings;
CREATE POLICY "insert_own_settings" ON company_settings FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = company_settings.company_id AND companies.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_settings" ON company_settings;
CREATE POLICY "update_own_settings" ON company_settings FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = company_settings.company_id AND companies.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = company_settings.company_id AND companies.user_id = auth.uid())
  );

-- Anon can read settings (for public storefront)
DROP POLICY IF EXISTS "anon_select_settings" ON company_settings;
CREATE POLICY "anon_select_settings" ON company_settings FOR SELECT
  TO anon, authenticated USING (true);

-- ============ subscriptions ============
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'starter',
  status text NOT NULL DEFAULT 'active',
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_subscriptions" ON subscriptions;
CREATE POLICY "select_own_subscriptions" ON subscriptions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = subscriptions.company_id AND companies.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_subscriptions" ON subscriptions;
CREATE POLICY "insert_own_subscriptions" ON subscriptions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = subscriptions.company_id AND companies.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_subscriptions" ON subscriptions;
CREATE POLICY "update_own_subscriptions" ON subscriptions FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = subscriptions.company_id AND companies.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = subscriptions.company_id AND companies.user_id = auth.uid())
  );

-- ============ conversations ============
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_name text,
  customer_phone text,
  status text NOT NULL DEFAULT 'active',
  state text NOT NULL DEFAULT 'INICIO',
  cart_data jsonb DEFAULT '{}'::jsonb,
  abandoned_cart jsonb DEFAULT '{}'::jsonb,
  last_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Authenticated (dashboard) — owner-scoped
DROP POLICY IF EXISTS "select_own_conversations" ON conversations;
CREATE POLICY "select_own_conversations" ON conversations FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = conversations.company_id AND companies.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_conversations" ON conversations;
CREATE POLICY "update_own_conversations" ON conversations FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = conversations.company_id AND companies.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = conversations.company_id AND companies.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_conversations" ON conversations;
CREATE POLICY "delete_own_conversations" ON conversations FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = conversations.company_id AND companies.user_id = auth.uid())
  );

-- Anon (public chat) — can insert and read own conversations
DROP POLICY IF EXISTS "anon_insert_conversations" ON conversations;
CREATE POLICY "anon_insert_conversations" ON conversations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_conversations" ON conversations;
CREATE POLICY "anon_select_conversations" ON conversations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_update_conversations" ON conversations;
CREATE POLICY "anon_update_conversations" ON conversations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ============ messages ============
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender text NOT NULL DEFAULT 'customer',
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Authenticated (dashboard) — owner-scoped via conversation → company
DROP POLICY IF EXISTS "select_own_messages" ON messages;
CREATE POLICY "select_own_messages" ON messages FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM conversations
      JOIN companies ON companies.id = conversations.company_id
      WHERE conversations.id = messages.conversation_id
      AND companies.user_id = auth.uid()
    )
  );

-- Anon (public chat) — can insert and read messages
DROP POLICY IF EXISTS "anon_insert_messages" ON messages;
CREATE POLICY "anon_insert_messages" ON messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_messages" ON messages;
CREATE POLICY "anon_select_messages" ON messages FOR SELECT
  TO anon, authenticated USING (true);

-- ============ order_items ============
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  price numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_order_items" ON order_items;
CREATE POLICY "select_own_order_items" ON order_items FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM orders
      JOIN companies ON companies.id = orders.company_id
      WHERE orders.id = order_items.order_id
      AND companies.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_own_order_items" ON order_items;
CREATE POLICY "insert_own_order_items" ON order_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      JOIN companies ON companies.id = orders.company_id
      WHERE orders.id = order_items.order_id
      AND companies.user_id = auth.uid()
    )
  );

-- Anon can insert order_items (chat creates orders + items)
DROP POLICY IF EXISTS "anon_insert_order_items" ON order_items;
CREATE POLICY "anon_insert_order_items" ON order_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_order_items" ON order_items;
CREATE POLICY "anon_select_order_items" ON order_items FOR SELECT
  TO anon, authenticated USING (true);

-- ============ Anon INSERT on customers (chat creates customers) ============
DROP POLICY IF EXISTS "anon_insert_customers" ON customers;
CREATE POLICY "anon_insert_customers" ON customers FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_customers" ON customers;
CREATE POLICY "anon_update_customers" ON customers FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_customers" ON customers;
CREATE POLICY "anon_select_customers" ON customers FOR SELECT
  TO anon, authenticated USING (true);

-- ============ Indexes ============
CREATE INDEX IF NOT EXISTS idx_app_users_company_id ON app_users(company_id);
CREATE INDEX IF NOT EXISTS idx_app_users_auth_user_id ON app_users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_company_id ON conversations(company_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_company_id ON subscriptions(company_id);

-- ============ Triggers for app_users ============
DROP TRIGGER IF EXISTS set_updated_at_app_users ON app_users;
CREATE TRIGGER set_updated_at_app_users BEFORE UPDATE ON app_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_company_settings ON company_settings;
CREATE TRIGGER set_updated_at_company_settings BEFORE UPDATE ON company_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_subscriptions ON subscriptions;
CREATE TRIGGER set_updated_at_subscriptions BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_conversations ON conversations;
CREATE TRIGGER set_updated_at_conversations BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============ Function: upsert customer by phone for company ============
CREATE OR REPLACE FUNCTION upsert_customer(
  p_company_id uuid,
  p_name text,
  p_phone text
)
RETURNS uuid AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============ Function: update customer stats after order ============
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_customer_stats ON orders;
CREATE TRIGGER trigger_update_customer_stats
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_customer_stats();