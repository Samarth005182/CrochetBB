-- ╔════════════════════════════════════════════════════════════════════════╗
-- ║   KNOTKARI ATELIER — Master Database Schema                            ║
-- ║   Project Ref: abrueeofowwpdpokdlba                                    ║
-- ║   Run in Supabase Dashboard -> SQL Editor                              ║
-- ╚════════════════════════════════════════════════════════════════════════╝

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    subtitle TEXT,
    price NUMERIC(10, 2) NOT NULL,
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
    in_stock INT DEFAULT 15,
    featured BOOLEAN DEFAULT true,
    currency TEXT DEFAULT 'INR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Products (Public Read)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on products" ON public.products;
CREATE POLICY "Allow public read access on products" 
ON public.products FOR SELECT USING (true);

-- 3. Seed All 14 Handcrafted Products (INR Pricing)
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
    84,
    7,
    true
),
(
    'prod-06-pearl-blossom',
    'Pearl Core Ruby & Ivory Crochet Blossom Bouquet',
    'Dual-Tone Flowers • Lustrous Faux Pearl Centers • Red Bow',
    200.00,
    299.00,
    'bouquets',
    'Heirloom Edition',
    'highlight',
    '/images/products/pearl-blossom-bouquet.jpg',
    'Handmade red and white crochet flower bouquet with pearl centers and red ribbon',
    'A festive handcrafted bouquet featuring pure ivory and crimson crochet florets adorned with gleaming pearl bead centers. Wrapped in layered parchment with a rich scarlet ribbon and artisan studio tag.',
    'Organic Combed Cotton & Faux Pearl Accents',
    'Bouquet Height: 32cm, Span: 18cm',
    '5.0 hours',
    'Each flower is delicately anchored around a central pearl bead with reinforced green stem wiring.',
    'Dust gently with a soft dry brush. Keep away from excessive moisture.',
    5.0,
    165,
    9,
    true
),
(
    'prod-07-crimson-rose',
    'Classic Crimson Velvet Single Crochet Rose Stem',
    'Textured Petals • Star Calyx • Tied with Red Satin Ribbon',
    180.00,
    250.00,
    'bouquets',
    'Romantic Favorite',
    'bestseller',
    '/images/products/crimson-rose-bouquet.jpg',
    'Single red crochet rose bouquet with green sepals wrapped in parchment and red ribbon',
    'An everlasting expression of romance. Features an intricately coiled deep crimson rose bloom with verdant calyx leaves, perched on a long wired stem and tied in cream wrapping with a vibrant red ribbon.',
    'Velvet-Finish Mercerized Cotton & Flexible Core',
    'Rose Diameter: 9cm, Total Stem Length: 30cm',
    '3.5 hours',
    'Coiled spiral construction ensures full bloom geometry that stays plump and vivid permanently.',
    'Spot clean lightly with dry cotton cloth. Do not soak.',
    4.9,
    190,
    12,
    true
),
(
    'prod-08-evil-eye-charm',
    'Royal Blue Evil Eye (Nazar) Crochet Charm Keychain',
    'Protective Concentric Rings • Silver Alloy Keyring',
    150.00,
    199.00,
    'charms',
    'Popular Protection',
    'deal',
    '/images/products/evil-eye-charm.jpg',
    'Handmade round crochet evil eye nazar keychain charm in royal blue, white and sky blue',
    'A tactile talisman for good fortune and protection. Expertly crocheted in concentric circular stitches of deep cobalt blue, turquoise, optic white, and jet black with a durable silver keychain ring.',
    '100% Mercerized Cotton & Heavy-Duty Alloy Keyring',
    'Charm Diameter: 7.5cm, Total Drop: 12cm',
    '2.0 hours',
    'Firm circular tension ensures the amulet lies flat and resists warping when stored in pockets.',
    'Gently hand wash in cold soapy water if needed; lay flat to dry.',
    4.8,
    275,
    18,
    true
),
(
    'prod-09-twin-tulip-charm',
    'Twin Pastel Pink Tulip & Leaf Crochet Keychain',
    'Double Blossom Bells • Braided Foliage • Silver Keyring',
    180.00,
    249.00,
    'charms',
    'New Arrival',
    'trending',
    '/images/products/twin-tulip-charm.jpg',
    'Pair of handmade pink crochet tulip bells with green leaves on a silver keychain',
    'A delightful duo of pastel pink bell-shaped tulip buds suspended from leafy green crochet stems on a polished metal keyring. Adds charming botanical whimsy to your handbag, backpack, or car keys.',
    'Fine Combed Cotton & Silver Alloy Keyring',
    'Each Tulip: 4.5cm x 4cm, Total Drop: 14cm',
    '2.5 hours',
    'Stuffed with natural fiber core to maintain bouncy, dimensional tulip bell shapes.',
    'Spot clean gently with a soft damp cloth.',
    4.9,
    112,
    15,
    true
),
(
    'prod-10-red-rose-charm',
    'Blooming Red Rose & Foliage Crochet Charm Keychain',
    'Multi-Layered Scarlet Petals • Dual Leaf Accents',
    150.00,
    199.00,
    'charms',
    'Handmade Highlight',
    'highlight',
    '/images/products/red-rose-charm.jpg',
    'Handmade red crochet rose charm with two green leaves and silver keychain ring',
    'A vibrant miniature red rose crafted with multi-layered dimensional crochet petals and twin emerald leaves attached to a sturdy metallic chain and keyring. A lovely pocket-sized artisan keepsake.',
    '100% Egyptian Cotton Yarn & Alloy Hardware',
    'Rose Diameter: 6.5cm, Total Drop: 12.5cm',
    '2.0 hours',
    'Petals are shaped and interlocked manually to achieve full botanical rose curvature.',
    'Spot clean with dry cloth.',
    4.8,
    148,
    20,
    true
),
(
    'prod-11-pink-tulip-stem',
    'Pastel Pink Blossom Single Crochet Tulip Stem',
    'Blush Pink Closed Bud • Ribbed Leaf • Marble Kraft Wrap',
    180.00,
    250.00,
    'bouquets',
    'Trending Favorite',
    'trending',
    '/images/products/pink-tulip-stem.jpg',
    'Single pink crochet tulip stem wrapped in gold marble paper with white ribbon against sky',
    'A graceful single-stem pink tulip crocheted with fine blush pink yarn, complete with a structured green leaf and flexible stem. Enclosed in gold-veined marble kraft paper with an ivory satin ribbon and atelier tag.',
    'Mercerized Pima Cotton & Copper Support Wire',
    'Total Height: 32cm, Flower Bud: 6.5cm x 5cm',
    '3.0 hours',
    'Tightly shaped cup petals mimic a fresh spring tulip bud on the verge of blooming.',
    'Dust periodically with a feather duster or dry cloth.',
    4.9,
    130,
    11,
    true
),
(
    'prod-12-sunflower-bag-charm',
    'Luxe Gold-Clasp Sunflower Handbag Charm',
    'Golden Petals • Cocoa Center • Gold Lobster Swivel Clasp',
    200.00,
    299.00,
    'charms',
    '#1 Best Seller',
    'bestseller',
    '/images/products/sunflower-bag-charm.jpg',
    'Handmade crochet sunflower charm with leaf and gold lobster clasp hanging on leather tote',
    'Elevate your daily carryall. Features a meticulously woven sunflower with chocolate textured seed core, emerald leaf accent, and a luxury gold-plated lobster swivel clasp designed to clip smoothly onto luxury handbags.',
    '100% Mercerized Cotton & 18k Gold-Tone Alloy Hardware',
    'Sunflower Diameter: 8cm, Total Drop: 15cm',
    '3.0 hours',
    'Heavy-duty alloy clasp ensures secure attachment to totes, backpacks, and belt loops.',
    'Wipe metal clasp with microfiber cloth. Keep dry.',
    5.0,
    220,
    16,
    true
),
(
    'prod-13-sweetheart-pair',
    'Sweetheart Handcrafted Crochet Heart Keychains',
    'Pastel Pink & Scarlet Red Duo • Polished Silver Keyrings',
    150.00,
    199.00,
    'charms',
    'Limited Deal',
    'deal',
    '/images/products/sweetheart-keychain.jpg',
    'Pair of handmade pink and red crochet heart keychains on silver rings',
    'Charming token of affection. Handcrafted padded crochet hearts featuring thick textured contour stitching and sturdy silver keyrings. Makes a lovely matching gift for friends, couples, or car keys.',
    'Chunky Soft Cotton Cord & Alloy Keyring',
    'Heart Width: 6.5cm, Total Drop: 12cm',
    '2.0 hours',
    'Reinforced heart arches maintain crisp symmetrical curves without flattening over time.',
    'Hand wash gently in cool water if necessary.',
    4.8,
    185,
    25,
    true
),
(
    'prod-14-ribbon-bow-keychains',
    'Coquette Pastel Ribbon Bow Crochet Keychain',
    'Ribbed Knot Bow • Available in Vibrant & Pastel Tones',
    150.00,
    199.00,
    'charms',
    'Popular Accessory',
    'highlight',
    '/images/products/ribbon-bow-keychain.jpg',
    'Set of colorful handmade crochet bow keychains in red, navy blue, yellow, blue and pink',
    'On-trend coquette aesthetic hand-knotted in crochet. Ribbed bow wings with a wrapped center knot and metallic chain keyring. Available in scarlet red, midnight navy, sunny yellow, baby blue, and blush pink.',
    '100% Soft Combed Cotton Yarn & Silver Hardware',
    'Bow Width: 8.5cm x 6cm, Total Drop: 13cm',
    '2.0 hours',
    'Ribbed textured stitch gives the bow wings realistic fabric drape and dimensional thickness.',
    'Spot clean gently with mild soapy water; reshape while damp.',
    4.9,
    205,
    30,
    true
)
ON CONFLICT (id) DO UPDATE 
SET price = EXCLUDED.price,
    mrp = EXCLUDED.mrp,
    in_stock = EXCLUDED.in_stock,
    image_url = EXCLUDED.image_url,
    badge = EXCLUDED.badge,
    badge_type = EXCLUDED.badge_type;

-- 4. Customer Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    tier TEXT DEFAULT 'Knotkari Master Patron',
    reward_points INT DEFAULT 1240,
    bio TEXT DEFAULT 'Connoisseur of slow-fashion karigari and botanical fiber arts.',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
CREATE POLICY "Users can read their own profile"
ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 5. Customer Addresses Table
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    street TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'India',
    phone TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own addresses" ON public.addresses;
CREATE POLICY "Users can manage their own addresses"
ON public.addresses FOR ALL USING (auth.uid() = user_id);

-- 6. Orders Table (Stores customer details, ordered items, money paid, payment ID)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    tracking_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    shipping_address JSONB NOT NULL,
    delivery_method TEXT NOT NULL,
    items JSONB NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    shipping NUMERIC(10, 2) NOT NULL,
    tax NUMERIC(10, 2) NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    voucher_code TEXT,
    voucher_discount NUMERIC(10, 2) DEFAULT 0,
    status TEXT DEFAULT 'pending' NOT NULL,
    payment_provider TEXT DEFAULT 'razorpay',
    payment_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow insertion of orders" ON public.orders;
CREATE POLICY "Allow insertion of orders"
ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read access to orders" ON public.orders;
CREATE POLICY "Allow read access to orders"
ON public.orders FOR SELECT USING (true);

-- 7. Newsletter Subscribers Table
CREATE TABLE IF NOT EXISTS public.subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'confirmed' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow subscriber insertion" ON public.subscribers;
CREATE POLICY "Allow subscriber insertion"
ON public.subscribers FOR INSERT WITH CHECK (true);
