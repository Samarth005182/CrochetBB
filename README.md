# 🧶 LUXE CRAFT ATELIER (Stitch Midnight Crochet Boutique)

[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An elevated, high-end e-commerce web application for **LUXE CRAFT**, a luxury slow-fashion handmade crochet atelier. Designed with a nocturnal monochromatic **Midnight Navy** palette, editorial serif typography, and bespoke interactive shopping journeys.

---

## 🌟 Key Features

* **🎨 Editorial "Luxe Craft Narrative" Design System:**
  * Tailored **Midnight Navy & Soft Cream** palette (`#08122a` background, `#0a192f` container, `#b9c7e4` primary, `#c8c6c3` soft cream).
  * Typography pairing: High-contrast editorial serif (`Libre Caslon Text`) paired with clean geometric sans (`Hanken Grotesk`).
  * Micro-interactions: Shimmer hover effects, asymmetric lookbook layout, and ghost input focus transitions.

* **🛍️ Artisan Catalog & Lookbook:**
  * Asymmetric editorial lookbook view (7-col / 5-col split) & uniform grid view toggle.
  * Category chips (*Bouquets & Stems*, *Charms & Accents*, *Handbags & Totes*).
  * Live debounce search and price sorting.

* **🔍 Product Quick-View & Yarn Anatomy:**
  * High-res image previews, yarn composition specs, craft hours spent, dimensions, and botanical care instructions.

* **🛒 Persistent Atelier Bag & Privilege Engine:**
  * Persistent `localStorage` cart, quantity adjusters, free shipping milestone bar ($150 threshold).
  * Interactive privilege vouchers (`ATELIER10`, `LUXE15`, `SLOWCRAFT20`).
  * Curated cross-sell complements and slide-out quick cart drawer.

* **💳 4-Step Multi-Step Checkout:**
  * Shipping address with anti-bot honeypot validation.
  * Delivery method selector (Standard Atelier vs. Express White-Glove Insured).
  * Payment authorization with live interactive credit card preview and cryptographic Proof-of-Work challenge.
  * Order confirmation receipt with tracking reference and confetti celebration.

* **🔐 Patron Portal & Account Atelier:**
  * Member sign-in / registration with ghost-input styling.
  * Guest checkout option.
  * Patron dashboard tracking past order history, address book, and curated wishlist gallery.

* **📖 Slow-Fashion Story & Loom Gallery:**
  * Brand manifesto on ethical slow fashion and GOTS-certified organic fibers.
  * Interactive "Loom Gallery" featuring macroscopic stitch studies.

* **🛡️ DDoS Mitigation & Traffic Surge Shield:**
  * **Token Bucket Rate Limiting:** Client-side rate-limiter on search, auth, coupon validation, and checkout clicks.
  * **Atelier Priority Waiting Room:** Animated virtual queue that activates during high-concurrency limited drops to pace traffic.
  * **Anti-Bot Protections:** Cryptographic proof-of-work puzzles and invisible honeypots.
  * **Production Security Configs:** Reference templates for Cloudflare WAF, Nginx burst rate limits, and Express middleware in `src/server/rateLimitConfig.js`.

* **⚡ Supabase Database & Auth Integration:**
  * Connected to Supabase (`@supabase/supabase-js`) for live catalog loading, order persistence, and user authentication.
  * SQL migration and seed script available in `supabase/schema.sql`.

---

## 📁 Repository Structure

```text
crochetbb/
├── .agents/
│   ├── mcp_config.json                 # Supabase MCP configuration
│   └── skills/                         # Supabase & Postgres agent skills
├── src/
│   ├── components/
│   │   ├── CartDrawer.jsx              # Slide-out quick shopping bag
│   │   ├── Footer.jsx                  # Editorial luxury footer
│   │   ├── Navbar.jsx                  # Responsive glassmorphic navigation
│   │   ├── ProductCard.jsx             # Lookbook & grid multi-layout card
│   │   ├── ProductModal.jsx            # High-res quick-view dialog
│   │   ├── TrafficGuardBanner.jsx      # DDoS & surge status indicator
│   │   └── VirtualQueueModal.jsx       # Traffic surge waiting room queue
│   ├── context/
│   │   ├── AuthContext.jsx             # Member authentication & patron profile
│   │   ├── CartContext.jsx             # Shopping cart, discounts & surge state
│   │   ├── ToastContext.jsx            # Global luxury dark toast notifications
│   │   └── WishlistContext.jsx         # Persistent wishlist state
│   ├── data/
│   │   └── products.js                 # Rich handcrafted collection dataset
│   ├── lib/
│   │   └── supabase.js                 # Supabase client & API services
│   ├── pages/
│   │   ├── AccountPage.jsx             # Patron dashboard & order history
│   │   ├── AuthPage.jsx                # Member sign in & registration
│   │   ├── CartPage.jsx                # Full shopping cart & voucher engine
│   │   ├── CheckoutPage.jsx            # 4-step checkout & receipt
│   │   ├── ShopPage.jsx                # Filterable artisan catalog & lookbook
│   │   └── StoryPage.jsx               # Slow-fashion manifesto & Loom gallery
│   ├── server/
│   │   └── rateLimitConfig.js          # Production DDoS & Nginx/Cloudflare specs
│   ├── utils/
│   │   └── rateLimiter.js              # Token bucket, debounce, PoW & honeypot
│   ├── App.jsx                         # Main router & state orchestration
│   ├── index.css                       # Design tokens, scrollbars, ghost inputs
│   └── main.jsx                        # React root entry
├── stitch_midnight_crochet_boutique/   # Original design specs & HTML prototypes
├── supabase/
│   └── schema.sql                      # Database tables, RLS & seed data
├── .env.example                        # Environment variables template
├── package.json                        # Scripts & dependencies
├── tailwind.config.js                  # Midnight design system tokens
└── vite.config.js                      # Vite build configuration
```

---

## 🚀 Quick Start Guide

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/<your-username>/crochetbb.git
cd crochetbb

# Install dependencies
npm install
```

### 2. Configure Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_SUPABASE_URL=https://nagpjggmajzavpipdgoe.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Setup Database (Optional for Live DB Sync)

Execute the SQL script in [supabase/schema.sql](supabase/schema.sql) inside your Supabase project's SQL Editor to initialize the `products` and `orders` tables with pre-seeded luxury items.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000/](http://localhost:3000/) in your browser.

### 5. Build for Production

```bash
npm run build
```

---

## 📜 License

Distributed under the MIT License. Crafted with care by Luxe Craft Atelier.
