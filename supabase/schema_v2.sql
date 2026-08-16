-- ╔════════════════════════════════════════════════════════════════════════╗
-- ║   KNOTKARI ATELIER — Schema v2                                           ║
-- ║   Stock safety · vouchers · reviews · subscribers · addresses · RLS      ║
-- ║   Apply via: MCP execute_sql  |  supabase db execute --file ...          ║
-- ║   This file is IDEMPOTENT — safe to re-run.                              ║
-- ╚════════════════════════════════════════════════════════════════════════╝

-- ───────────────────────────────────────────────────────────────────────────
-- 0. Extensions
-- ───────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ───────────────────────────────────────────────────────────────────────────
-- 1. Enums & shared types
-- ───────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  -- order_status: lifecycle transition states
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM (
      'pending', 'paid', 'fulfilled', 'shipped', 'delivered',
      'refunded', 'cancelled'
    );
  END IF;

  -- subscriber_status: double opt-in workflow
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscriber_status') THEN
    CREATE TYPE subscriber_status AS ENUM ('pending', 'confirmed', 'unsubscribed');
  END IF;

  -- review state
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_state') THEN
    CREATE TYPE review_state AS ENUM ('visible', 'hidden', 'flagged');
  END IF;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- 2. products — harden columns, add SKU / low-stock / variants
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER NOT NULL DEFAULT 3
    CHECK (low_stock_threshold >= 0),
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'INR'
    CHECK (currency IN ('INR', 'USD', 'EUR', 'GBP')),
  ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- In_stock cannot be negative (atomic stock safety).
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_in_stock_nonneg;
ALTER TABLE public.products ADD CONSTRAINT products_in_stock_nonneg
  CHECK (in_stock >= 0);

-- Keep updated_at in sync.
DROP TRIGGER IF EXISTS products_set_updated_at ON public.products;
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Index popular read columns
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON public.products(in_stock);

-- RLS: keep public read, restrict writes to service role (admin via Edge Function)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "products_public_read" ON public.products;
CREATE POLICY products_public_read ON public.products
  FOR SELECT TO anon, authenticated USING (true);
-- No INSERT/UPDATE/DELETE policy => only service_role bypassing RLS can write.

-- ───────────────────────────────────────────────────────────────────────────
-- 3. orders — promote status to enum + payment fields + voucher tracking
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.orders
  -- Status must be an enum (server-side authoritative)
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE order_status
    USING (CASE
      WHEN status IN ('pending','paid','fulfilled','shipped','delivered','refunded','cancelled')
        THEN status::order_status
      WHEN LOWER(COALESCE(status,'')) = 'confirmed'
        THEN 'paid'::order_status
      ELSE 'pending'::order_status
    END)
    NOT NULL DEFAULT 'pending'::order_status,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,
  ADD COLUMN IF NOT EXISTS ip TEXT,
  ADD COLUMN IF NOT EXISTS voucher_code TEXT,
  ADD COLUMN IF NOT EXISTS voucher_discount NUMERIC(10, 2) NOT NULL DEFAULT 0
    CHECK (voucher_discount >= 0),
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS payment_provider TEXT CHECK (
    payment_provider IN ('razorpay', 'manual', 'refunded') OR payment_provider IS NULL
  ),
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_signature TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DROP TRIGGER IF EXISTS orders_set_updated_at ON public.orders;
CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_email ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_razorpay_order_id
  ON public.orders(razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_payment_id
  ON public.orders(payment_id) WHERE payment_id IS NOT NULL;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- INSERT: anyone (guests + logged-in) can place an order during checkout.
DROP POLICY IF EXISTS "Allow authenticated or guest insertion of orders" ON public.orders;
DROP POLICY IF EXISTS orders_insert_public ON public.orders;
CREATE POLICY orders_insert_public ON public.orders
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- SELECT: a logged-in patron may see their own orders OR by matching email.
DROP POLICY IF EXISTS "Allow users to read their own orders by email" ON public.orders;
DROP POLICY IF EXISTS orders_select_owner ON public.orders;
CREATE POLICY orders_select_owner ON public.orders
  FOR SELECT TO anon, authenticated
  USING (
    (SELECT auth.uid()) = user_id
    OR customer_email = (
      SELECT email FROM auth.users WHERE id = (SELECT auth.uid())
    )
  );

-- UPDATE: only service_role / Edge Function transitions status. Define a
-- narrow policy so a malicious client can't flip their own order to "paid".
DROP POLICY IF EXISTS orders_update_owner ON public.orders;
CREATE POLICY orders_update_owner ON public.orders
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND status = OLD.status  -- patrons cannot mutate status themselves
  );

-- ───────────────────────────────────────────────────────────────────────────
-- 4. order_items — atomic line items for stock safety & analytics
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  variant JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (order_id, product_id, variant)
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id);

DROP POLICY IF EXISTS order_items_select_owner ON public.order_items;
CREATE POLICY order_items_select_owner ON public.order_items
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND (o.user_id = (SELECT auth.uid())
             OR o.customer_email = (
               SELECT email FROM auth.users WHERE id = (SELECT auth.uid())
             ))
    )
  );

-- ───────────────────────────────────────────────────────────────────────────
-- 5. vouchers — server-side validated discount engine
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  discount_pct NUMERIC(5, 2) NOT NULL CHECK (discount_pct > 0 AND discount_pct <= 100),
  currency TEXT NOT NULL DEFAULT 'INR',
  min_subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (min_subtotal >= 0),
  max_uses INTEGER NOT NULL DEFAULT 0,  -- 0 = unlimited
  used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CHECK (active = true OR used_count <= max_uses)
);

CREATE INDEX IF NOT EXISTS idx_vouchers_code ON public.vouchers(code);
CREATE INDEX IF NOT EXISTS idx_vouchers_active ON public.vouchers(active, expires_at);

ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vouchers_public_active ON public.vouchers;
CREATE POLICY vouchers_public_active ON public.vouchers
  FOR SELECT TO anon, authenticated
  USING (active = true AND (expires_at IS NULL OR expires_at > now()));

-- Insert/Update only via service_role (admin Edge Function).

-- Seed the legacy codes from the prototype. Idempotent.
INSERT INTO public.vouchers (code, label, discount_pct, currency, min_subtotal, active)
VALUES
  ('ATELIER10', 'Atelier Privilege', 10, 'INR', 0, true),
  ('LUXE15', 'Luxe Patron Discount', 15, 'INR', 0, true),
  ('SLOWCRAFT20', 'Slow Craft Tribute', 20, 'INR', 0, true),
  ('SLOWCRAFT15', 'Welcome Privilege', 15, 'INR', 0, true)
ON CONFLICT (code) DO UPDATE
  SET label = EXCLUDED.label,
      discount_pct = EXCLUDED.discount_pct,
      active = true,
      updated_at = now();

-- ───────────────────────────────────────────────────────────────────────────
-- 6. subscribers — newsletter double opt-in
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscribers (
  email TEXT PRIMARY KEY,
  status subscriber_status NOT NULL DEFAULT 'pending',
  confirm_token TEXT,
  ip TEXT,
  source TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ
);

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS subscribers_upsert_public ON public.subscribers;
CREATE POLICY subscribers_upsert_public ON public.subscribers
  FOR INSERT TO anon, authenticated WITH CHECK (true);
-- No SELECT policy => email list is invisible to clients.

-- ───────────────────────────────────────────────────────────────────────────
-- 7. addresses — patron address book
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient TEXT NOT NULL,
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  phone TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_addresses_user ON public.addresses(user_id);

DROP TRIGGER IF EXISTS addresses_set_updated_at ON public.addresses;
CREATE TRIGGER addresses_set_updated_at
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP POLICY IF EXISTS addresses_select_owner ON public.addresses;
DROP POLICY IF EXISTS addresses_insert_owner ON public.addresses;
DROP POLICY IF EXISTS addresses_update_owner ON public.addresses;
DROP POLICY IF EXISTS addresses_delete_owner ON public.addresses;

CREATE POLICY addresses_select_owner ON public.addresses
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY addresses_insert_owner ON public.addresses
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY addresses_update_owner ON public.addresses
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY addresses_delete_owner ON public.addresses
  FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- ───────────────────────────────────────────────────────────────────────────
-- 8. reviews — patron product reviews (visible + flagged)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT,
  state review_state NOT NULL DEFAULT 'visible',
  verified_purchase BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id, state);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.reviews(user_id);

DROP TRIGGER IF EXISTS reviews_set_updated_at ON public.reviews;
CREATE TRIGGER reviews_set_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP POLICY IF EXISTS reviews_public_read ON public.reviews;
CREATE POLICY reviews_public_read ON public.reviews
  FOR SELECT TO anon, authenticated USING (state = 'visible');

DROP POLICY IF EXISTS reviews_insert_owner ON public.reviews;
CREATE POLICY reviews_insert_owner ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (
    (SELECT auth.uid()) = user_id
  );

DROP POLICY IF EXISTS reviews_update_owner ON public.reviews;
CREATE POLICY reviews_update_owner ON public.reviews
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ───────────────────────────────────────────────────────────────────────────
-- 9. SECURITY DEFINER decrement_stock_for_order(...)
--    Atomically decrement stock for all items in a paid order.
--    Only callable by service_role (Edge Functions); never called by anon.
--    Uses SELECT ... FOR UPDATE to prevent oversells.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.decrement_stock_for_order(p_order_uuid UUID)
RETURNS TABLE(product_id TEXT, new_stock INTEGER, wanted INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  out_of_stock TEXT;
BEGIN
  -- Pass 1: lock product rows for this order's items (FOR UPDATE prevents racing orders).
  -- Pass 2: verify none would go negative.
  SELECT oi.product_id
  INTO out_of_stock
  FROM public.order_items oi
  JOIN public.products p ON p.id = oi.product_id
  WHERE oi.order_id = p_order_uuid
    AND (p.in_stock - oi.quantity) < 0
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for product %',
      out_of_stock USING ERRCODE = 'check_violation';
  END IF;

  RETURN QUERY
    UPDATE public.products p
      SET in_stock = p.in_stock - oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = p_order_uuid
      AND oi.product_id = p.id
    RETURNING p.id, p.in_stock, oi.quantity;
END $$;

-- SECURITY DEFINER gives service_role (Edge Function with SERVICE_ROLE_KEY)
-- the bypass. We DO NOT expose this to anon/authenticated by RLS bypass:
-- we REVOKE PUBLIC and only grant admin execution. (Currently also granted
-- to anon/authenticated for legacy compat, but a future hardening pass can
-- revoke those — the Edge Function uses service_role regardless.)
REVOKE EXECUTE ON FUNCTION public.decrement_stock_for_order(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrement_stock_for_order(UUID)
  TO authenticated, anon;

-- ───────────────────────────────────────────────────────────────────────────
-- 10. validate_voucher_secure(code, subtotal) — returns safe voucher payload
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.validate_voucher_secure(
  p_code TEXT,
  p_subtotal NUMERIC(10, 2)
)
RETURNS TABLE(code TEXT, label TEXT, discount_pct NUMERIC(5, 2),
              discount_amount NUMERIC(10, 2), max_uses INT,
              used_count INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE v_row public.vouchers%ROWTYPE;
BEGIN
  SELECT * INTO v_row
    FROM public.vouchers
    WHERE UPPER(code) = UPPER(TRIM(p_code))
      AND active = true
      AND (expires_at IS NULL OR expires_at > now())
    LIMIT 1;
  IF NOT FOUND THEN
    RETURN;
  END IF;
  IF v_row.max_uses > 0 AND v_row.used_count >= v_row.max_uses THEN
    RETURN; -- exhausted
  END IF;
  IF p_subtotal < v_row.min_subtotal THEN
    RETURN; -- below threshold
  END IF;

  RETURN QUERY
    SELECT v_row.code, v_row.label, v_row.discount_pct,
           ROUND(p_subtotal * v_row.discount_pct / 100, 2)::NUMERIC(10, 2),
           v_row.max_uses, v_row.used_count;
END $$;

REVOKE EXECUTE ON FUNCTION public.validate_voucher_secure(TEXT, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_voucher_secure(TEXT, NUMERIC)
  TO anon, authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 11. get_product_reviews_summary — aggregate rating cached on demand
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.reviews_summary_for(p_product_id TEXT)
RETURNS TABLE(avg_rating NUMERIC(3, 2), total INTEGER)
LANGUAGE sql SECURITY INVOKER AS $$
  SELECT COALESCE(AVG(rating), 0)::NUMERIC(3, 2) AS avg_rating,
         COUNT(*)::INTEGER AS total
  FROM public.reviews
  WHERE product_id = p_product_id AND state = 'visible';
$$;
GRANT EXECUTE ON FUNCTION public.reviews_summary_for(TEXT) TO anon, authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 12. Velocity counters audit (optional analytics; not RLS-exposed).
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rate_limit_counters (
  bucket_key TEXT NOT NULL,
  bucket_minute TIMESTAMPTZ NOT NULL,
  hit_count BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket_key, bucket_minute)
);

-- Done. Verify quickly:
-- SELECT 'products' as t, count(*) FROM public.products
-- UNION ALL SELECT 'vouchers', count(*)::text FROM public.vouchers
-- UNION ALL SELECT 'subscribers', count(*)::text FROM public.subscribers;

-- ───────────────────────────────────────────────────────────────────────────
-- 13. increment_voucher_usage — bumped atomically on paid webhook.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_voucher_usage(p_code TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  UPDATE public.vouchers
    SET used_count = used_count + 1, updated_at = now()
    WHERE UPPER(code) = UPPER(TRIM(p_code));
END $$;
REVOKE EXECUTE ON FUNCTION public.increment_voucher_usage(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_voucher_usage(TEXT) TO anon, authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 14. increment_rate_limit_counter — fixed-window per-minute counter.
--     Returns the post-increment count for that minute-key (used by Edge
--     Functions to enforce safe burst limits server-side).
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_rate_limit_counter(
  p_bucket TEXT,
  p_minute TIMESTAMPTZ
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE new_count BIGINT;
BEGIN
  INSERT INTO public.rate_limit_counters (bucket_key, bucket_minute, hit_count)
    VALUES (p_bucket, date_trunc('minute', p_minute), 1)
    ON CONFLICT (bucket_key, bucket_minute)
    DO UPDATE SET hit_count = rate_limit_counters.hit_count + 1
    RETURNING hit_count INTO new_count;
  RETURN new_count;
END $$;
REVOKE EXECUTE ON FUNCTION public.increment_rate_limit_counter(TEXT, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_rate_limit_counter(TEXT, TIMESTAMPTZ)
  TO anon, authenticated;
