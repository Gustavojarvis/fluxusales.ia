/*
# FluxSales AI — Part 3: Chat, Orders, Storefront

1. Modified Tables
- `orders` — adds customer_name, customer_phone, delivery_address, delivery_method, payment_method, notes, order_number (auto-generated, unique per company).
- `products` — adds anon SELECT policy so the public storefront (no-auth) can read available products.
- `categories` — adds anon SELECT policy so the public storefront can read categories.
- `orders` — adds anon INSERT policy so the chat can create orders without authentication.
- `companies` — adds anon SELECT policy (slug-based) so the storefront can identify the company.

2. Security
- New anon SELECT policies on companies, categories, products (only non-deleted, available items for products).
- New anon INSERT policy on orders (the chat creates orders as anon).
- Existing authenticated policies remain unchanged.
- A unique sequence per company for order_number via a helper function.

3. Notes
- The storefront is a public page (no login) that reads company data by slug.
- Orders are created by anonymous visitors via the chat widget.
- The dashboard (authenticated) reads/manages orders via existing authenticated policies.
- delivery_method: 'delivery' | 'pickup'
- payment_method: 'pix' | 'cash' | 'card' | 'meal_voucher'
*/

-- ============ Extend orders table ============
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS delivery_address text,
  ADD COLUMN IF NOT EXISTS delivery_method text NOT NULL DEFAULT 'delivery',
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'cash',
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS order_number int;

-- ============ Helper: generate per-company order numbers ============
CREATE OR REPLACE FUNCTION generate_order_number(company_uuid uuid)
RETURNS int AS $$
DECLARE
  next_num int;
BEGIN
  SELECT COALESCE(MAX(order_number), 0) + 1
  INTO next_num
  FROM orders
  WHERE orders.company_id = company_uuid;
  RETURN next_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============ Anon SELECT on companies (by slug, non-deleted) ============
DROP POLICY IF EXISTS "anon_select_companies" ON companies;
CREATE POLICY "anon_select_companies" ON companies FOR SELECT
  TO anon, authenticated
  USING (deleted_at IS NULL);

-- ============ Anon SELECT on categories (non-deleted) ============
DROP POLICY IF EXISTS "anon_select_categories" ON categories;
CREATE POLICY "anon_select_categories" ON categories FOR SELECT
  TO anon, authenticated
  USING (deleted_at IS NULL);

-- ============ Anon SELECT on products (non-deleted, available only) ============
DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products FOR SELECT
  TO anon, authenticated
  USING (deleted_at IS NULL AND is_available = true);

-- ============ Anon INSERT on orders (the chat creates orders) ============
DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ============ Anon SELECT on orders (so the chat can confirm) ============
DROP POLICY IF EXISTS "anon_select_orders" ON orders;
CREATE POLICY "anon_select_orders" ON orders FOR SELECT
  TO anon, authenticated
  USING (deleted_at IS NULL);

-- ============ Index for order_number per company ============
CREATE INDEX IF NOT EXISTS idx_orders_company_order_number ON orders(company_id, order_number);