/*
# Seed: Flux Burger demo company

Creates a demo hamburgueria "Flux Burger" with categories, products, and settings.
This company has no auth user (user_id IS NULL) — it's a public demo.
*/

-- Insert demo company
INSERT INTO companies (name, slug, plan, phone, address, hours, delivery_fee, welcome_message, brand_color)
SELECT 'Flux Burger', 'flux-burger', 'pro', '(11) 3333-4444', 'Av. Paulista, 1000, São Paulo', 'Seg-Dom 18h-23h', 5.00, 'Olá! Bem-vindo(a) ao Flux Burger! Sou seu assistente virtual. Posso te ajudar a fazer um pedido. Quer ver nosso cardápio?', '#f97316'
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE slug = 'flux-burger' AND deleted_at IS NULL);

-- Create categories and products
DO $$
DECLARE
  flux_company_id uuid;
  cat_burger uuid;
  cat_combo uuid;
  cat_batata uuid;
  cat_bebida uuid;
  cat_sobremesa uuid;
BEGIN
  SELECT id INTO flux_company_id FROM companies WHERE slug = 'flux-burger' AND deleted_at IS NULL LIMIT 1;
  IF flux_company_id IS NULL THEN RETURN; END IF;

  -- Categories
  INSERT INTO categories (company_id, name, slug)
  SELECT flux_company_id, 'Hambúrgueres', 'hamburgueres'
  WHERE NOT EXISTS (SELECT 1 FROM categories WHERE company_id = flux_company_id AND name = 'Hambúrgueres' AND deleted_at IS NULL);
  SELECT id INTO cat_burger FROM categories WHERE company_id = flux_company_id AND name = 'Hambúrgueres' AND deleted_at IS NULL LIMIT 1;

  INSERT INTO categories (company_id, name, slug)
  SELECT flux_company_id, 'Combos', 'combos'
  WHERE NOT EXISTS (SELECT 1 FROM categories WHERE company_id = flux_company_id AND name = 'Combos' AND deleted_at IS NULL);
  SELECT id INTO cat_combo FROM categories WHERE company_id = flux_company_id AND name = 'Combos' AND deleted_at IS NULL LIMIT 1;

  INSERT INTO categories (company_id, name, slug)
  SELECT flux_company_id, 'Batatas', 'batatas'
  WHERE NOT EXISTS (SELECT 1 FROM categories WHERE company_id = flux_company_id AND name = 'Batatas' AND deleted_at IS NULL);
  SELECT id INTO cat_batata FROM categories WHERE company_id = flux_company_id AND name = 'Batatas' AND deleted_at IS NULL LIMIT 1;

  INSERT INTO categories (company_id, name, slug)
  SELECT flux_company_id, 'Bebidas', 'bebidas'
  WHERE NOT EXISTS (SELECT 1 FROM categories WHERE company_id = flux_company_id AND name = 'Bebidas' AND deleted_at IS NULL);
  SELECT id INTO cat_bebida FROM categories WHERE company_id = flux_company_id AND name = 'Bebidas' AND deleted_at IS NULL LIMIT 1;

  INSERT INTO categories (company_id, name, slug)
  SELECT flux_company_id, 'Sobremesas', 'sobremesas'
  WHERE NOT EXISTS (SELECT 1 FROM categories WHERE company_id = flux_company_id AND name = 'Sobremesas' AND deleted_at IS NULL);
  SELECT id INTO cat_sobremesa FROM categories WHERE company_id = flux_company_id AND name = 'Sobremesas' AND deleted_at IS NULL LIMIT 1;

  -- Products (only if not already existing)
  INSERT INTO products (company_id, category_id, name, description, price, is_available, is_featured, prep_time)
  SELECT flux_company_id, cat_burger, 'X-Burger', 'Hambúrguer artesanal 150g, queijo cheddar, alface, tomate', 18.90, true, true, '15 min'
  WHERE NOT EXISTS (SELECT 1 FROM products WHERE company_id = flux_company_id AND name = 'X-Burger' AND deleted_at IS NULL);

  INSERT INTO products (company_id, category_id, name, description, price, is_available, is_featured, prep_time)
  SELECT flux_company_id, cat_burger, 'X-Bacon', 'Hambúrguer 150g, bacon crocante, queijo cheddar, molho especial', 24.90, true, true, '18 min'
  WHERE NOT EXISTS (SELECT 1 FROM products WHERE company_id = flux_company_id AND name = 'X-Bacon' AND deleted_at IS NULL);

  INSERT INTO products (company_id, category_id, name, description, price, is_available, is_featured, prep_time)
  SELECT flux_company_id, cat_burger, 'X-Tudo', 'Hambúrguer 180g, bacon, ovo, queijo, salada completa', 29.90, true, false, '20 min'
  WHERE NOT EXISTS (SELECT 1 FROM products WHERE company_id = flux_company_id AND name = 'X-Tudo' AND deleted_at IS NULL);

  INSERT INTO products (company_id, category_id, name, description, price, is_available, is_featured, prep_time)
  SELECT flux_company_id, cat_combo, 'Combo X-Burger', 'X-Burger + Batata frita + Refrigerante lata', 32.90, true, true, '20 min'
  WHERE NOT EXISTS (SELECT 1 FROM products WHERE company_id = flux_company_id AND name = 'Combo X-Burger' AND deleted_at IS NULL);

  INSERT INTO products (company_id, category_id, name, description, price, is_available, is_featured, prep_time)
  SELECT flux_company_id, cat_combo, 'Combo X-Bacon', 'X-Bacon + Batata frita + Refrigerante lata', 38.90, true, false, '20 min'
  WHERE NOT EXISTS (SELECT 1 FROM products WHERE company_id = flux_company_id AND name = 'Combo X-Bacon' AND deleted_at IS NULL);

  INSERT INTO products (company_id, category_id, name, description, price, is_available, is_featured, prep_time)
  SELECT flux_company_id, cat_batata, 'Batata Frita', 'Porção de batata frita crocante (300g)', 12.00, true, false, '8 min'
  WHERE NOT EXISTS (SELECT 1 FROM products WHERE company_id = flux_company_id AND name = 'Batata Frita' AND deleted_at IS NULL);

  INSERT INTO products (company_id, category_id, name, description, price, is_available, is_featured, prep_time)
  SELECT flux_company_id, cat_batata, 'Batata Cheddar Bacon', 'Batata frita com cheddar cremoso e bacon', 18.00, true, true, '10 min'
  WHERE NOT EXISTS (SELECT 1 FROM products WHERE company_id = flux_company_id AND name = 'Batata Cheddar Bacon' AND deleted_at IS NULL);

  INSERT INTO products (company_id, category_id, name, description, price, is_available, is_featured, prep_time)
  SELECT flux_company_id, cat_bebida, 'Refrigerante Lata', 'Coca-Cola, Guaraná ou Sprite 350ml', 6.00, true, false, '1 min'
  WHERE NOT EXISTS (SELECT 1 FROM products WHERE company_id = flux_company_id AND name = 'Refrigerante Lata' AND deleted_at IS NULL);

  INSERT INTO products (company_id, category_id, name, description, price, is_available, is_featured, prep_time)
  SELECT flux_company_id, cat_bebida, 'Suco Natural', 'Laranja ou limão 500ml', 8.00, true, false, '3 min'
  WHERE NOT EXISTS (SELECT 1 FROM products WHERE company_id = flux_company_id AND name = 'Suco Natural' AND deleted_at IS NULL);

  INSERT INTO products (company_id, category_id, name, description, price, is_available, is_featured, prep_time)
  SELECT flux_company_id, cat_sobremesa, 'Milkshake', 'Milkshake cremoso 400ml (chocolate, morango, caramelo)', 15.00, true, true, '5 min'
  WHERE NOT EXISTS (SELECT 1 FROM products WHERE company_id = flux_company_id AND name = 'Milkshake' AND deleted_at IS NULL);

  INSERT INTO products (company_id, category_id, name, description, price, is_available, is_featured, prep_time)
  SELECT flux_company_id, cat_sobremesa, 'Sundae', 'Sorvete com calda de chocolate e granulado', 9.00, true, false, '3 min'
  WHERE NOT EXISTS (SELECT 1 FROM products WHERE company_id = flux_company_id AND name = 'Sundae' AND deleted_at IS NULL);

  -- Company settings
  INSERT INTO company_settings (company_id, company_name, welcome_message, brand_color)
  SELECT flux_company_id, 'Flux Burger', 'Olá! Bem-vindo(a) ao Flux Burger! Sou seu assistente virtual. Posso te ajudar a fazer um pedido. Quer ver nosso cardápio?', '#f97316'
  WHERE NOT EXISTS (SELECT 1 FROM company_settings WHERE company_id = flux_company_id);

END $$;