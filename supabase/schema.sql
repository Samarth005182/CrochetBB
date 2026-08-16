-- ╔════════════════════════════════════════════════════════════════════════╗
-- ║   KNOTKARI ATELIER — Master Database Schema v3                         ║
-- ║   Unified Email-Associated Relational Schema with Full Audit History    ║
-- ║   Project Ref: abrueeofowwpdpokdlba                                    ║
-- ║   Run in Supabase Dashboard -> SQL Editor                              ║
-- ╚════════════════════════════════════════════════════════════════════════╝

-- ───────────────────────────────────────────────────────────────────────────
-- 0. Extensions
-- ───────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ───────────────────────────────────────────────────────────────────────────
-- 1. Drop existing tables cleanly in reverse dependency order
-- ───────────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.payment_history CASCADE;
DROP TABLE IF EXISTS public.order_payments CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.addresses CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.vouchers CASCADE;
DROP TABLE IF EXISTS public.subscribers CASCADE;
DROP TABLE IF EXISTS public.rate_limit_counters CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;

-- ───────────────────────────────────────────────────────────────────────────
-- 2. Types & Enums
-- ───────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM (
      'pending', 'paid', 'fulfilled', 'shipped', 'delivered', 'refunded', 'cancelled'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscriber_status') THEN
    CREATE TYPE subscriber_status AS ENUM ('pending', 'confirmed', 'unsubscribed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_state') THEN
    CREATE TYPE review_state AS ENUM ('visible', 'hidden', 'flagged');
  END IF;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- 3. Profiles (Patrons / Users) — Keyed by mandatory unique Email
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    bio TEXT,
    avatar TEXT,
    tier TEXT NOT NULL DEFAULT 'Knotkari Master Patron',
    reward_points INTEGER NOT NULL DEFAULT 200 CHECK (reward_points >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_public_read" ON public.profiles
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "profiles_insert" ON public.profiles
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "profiles_update" ON public.profiles
    FOR UPDATE TO anon, authenticated
    USING (
      (SELECT auth.uid()) = user_id
      OR email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
      OR auth.uid() IS NULL
    )
    WITH CHECK (true);

-- ───────────────────────────────────────────────────────────────────────────
-- 4. Products Table (Slow-Fashion Artisan Catalog)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    subtitle TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    mrp NUMERIC(10, 2),
    category TEXT NOT NULL,
    badge TEXT,
    badge_type TEXT DEFAULT 'highlight',
    image_url TEXT NOT NULL,
    alt TEXT,
    description TEXT,
    yarn_type TEXT,
    dimensions TEXT,
    craft_hours TEXT,
    artisan_notes TEXT,
    care_instructions TEXT,
    rating NUMERIC(3, 2) DEFAULT 4.9,
    reviews_count INT DEFAULT 0,
    in_stock INT NOT NULL DEFAULT 15 CHECK (in_stock >= 0),
    low_stock_threshold INT NOT NULL DEFAULT 3,
    featured BOOLEAN DEFAULT true,
    currency TEXT NOT NULL DEFAULT 'INR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_public_read" ON public.products
    FOR SELECT TO anon, authenticated USING (true);

-- ───────────────────────────────────────────────────────────────────────────
-- 5. Customer Addresses (Associated to compulsory user email)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email TEXT NOT NULL REFERENCES public.profiles(email) ON DELETE CASCADE ON UPDATE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    street TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'India',
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_addresses_email ON public.addresses(user_email);
CREATE INDEX idx_addresses_user_id ON public.addresses(user_id);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "addresses_read_by_owner" ON public.addresses
    FOR SELECT TO anon, authenticated
    USING (
      user_email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
      OR (SELECT auth.uid()) = user_id
      OR auth.uid() IS NULL
    );

CREATE POLICY "addresses_insert_by_owner" ON public.addresses
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "addresses_update_by_owner" ON public.addresses
    FOR UPDATE TO anon, authenticated
    USING (
      user_email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
      OR (SELECT auth.uid()) = user_id
      OR auth.uid() IS NULL
    )
    WITH CHECK (true);

CREATE POLICY "addresses_delete_by_owner" ON public.addresses
    FOR DELETE TO anon, authenticated
    USING (
      user_email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
      OR (SELECT auth.uid()) = user_id
      OR auth.uid() IS NULL
    );

-- ───────────────────────────────────────────────────────────────────────────
-- 6. Orders (Associated to compulsory customer email)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    tracking_number TEXT NOT NULL,
    customer_email TEXT NOT NULL REFERENCES public.profiles(email) ON DELETE RESTRICT ON UPDATE CASCADE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    shipping_address JSONB NOT NULL,
    delivery_method TEXT NOT NULL DEFAULT 'Standard Atelier Delivery',
    items JSONB NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    shipping NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (shipping >= 0),
    tax NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
    total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
    voucher_code TEXT,
    voucher_discount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (voucher_discount >= 0),
    status order_status NOT NULL DEFAULT 'paid',
    payment_provider TEXT NOT NULL DEFAULT 'razorpay',
    payment_id TEXT,
    razorpay_order_id TEXT,
    gift_note TEXT,
    artisan TEXT DEFAULT 'Master Karigar Rajeshwari',
    paid_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_orders_email ON public.orders(customer_email);
CREATE INDEX idx_orders_order_num ON public.orders(order_number);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_read_owner" ON public.orders
    FOR SELECT TO anon, authenticated
    USING (
      customer_email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
      OR (SELECT auth.uid()) = user_id
      OR auth.uid() IS NULL
    );

CREATE POLICY "orders_insert_all" ON public.orders
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "orders_update_owner" ON public.orders
    FOR UPDATE TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- ───────────────────────────────────────────────────────────────────────────
-- 7. Payment History (Associated to order & customer email)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.payment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL,
    user_email TEXT NOT NULL REFERENCES public.profiles(email) ON DELETE CASCADE ON UPDATE CASCADE,
    payment_id TEXT NOT NULL,
    gateway TEXT NOT NULL DEFAULT 'razorpay',
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'captured',
    method TEXT DEFAULT 'UPI / Card',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_payment_history_email ON public.payment_history(user_email);
CREATE INDEX idx_payment_history_order ON public.payment_history(order_id);
CREATE INDEX idx_payment_history_payment_id ON public.payment_history(payment_id);

ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_history_read_owner" ON public.payment_history
    FOR SELECT TO anon, authenticated
    USING (
      user_email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
      OR auth.uid() IS NULL
    );

CREATE POLICY "payment_history_insert" ON public.payment_history
    FOR INSERT TO anon, authenticated WITH CHECK (true);

-- ───────────────────────────────────────────────────────────────────────────
-- 8. Order Items (Itemized breakdown for each order)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    product_name TEXT NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    variant JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_order_items_product ON public.order_items(product_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items_read" ON public.order_items
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "order_items_insert" ON public.order_items
    FOR INSERT TO anon, authenticated WITH CHECK (true);

-- ───────────────────────────────────────────────────────────────────────────
-- 9. Vouchers & Discounts
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    description TEXT,
    discount_pct NUMERIC(5, 2) NOT NULL CHECK (discount_pct > 0 AND discount_pct <= 100),
    currency TEXT NOT NULL DEFAULT 'INR',
    min_subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (min_subtotal >= 0),
    max_uses INTEGER NOT NULL DEFAULT 0,
    used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
    active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vouchers_read_active" ON public.vouchers
    FOR SELECT TO anon, authenticated
    USING (active = true AND (expires_at IS NULL OR expires_at > now()));

-- ───────────────────────────────────────────────────────────────────────────
-- 10. Subscribers (Newsletter)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    status subscriber_status NOT NULL DEFAULT 'confirmed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscribers_insert_all" ON public.subscribers
    FOR INSERT TO anon, authenticated WITH CHECK (true);

-- ───────────────────────────────────────────────────────────────────────────
-- 11. Reviews
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_email TEXT REFERENCES public.profiles(email) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title TEXT,
    body TEXT,
    state review_state NOT NULL DEFAULT 'visible',
    verified_purchase BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_read_visible" ON public.reviews
    FOR SELECT TO anon, authenticated USING (state = 'visible');

CREATE POLICY "reviews_insert_authenticated" ON public.reviews
    FOR INSERT TO anon, authenticated WITH CHECK (true);

-- ───────────────────────────────────────────────────────────────────────────
-- 12. Helper Functions & Triggers
-- ───────────────────────────────────────────────────────────────────────────

-- Helper: Ensure user profile exists for any given email
CREATE OR REPLACE FUNCTION public.ensure_user_profile(
    p_email TEXT,
    p_name TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
    v_profile_id UUID;
    v_clean_email TEXT;
    v_display_name TEXT;
BEGIN
    v_clean_email := LOWER(TRIM(p_email));
    v_display_name := COALESCE(NULLIF(TRIM(p_name), ''), SPLIT_PART(v_clean_email, '@', 1));
    
    INSERT INTO public.profiles (email, name, phone)
    VALUES (v_clean_email, v_display_name, p_phone)
    ON CONFLICT (email) DO UPDATE
    SET name = COALESCE(NULLIF(EXCLUDED.name, ''), public.profiles.name),
        phone = COALESCE(NULLIF(EXCLUDED.phone, ''), public.profiles.phone),
        updated_at = now()
    RETURNING id INTO v_profile_id;
    
    RETURN v_profile_id;
END $$;

REVOKE EXECUTE ON FUNCTION public.ensure_user_profile(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_user_profile(TEXT, TEXT, TEXT) TO anon, authenticated;

-- Trigger on auth.users: Automatically create profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, name, phone)
    VALUES (
        NEW.id,
        LOWER(TRIM(NEW.email)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'phone'
    )
    ON CONFLICT (email) DO UPDATE
    SET user_id = EXCLUDED.user_id,
        name = COALESCE(EXCLUDED.name, public.profiles.name),
        updated_at = now();
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Stock decrement helper
CREATE OR REPLACE FUNCTION public.decrement_stock_for_order(p_order_uuid UUID)
RETURNS TABLE(product_id TEXT, new_stock INTEGER, wanted INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  out_of_stock TEXT;
BEGIN
  SELECT oi.product_id
  INTO out_of_stock
  FROM public.order_items oi
  JOIN public.products p ON p.id = oi.product_id
  WHERE oi.order_id = p_order_uuid
    AND (p.in_stock - oi.quantity) < 0
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for product %', out_of_stock USING ERRCODE = 'check_violation';
  END IF;

  RETURN QUERY
    UPDATE public.products p
      SET in_stock = p.in_stock - oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = p_order_uuid
      AND oi.product_id = p.id
    RETURNING p.id, p.in_stock, oi.quantity;
END $$;

REVOKE EXECUTE ON FUNCTION public.decrement_stock_for_order(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrement_stock_for_order(UUID) TO authenticated, anon;

-- Voucher validator helper
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
    RETURN;
  END IF;
  IF p_subtotal < v_row.min_subtotal THEN
    RETURN;
  END IF;

  RETURN QUERY
    SELECT v_row.code, v_row.label, v_row.discount_pct,
           ROUND(p_subtotal * v_row.discount_pct / 100, 2)::NUMERIC(10, 2),
           v_row.max_uses, v_row.used_count;
END $$;

REVOKE EXECUTE ON FUNCTION public.validate_voucher_secure(TEXT, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_voucher_secure(TEXT, NUMERIC) TO anon, authenticated;

-- Increment voucher usage
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
-- 13. Seed Data: 14 Handcrafted Products (INR)
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO public.products (id, name, subtitle, price, mrp, category, badge, badge_type, image_url, alt, description, yarn_type, dimensions, craft_hours, artisan_notes, care_instructions, rating, reviews_count, in_stock, featured)
VALUES
(
    'prod-01-lavender-tulip',
    'Lavender Blossom Crochet Tulip Bouquet',
    'Soft Lilac Petals • Pastel Pink Atelier Wrap',
    180.00,
    250.00,
    'bouquets',
    '#1 Best Seller',
    'bestseller',
    '/images/products/lavender-tulip.jpg',
    'Handmade lavender crochet tulip flower wrapped in pastel pink paper with ribbon',
    'Exquisite handcrafted crochet lavender tulip bouquet nestled in delicate pastel pink wrap and tied with an ivory satin ribbon. Features flexible copper wiring inside the stem for easy positioning in vases and everlasting botanical elegance.',
    '100% Mercerized Egyptian Cotton & Calyx Wiring',
    'Stem Height: 30cm, Tulip Head: 6cm x 5cm',
    '3.5 hours',
    'Hand-looped using fine mercerized cotton for a silky tactile finish that will never wilt, fade, or shed.',
    'Spot clean gently with a dry or slightly damp cotton cloth. Keep dry.',
    4.9,
    142,
    14,
    true
),
(
    'prod-02-sunflower-bloom',
    'Radiant Sunburst Crochet Sunflower Bouquet',
    'Deep Ochre & Cocoa Spiral • Butter Wrap & Coral Ribbon',
    200.00,
    299.00,
    'bouquets',
    'Artisan Spotlight',
    'highlight',
    '/images/products/radiant-sunflower.jpg',
    'Handmade crochet sunflower bouquet wrapped in butter parchment with coral ribbon',
    'A beacon of warmth and optimism. Woven with vibrant golden petals, realistic ribbed leaves, and a textured cocoa spiral center. Wrapped in elegant butter-toned parchment and finished with a gleaming coral satin bow.',
    'Organic Merino & Egyptian Cotton Blend',
    'Flower Head: 12cm diameter, Stem Length: 32cm',
    '4.5 hours',
    'The seed core utilizes an intricate relief stitch that creates rich tactile depth and authentic botanical geometry.',
    'Dust periodically with a soft brush. Keep out of prolonged direct moisture to preserve yarn loft.',
    5.0,
    218,
    8,
    true
),
(
    'prod-03-spring-meadow',
    'Spring Meadow Multi-Floral Crochet Bouquet',
    'Sunflower + Sky Blue Tulip + White Daisies Trio',
    200.00,
    349.00,
    'bouquets',
    'Top Rated Deal',
    'deal',
    '/images/products/spring-meadow.jpg',
    'Multi-flower crochet bouquet with sunflower, blue tulip, and daisies against sky',
    'A handcrafted symphony of meadow blooms: a radiant sunflower, tranquil pastel sky-blue tulip, and sunny white daisies wrapped in dual-tone artisanal wrapping with an ivory satin bow and artisan studio tag.',
    'Organic Combed Cotton & Mulberry Silk Accents',
    'Arrangement Height: 35cm, Span: 22cm',
    '6.0 hours',
    'Each stem is individually wired and tied together to allow flexible arrangement or single-stem display.',
    'Store in a dry room; gentle steam refreshes flower petal volume.',
    4.9,
    96,
    5,
    true
),
(
    'prod-04-daisy-keychain',
    'Artisan Daisy Flower & Leaf Crochet Charm Keychain',
    'Pure White Petals • Golden Core • Polished Keyring',
    150.00,
    199.00,
    'charms',
    'Limited Deal',
    'deal',
    '/images/products/daisy-keychain.jpg',
    'Handmade crochet daisy keychain charm with green leaf and silver metal ring',
    'Everyday tactile luxury. Features a multi-petaled pure white daisy with a sunny yellow textured center and a delicate green leaf charm attached to a sturdy silver keyring. Perfect for bags, keys, or gift hampers.',
    'Mercerized Cotton & Heavy-Duty Alloy Keyring',
    'Daisy Diameter: 7cm, Total Drop: 13cm',
    '2.0 hours',
    'Tight double crochet looping ensures petals retain their crisp shape through daily pocket and purse use.',
    'Spot clean gently with mild soap foam. Avoid submerging metal keyring.',
    4.8,
    310,
    22,
    true
),
(
    'prod-05-celestial-bloom',
    'Celestial Sky Hand-Tied Crochet Bouquet',
    'Sunburst, Pastel Blue Bud & Daisy Stems',
    180.00,
    250.00,
    'bouquets',
    'Trending Favorite',
    'trending',
    '/images/products/celestial-bloom.jpg',
    'Celestial sky mixed crochet bouquet with sunflower, blue tulip and daisies',
    'A serene bouquet capturing open summer skies. Combines a golden sunflower, calming blue tulip, and paired yellow-center daisies wrapped in layered crisp paper and satin ribbon with artisan studio tag.',
    '100% GOTS Organic Cotton',
    'Bouquet Height: 34cm, Span: 20cm',
    '5.5 hours',
    'Finished with archival-grade cotton yarn that resists dust and preserves its vivid shades for years.',
    'Dust gently with a soft dry cloth. Store away from open flames.',
    4.9,
    74,
    11,
    true
),
(
    'prod-06-cherry-charm',
    'Twin Glossy Crimson Crochet Cherry Keychain',
    'Ruby Red Cherries • Jade Leaves • Gold Clasp Ring',
    150.00,
    220.00,
    'charms',
    'Top Gift Pick',
    'highlight',
    '/images/products/cherry-charm.jpg',
    'Handmade crochet pair of red cherries with green leaves and key ring',
    'Whimsical atelier accessory crafted with twin plump ruby red cherries, slender verdant stems, and structured leaf accents mounted on a premium gold-tone keyring.',
    'Lustrous Egyptian Cotton Yarn & High-Density Fiberfill',
    'Drop Length: 11cm, Cherry Diameter: 3.5cm each',
    '2.5 hours',
    'Stuffed firmly with anti-allergen fiberfill to maintain spherical symmetry over years of daily enjoyment.',
    'Wipe clean with a damp microfiber cloth.',
    4.7,
    188,
    18,
    true
),
(
    'prod-07-sunshine-posy',
    'Golden Sunshine & Sky-Blue Blossom Posy',
    'Sunflower Focus • Azure Bells & Pearl Daisy Pair',
    199.00,
    299.00,
    'bouquets',
    'Artisan Deal',
    'deal',
    '/images/products/sunshine-posy.jpg',
    'Handcrafted crochet sunshine and blue flower bouquet wrapped with bow',
    'A joyful arrangement bringing together sun-drenched golden blooms, cascading azure bell buds, and twin pure white daisy florets in signature dual-layer Kraft packaging.',
    'Combed Cotton, Bamboo Fiber Blend',
    'Height: 33cm, Spread: 20cm',
    '5.0 hours',
    'Hand-twisted stem wrapping delivers flawless presentation whether kept inside the craft wrap or arranged in ceramic vessels.',
    'Keep away from high humidity environments.',
    4.9,
    129,
    9,
    true
),
(
    'prod-08-lavender-mini-pot',
    'Pastel Lilac Crochet Lavender in Ribbed Ceramic Pot',
    '6 Textured Stems • Soft Gray Ribbed Studio Planter',
    220.00,
    320.00,
    'pot-plants',
    'Editor’s Choice',
    'bestseller',
    '/images/products/lavender-mini-pot.jpg',
    'Crochet potted lavender plant in gray ribbed ceramic pot',
    'Provencal tranquility for desk or windowsill. Six handcrafted lavender flower spikes with subtle tonal lilac and violet gradient stitching permanently set in an artisan ribbed ceramic container.',
    'Mercerized Cotton Yarn, Matte Ceramic Pot, Natural Stone Gravel',
    'Total Height: 18cm, Pot Diameter: 8cm',
    '4.0 hours',
    'Stitches are micro-looped to capture the authentic clustered calyx texture of real English lavender.',
    'Wipe pot with a dry cloth. Use hairdryer on cool setting for occasional dusting.',
    5.0,
    88,
    7,
    true
),
(
    'prod-09-tulip-car-charm',
    'Duo Pastel Crochet Tulip Rearview Car Mirror Charm',
    'Peach Blossom & Cream Bell • Soft Braided Cord',
    160.00,
    220.00,
    'charms',
    'Car Accessory',
    'highlight',
    '/images/products/tulip-car-charm.jpg',
    'Crochet tulip rearview mirror car charm in peach and cream',
    'Transform your daily drive with slow-crafted serenity. Two miniature crochet tulip bells in soft peach and buttermilk cream suspended on an adjustable braided hanger with artisan wooden bead accents.',
    'Natural Milk Cotton Yarn & Beech Wood Beads',
    'Adjustable drop: 15cm to 28cm',
    '2.0 hours',
    'Treated with UV-resistant fiber glaze to maintain blossom color through sun exposure in vehicle interiors.',
    'Spot clean only.',
    4.8,
    204,
    16,
    false
),
(
    'prod-10-succulent-trio',
    'Desert Rose & Jade Echeveria Crochet Succulent Trio',
    'Rose Quartz, Sage, & Forest Green in Terracotta Pot',
    240.00,
    340.00,
    'pot-plants',
    'Zero Maintenance',
    'trending',
    '/images/products/succulent-trio.jpg',
    'Three crochet succulent varieties clustered in rustic terracotta pot',
    'A trio of sculptural desert flora that never need watering. Features a rosette desert rose, plump string-of-pearls tendrils, and a pointed jade echeveria nestled in rich coffee-tone faux crochet soil.',
    'Organic Wool & Bamboo Silk in Terracotta Clay Pot',
    'Height: 14cm, Pot Diameter: 10cm',
    '5.5 hours',
    'Each succulent petal is individually wire-stiffened for realistic curvature that holds its shape indefinitely.',
    'Keep indoors in dry ambient conditions.',
    4.9,
    65,
    6,
    false
),
(
    'prod-11-rose-single-stem',
    'Classic Crimson English Rose Single-Stem Heirloom',
    'Deep Velvet Crimson • Ribbed Calyx & Thorns Detail',
    150.00,
    199.00,
    'bouquets',
    'Signature Bloom',
    'highlight',
    '/images/products/rose-single-stem.jpg',
    'Single handmade red crochet rose with stem and leaves',
    'A single perfect heirloom bloom. Over 30 individually crocheted crimson petals layered into a full spiral blossom with realistic sepals, flexible foliage, and textured stem.',
    '100% Mercerized Egyptian Mako Cotton',
    'Length: 32cm, Rose Head: 8cm diameter',
    '3.5 hours',
    'Petals are gently formed around a hidden central core for everlasting dimensional realism.',
    'Dust with a soft makeup brush.',
    4.9,
    173,
    12,
    false
),
(
    'prod-12-sunflower-pot',
    'Miniature Radiant Crochet Sunflower Desk Planter',
    'Golden Ochre Bloom • Chocolate Seed Core • White Cup',
    199.00,
    280.00,
    'pot-plants',
    'Desk Favorite',
    'highlight',
    '/images/products/sunflower-pot.jpg',
    'Mini crochet sunflower potted in small white ceramic pot',
    'A constant ray of sunshine for study table or workstation. Compact golden sunflower bloom with paired sage leaves anchored in faux soil inside a clean white minimalist ceramic pot.',
    'Combed Cotton Yarn & Ceramic Container',
    'Total Height: 16cm, Pot Diameter: 7cm',
    '3.0 hours',
    'Firmly weighted base prevents tipping on active work desks.',
    'Wipe clean ceramic base with damp cloth.',
    4.8,
    94,
    15,
    false
),
(
    'prod-13-strawberry-keychain',
    'Sweet Harvest Red Strawberry & Blossom Charm',
    'Ripe Berry • White Flower Charm • Gold Hardware',
    150.00,
    210.00,
    'charms',
    'Kawaii Luxury',
    'deal',
    '/images/products/strawberry-keychain.jpg',
    'Handmade crochet strawberry keychain with tiny flower blossom',
    'A charming duo of a plump strawberry with delicate hand-embroidered golden seeds and an accompanying 5-petal white flower charm on a luxury lobster claw clip.',
    'Organic Cotton Yarn & Gold Plated Hardware',
    'Drop Length: 10cm, Strawberry: 4cm x 3cm',
    '2.0 hours',
    'Embroidered French knot seeds provide tactile charm and authentic berry character.',
    'Keep hardware dry.',
    4.9,
    241,
    20,
    false
),
(
    'prod-14-peony-luxe-bouquet',
    'Blushing Imperial Peony Grand Atelier Arrangement',
    'Triple Rose Peony Blooms • Eucalyptus & Daisy Accents',
    250.00,
    399.00,
    'bouquets',
    'Masterpiece Tier',
    'bestseller',
    '/images/products/peony-luxe-bouquet.jpg',
    'Grand crochet bouquet with large pink peonies and eucalyptus branches',
    'The pinnacle of slow crochet mastery. Three magnificent multi-layered blushing pink peonies complemented with silvery eucalyptus sprigs, baby daisy clusters, and satin ribbon wrapping.',
    'Mulberry Silk & Combed Cotton Blend',
    'Arrangement Height: 40cm, Span: 30cm',
    '8.5 hours',
    'Over 120 individual petals hand-crocheted and assembled by senior master artisans.',
    'Archival storage; keep away from open windows and direct sunlight.',
    5.0,
    57,
    4,
    true
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    subtitle = EXCLUDED.subtitle,
    price = EXCLUDED.price,
    mrp = EXCLUDED.mrp,
    category = EXCLUDED.category,
    badge = EXCLUDED.badge,
    badge_type = EXCLUDED.badge_type,
    image_url = EXCLUDED.image_url,
    alt = EXCLUDED.alt,
    description = EXCLUDED.description,
    yarn_type = EXCLUDED.yarn_type,
    dimensions = EXCLUDED.dimensions,
    craft_hours = EXCLUDED.craft_hours,
    artisan_notes = EXCLUDED.artisan_notes,
    care_instructions = EXCLUDED.care_instructions,
    rating = EXCLUDED.rating,
    reviews_count = EXCLUDED.reviews_count,
    in_stock = EXCLUDED.in_stock,
    featured = EXCLUDED.featured,
    updated_at = now();

-- ───────────────────────────────────────────────────────────────────────────
-- 14. Seed Vouchers
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO public.vouchers (code, label, description, discount_pct, currency, min_subtotal, active)
VALUES
  ('ATELIER10', 'Atelier Privilege', '10% privilege discount on handcrafted orders', 10, 'INR', 0, true),
  ('LUXE15', 'Luxe Patron Discount', '15% luxury discount on orders over ₹100', 15, 'INR', 100, true),
  ('SLOWCRAFT20', 'Slow Craft Tribute', '20% special celebration voucher', 20, 'INR', 150, true),
  ('SLOWCRAFT15', 'Welcome Privilege', '15% welcome discount for new patrons', 15, 'INR', 0, true)
ON CONFLICT (code) DO UPDATE
  SET label = EXCLUDED.label,
      discount_pct = EXCLUDED.discount_pct,
      active = true,
      updated_at = now();
