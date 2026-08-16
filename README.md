# 🧶 KNOTKARI (Luxury Slow-Craft Crochet Atelier)

[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Paytm](https://img.shields.io/badge/Paytm-Payment%20Gateway-002E6E?style=flat&logo=paytm&logoColor=white)](https://paytm.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployment%20Ready-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com/)

An enterprise-ready, editorial luxury e-commerce web application for **KNOTKARI**, celebrating the fine art of slow-fashion crochet, heirloom botanical floral sculptures, bespoke charms, and handcrafted totes.

---

## 🌟 Key Features

* **🎨 High-Impact Editorial Landing Page:**
  * High-fashion hero with live artisan statistics (100% GOTS organic yarns, 5.8 avg craft hours per piece, 0% microplastics, lifetime stitch guarantee).
  * Curated category portals (*Botanical Bouquets & Stems*, *Charms & Accents*, *Heirloom Totes & Carryalls*).
  * The Karigari Manifesto & Interactive Loom Texture Study.
  * Patron Praise & Verified Reviews carousel.
  * Transparency FAQ accordion & VIP Lounge newsletter.

* **💳 Official Paytm Payment Gateway Integration:**
  * Production & Staging mode support via `VITE_PAYTM_MID`, `VITE_PAYTM_MERCHANT_KEY`, and `VITE_PAYTM_ENV`.
  * Instant checkout: **UPI** (Google Pay, PhonePe, Paytm, QR), **Paytm Wallet**, and **NetBanking**.
  * Instant cryptographic signature verification and confetti order celebration.
  * Printable luxury invoice receipt with artisan tracking reference.

* **🔐 Patron Authentication & Karigari Dashboard:**
  * **Profile Management:** Edit patron name, WhatsApp courier phone number, aesthetic bio, and custom avatar.
  * **Interactive 5-Stage Order Tracker:** Visual timeline tracking pieces from *Fiber Prep* $\to$ *Karigari Loom* $\to$ *Steaming & QC* $\to$ *Wax Seal Packaging* $\to$ *Dispatched*.
  * **Saved Address Book:** Full CRUD management (add, edit, delete, set default).
  * **Security & Vercel Edge Sync Center:** Live device session logs and cloud edge sync status.
  * **KNOTKARI VIP Club:** Point balance tracker, tier progression, and exclusive vouchers (`KNOTKARI20`, `SLOWCRAFT15`).

* **☁️ Vercel Zero-Config Deployment (`vercel.json`):**
  * SPA client-side routing rewrites for seamless page reloads.
  * Strict security headers (`X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`).
  * Immutable caching for static assets.

* **🛡️ Bot Surge Shield & DDoS Resilience:**
  * Token bucket rate limiting on authentication and search.
  * Cryptographic Proof-of-Work puzzle challenges on checkout transactions.
  * Invisible honeypot traps against automated scraping and form spam.

---

## 🚀 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env` and fill in your keys:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_PAYTM_MID=your_paytm_mid
VITE_PAYTM_MERCHANT_KEY=your_paytm_merchant_key
VITE_PAYTM_WEBSITE=WEBSTAGING
VITE_PAYTM_ENV=STAGE
```

### 3. Local Development
```bash
npm run dev
```

### 4. Production Build & Deployment
```bash
npm run build
```
Deploy instantly to **Vercel** with `vercel deploy` or by connecting your GitHub repository.
