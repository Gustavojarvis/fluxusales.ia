/*
# FluxSales AI — Core Schema (multi-tenant)

1. New Tables
- `companies` — one company per authenticated user (owner). Fields: id, name, slug, user_id (owner), plan, created_at, updated_at, deleted_at.
- `categories` — product categories scoped to a company. Fields: id, company_id, name, slug, created_at, updated_at, deleted_at.
- `products` — menu items scoped to a company. Fields: id, company_id, category_id, name, description, price, image_url, is_available, is_featured, sku, prep_time, created_at, updated_at, deleted_at.
- `customers` — customer records scoped to a company. Fields: id, company_id, name, email, phone, created_at, updated_at, deleted_at.
- `orders` — orders scoped to a company. Fields: id, company_id, customer_id, status, total, items (jsonb), created_at, updated_at, deleted_at.

2. Security
- RLS enabled on every table.
- `companies`: owner-scoped via user_id = auth.uid().
- All child tables: scoped via EXISTS check against companies.user_id = auth.uid().
- 4 policies per table (SELECT/INSERT/UPDATE/DELETE), TO authenticated.
- Owner columns default to auth.uid() so client inserts that omit the owner still satisfy WITH CHECK.

3. Notes
- Soft delete via deleted_at column on every table (nullable timestamptz).
- updated_at maintained by application; created_at defaults to now().
- All queries in the app filter deleted_at IS NULL.
*/

-- ============ companies ============
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'starter',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_companies" ON companies;
CREATE POLICY "select_own_companies" ON companies FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_companies" ON companies;
CREATE POLICY "insert_own_companies" ON companies FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_companies" ON companies;
CREATE POLICY "update_own_companies" ON companies FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_companies" ON companies;
CREATE POLICY "delete_own_companies" ON companies FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ categories ============
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_categories" ON categories;
CREATE POLICY "select_own_categories" ON categories FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = categories.company_id AND companies.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_categories" ON categories;
CREATE POLICY "insert_own_categories" ON categories FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = categories.company_id AND companies.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_categories" ON categories;
CREATE POLICY "update_own_categories" ON categories FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = categories.company_id AND companies.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = categories.company_id AND companies.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_categories" ON categories;
CREATE POLICY "delete_own_categories" ON categories FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = categories.company_id AND companies.user_id = auth.uid())
  );

-- ============ products ============
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  image_url text,
  is_available boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  sku text,
  prep_time text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_products" ON products;
CREATE POLICY "select_own_products" ON products FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = products.company_id AND companies.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_products" ON products;
CREATE POLICY "insert_own_products" ON products FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = products.company_id AND companies.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_products" ON products;
CREATE POLICY "update_own_products" ON products FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = products.company_id AND companies.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = products.company_id AND companies.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_products" ON products;
CREATE POLICY "delete_own_products" ON products FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = products.company_id AND companies.user_id = auth.uid())
  );

-- ============ customers ============
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_customers" ON customers;
CREATE POLICY "select_own_customers" ON customers FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = customers.company_id AND companies.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_customers" ON customers;
CREATE POLICY "insert_own_customers" ON customers FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = customers.company_id AND companies.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_customers" ON customers;
CREATE POLICY "update_own_customers" ON customers FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = customers.company_id AND companies.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = customers.company_id AND companies.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_customers" ON customers;
CREATE POLICY "delete_own_customers" ON customers FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = customers.company_id AND companies.user_id = auth.uid())
  );

-- ============ orders ============
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  total numeric(10,2) NOT NULL DEFAULT 0,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_orders" ON orders;
CREATE POLICY "select_own_orders" ON orders FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = orders.company_id AND companies.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_orders" ON orders;
CREATE POLICY "insert_own_orders" ON orders FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = orders.company_id AND companies.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_orders" ON orders;
CREATE POLICY "update_own_orders" ON orders FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = orders.company_id AND companies.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = orders.company_id AND companies.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_orders" ON orders;
CREATE POLICY "delete_own_orders" ON orders FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = orders.company_id AND companies.user_id = auth.uid())
  );

-- ============ Indexes ============
CREATE INDEX IF NOT EXISTS idx_categories_company_id ON categories(company_id);
CREATE INDEX IF NOT EXISTS idx_products_company_id ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_orders_company_id ON orders(company_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- ============ updated_at trigger function ============
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_companies ON companies;
CREATE TRIGGER set_updated_at_companies BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_categories ON categories;
CREATE TRIGGER set_updated_at_categories BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_products ON products;
CREATE TRIGGER set_updated_at_products BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_customers ON customers;
CREATE TRIGGER set_updated_at_customers BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_orders ON orders;
CREATE TRIGGER set_updated_at_orders BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();