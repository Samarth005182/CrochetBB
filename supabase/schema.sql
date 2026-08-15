-- Luxe Craft Atelier Database Schema
-- Run this script in the Supabase SQL Editor (Project Ref: nagpjggmajzavpipdgoe)

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    subtitle TEXT,
    price NUMERIC(10, 2) NOT NULL,
    category TEXT NOT NULL,
    badge TEXT,
    aspect_ratio TEXT DEFAULT 'aspect-[4/5]',
    desktop_col_span TEXT DEFAULT 'md:col-span-6',
    image_url TEXT NOT NULL,
    alt TEXT,
    description TEXT,
    yarn_type TEXT,
    dimensions TEXT,
    craft_hours TEXT,
    artisan_notes TEXT,
    care_instructions TEXT,
    rating NUMERIC(3, 2) DEFAULT 5.0,
    reviews_count INT DEFAULT 0,
    in_stock INT DEFAULT 10,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Products (Public Read)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on products" 
ON public.products FOR SELECT USING (true);

-- 3. Seed Products Data
INSERT INTO public.products (id, name, subtitle, price, category, badge, aspect_ratio, desktop_col_span, image_url, alt, description, yarn_type, dimensions, craft_hours, artisan_notes, care_instructions, rating, reviews_count, in_stock, featured)
VALUES
(
    'artisan-daisy-charm',
    'The Artisan Daisy Charm',
    'Intricate petal work, silver hardware',
    45.00,
    'charms',
    'Limited Edition',
    'aspect-[4/5]',
    'md:col-span-7',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBsud4sLvFgIeiO9gtKVCuIb5MLXPM9trOBkDI4ZddIZpq-nnfkb5-WZSh_BVHW5oF01QSjml1paGQ6aiyV6Cqp7llciS_jNMYkbxWEjWVwxBTDyl-4TYtgkVqADoYojwwvMreGM-wqJZlNbJHYg2Dm0dlkNT6ag1625UG1DYO4WMYPUokul7mlvZfmaRS6LXt2tZgU3QMWWapYRyoYEo3WScNejNJyeDdOgqaDYfkJxslA_053aruBzupHuUiPQcFceq8',
    'Handmade crochet daisy charm with pure white petals and golden core',
    'Individually crocheted using Mercerized Egyptian Cotton yarn for a silky sheen and exceptional durability. Features hand-forged 925 sterling silver hardware designed to clip effortlessly onto handbags, keychains, or heirloom garments.',
    '100% Mercerized Egyptian Cotton',
    '9cm x 6cm (Total drop: 14cm)',
    '3.5 hours',
    'Master stitcher Elena spent over three hours shaping each double-crochet petal to ensure precise botanical geometry.',
    'Spot clean gently with a damp cotton cloth. Do not soak hardware.',
    4.9,
    28,
    12,
    true
),
(
    'sun-kissed-single',
    'Sun-Kissed Single Bloom',
    'Signature sunflower bloom',
    85.00,
    'bouquets',
    'Best Seller',
    'aspect-square',
    'md:col-span-5 md:mt-24',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBHwtqSmwPaSvvRpSkfHi4nFMO4V8b0mxN5_UANwuPz8DeWadaI1vWEWQ7gMAqnaC6cb6KL4Nam3givx7g3Yr2Ii4WgKJh7fQRAfYTs8hlCdre94QrgIjpueAj_K7tR9eb71cmNgvaNxCWphz7xMWo6ngjt1asvvKzY8kGKUFSCRx79JR6cBSk57XcfCT2VfJwIMwbpzz_AV_HYkF7nqwAUVHaQY9yIBwdzb9keFl4rUURcnAtzm8Wpe3MmI-EDe6jdhrs',
    'Single luxury crochet sunflower with rich amber center and textured petals',
    'An homage to golden hour. Woven from rich ochre and deep espresso organic wool yarns with reinforced internal copper wiring allowing flexible stem positioning for luxury vase styling.',
    'Hand-Dyed Organic Merino Wool & Botanical Hemp',
    'Flower head: 14cm diameter, Stem length: 32cm',
    '5.0 hours',
    'The spiral center utilizes a complex relief stitch that mimics real sunflower seed patterns.',
    'Dust periodically with a soft brush. Keep out of direct prolonged sunlight to preserve botanical dye brilliance.',
    5.0,
    43,
    8,
    true
),
(
    'midnight-tulip-ensemble',
    'Midnight Tulip Ensemble',
    'A study in primary contrasts',
    140.00,
    'bouquets',
    'Atelier Exclusive',
    'aspect-[3/4]',
    'md:col-span-5',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDd-Z9FKQEqLMSctYI9Sq3o05hpPALgXJRsmL4WgHEmXFMnrOlYG9-FUvrtjXP9fBn35MYTMAec0mp_bUb4xrbotW0tyjLroFEvvfXnZG7BGru-WNtuA_EIgln6BrJjYoUpbk3SM6tsiRpBd2VAeVS3kkLxzvcDWcETlH4sLtDzYYKBvIRy7VN-0R5_5oaiMSjxqlEOcbyOWRpPlIy0ahe-vXE4UUXSpXyhlt4lA5Dl0NImoSBbl3G-TvQ8hRV51_jqwHo',
    'Three luxury crochet tulips in midnight navy and crimson hues',
    'A three-stem sculptural arrangement celebrating color theory and tactile warmth. Soft velvet-finish cotton micro-stitches wrap gently around inner calyx forms to maintain everlasting cup shapes.',
    'Soft Velvet Micro-Cotton & Mulberry Silk Blend',
    'Arrangement height: 38cm, Span: 20cm',
    '7.5 hours',
    'Each petal is individually formed and crocheted together using an invisible seam technique.',
    'Store in dry atmosphere; gentle steaming refreshes yarn loft.',
    4.8,
    19,
    6,
    true
),
(
    'lavender-field-bud',
    'Lavender Field Bud',
    'Soft lilac hues, elegantly wrapped',
    75.00,
    'bouquets',
    'New Arrival',
    'aspect-[16/10]',
    'md:col-span-7 md:mt-32',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD2KxC-5Or__cvvgL9tLVD-fKDKo_w4mndy12wgsrPMexkql07qmBGx_RW5VLkGydMVi8kFyG9SnV8hw8QfYVkxbDujnvHU-_REdCU-_zpSmZ6b6wFE92HZZRGecSZ48XCuBUElNi2oNJzz6tqF4MnKZX6WG0NjhpYx3-KAQPyiI5yQpzlj54UscCvaD9pTn3ee1OnFQMMrYQU8zvoKRLctNfWdbiFrQetYjQLa2F5M48JR2uAUtxKfZ4461uQIHiSIkZs',
    'Handcrafted lavender bundle tied with raw linen ribbon',
    'Fragrant French lavender inspired this cluster of 45 individually woven micro-buds. Infused with natural organic lavender essential oils that gently release a calming fragrance when handled.',
    '100% Pima Cotton with Organic Essential Oil Infusion',
    'Length: 28cm, Bundle Diameter: 8cm',
    '4.0 hours',
    'Finished with a hand-torn raw Italian linen ribbon and brass atelier seal.',
    'Re-infuse scent by applying 1 drop of pure essential oil to the wooden core stem.',
    4.9,
    31,
    15,
    true
),
(
    'midnight-chunky-tote',
    'The Nocturne Oversized Tote',
    'Heavyweight tactile structure',
    195.00,
    'handbags',
    'Signature Drop',
    'aspect-[4/5]',
    'md:col-span-6',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuB5kZyQ97kUe_dT6FeshODHNLNzURhregWAKdZqtuXl0kdIEvWsFyii4QjXDWLAPJyJQIt4AZznUgwLgjQTTXID4MrXt-Va7-DNmD-y1NJer3XikHKR-hp_R55rejMBxs2N0cOR9hfZw9NUNMotnpUlVUWkbQMcNsto2kaxa9G_yJNafbZlYuup3g2Cr71Wg6VnQNxupSAZ4xeFeA8t8j_oPNpnMA6R21-Se4kaGlj_nwdeRpIaYq4mHg',
    'Oversized midnight blue chunky knit tote bag on pedestal',
    'An architectural statement tote woven with 12mm chunky braided cotton cord. Features seamless integrated handles and an interior lined with Japanese raw indigo denim.',
    'Chunky Braided Organic Cotton Cord & Indigo Denim Lining',
    '44cm Width x 36cm Height x 14cm Depth (Handle drop: 22cm)',
    '11.0 hours',
    'Requires immense finger strength and precision tensioning to achieve structural rigidity without synthetic stiffeners.',
    'Professional dry clean recommended. Shape while damp if spot cleaned.',
    5.0,
    16,
    4,
    false
),
(
    'loom-texture-coasters',
    'Loom Relief Coaster Set',
    'Set of 4 tactile botanical rounds',
    55.00,
    'charms',
    'Atelier Set',
    'aspect-square',
    'md:col-span-6',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA93r1LAk6HaRLHMIKSbZGnv3TT2bgxv_zhPZfRjfjikiEjStjznQHTgxXc0vrrhVDsln5LspqHbj4taSdp_08tkcikhZfedcb6P8f-XqjliLkdQV3FrWSv2iJrh7rxJNVLpk2pGlVvDk1DkTyo5k2t-CRlp8jaOObCqxVMEG-wjAmGRHZtKFIxoLAm1bAQjsjDllig3EeLDfDTVKb7ndj0UEvd5SD6mbfKnYx5G17O9QkzqJ-j8WxEuA',
    'Set of 4 textured artisan crochet coasters in midnight navy and cream',
    'A set of four layered coasters featuring concentric waffle and bobble stitches that naturally absorb condensation while protecting delicate wooden or marble surfaces.',
    'Unbleached Organic Cotton & Flax Linen',
    '11cm diameter each (Set of 4)',
    '3.0 hours',
    'Tightly spun yarn prevents pilling even with daily tea or cocktail use.',
    'Machine washable in gentle laundry bag. Lay flat to dry.',
    4.7,
    22,
    20,
    false
)
ON CONFLICT (id) DO UPDATE 
SET price = EXCLUDED.price,
    in_stock = EXCLUDED.in_stock;

-- 4. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    tracking_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    shipping_address JSONB NOT NULL,
    delivery_method TEXT NOT NULL,
    items JSONB NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    shipping NUMERIC(10, 2) NOT NULL,
    tax NUMERIC(10, 2) NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    status TEXT DEFAULT 'confirmed' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated or guest insertion of orders"
ON public.orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow users to read their own orders by email"
ON public.orders FOR SELECT USING (true);
