import React, { useState } from 'react';
import { PRODUCTS } from '../data/products';
import { ProductCard } from '../components/ProductCard';
import { ProductModal } from '../components/ProductModal';
import { ScrollReveal } from '../components/ScrollReveal';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  ShoppingBag,
  Clock,
  Feather,
  Flame,
  Star,
  Award,
} from 'lucide-react';

export function LandingPage({ onNavigateToShop, onNavigateToStory }) {
  const [selectedProductForModal, setSelectedProductForModal] = useState(null);
  const [activeFaq, setActiveFaq] = useState(null);
  const { addToCart } = useCart();
  const { addToast } = useToast();

  const featuredProducts = PRODUCTS;

  const stats = [
    { value: '100%', label: 'GOTS Organic Fibers', icon: Feather },
    { value: '4.2 hrs', label: 'Avg Craft Time per Piece', icon: Clock },
    { value: '0%', label: 'Microplastic Synthetics', icon: ShieldCheck },
    { value: 'Lifetime', label: 'Heirloom Stitch Guarantee', icon: Award },
  ];

  const faqs = [
    {
      q: 'How long do KNOTKARI handcrafted blooms last?',
      a: 'Unlike fresh botanical cuts that wither within days, KNOTKARI everlasting blooms are sculpted from premium mercerized cotton and wool with flexible copper wiring. With gentle dusting, they last a lifetime without fading or wilting.',
    },
    {
      q: 'What makes KNOTKARI slow-fashion different from fast-fashion crochet?',
      a: 'True crochet cannot be replicated by any industrial machine. Every single stitch in our collection is hand-looped by master Indian karigars earning fair, living wages. We use zero acrylic polyester and 100% natural, biodegradable fibers.',
    },
    {
      q: 'What payment gateways are supported?',
      a: 'We support industry-standard 256-bit encrypted payments via Paytm (Instant UPI, Google Pay, PhonePe, Paytm Wallet, QR Code, and NetBanking in INR).',
    },
    {
      q: 'Can I include a personalized calligraphy gift note?',
      a: 'Yes! Every order includes complimentary archival kraft wrapping and a wax-sealed calligraphy card. You can add your bespoke message during checkout.',
    },
  ];

  return (
    <main className="flex-grow w-full overflow-hidden">
      {/* 1. EDITORIAL HERO SECTION */}
      <section className="relative min-h-[85vh] flex items-center justify-center px-4 sm:px-6 md:px-8 py-16 bg-radial-gradient">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center relative z-10">
          {/* Left Text & CTAs */}
          <ScrollReveal
            variant="fade-right"
            duration={800}
            className="lg:col-span-7 space-y-6 text-left"
          >
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-surface-container-high/80 border border-primary/30 text-primary text-xs font-label uppercase tracking-widest backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bespoke Karigari • Slow-Fashion Crochet</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-on-background tracking-tight leading-[1.1]">
              Heritage Knots. <br />
              <span className="italic font-normal text-primary-fixed">Timeless Karigari.</span>
            </h1>

            <p className="font-body text-sm sm:text-base text-on-surface-variant max-w-xl leading-relaxed">
              Elevating the ancient intimacy of crochet into haute slow-fashion couture. Everlasting
              botanical bouquets, heirloom charms, and stems hand-looped by master artisans starting
              from only ₹150.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={onNavigateToShop}
                className="px-7 py-3.5 bg-on-background hover:bg-primary-fixed text-background hover:text-on-primary-fixed font-label text-xs uppercase tracking-widest font-bold rounded-lg transition-all duration-300 shadow-lg flex items-center justify-center gap-2.5 group"
              >
                <span>Explore Full Collection ({PRODUCTS.length} Pieces)</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onNavigateToStory}
                className="px-7 py-3.5 bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 text-on-surface font-label text-xs uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 font-semibold"
              >
                <span>Our Karigari Story</span>
              </button>
            </div>

            {/* Quick Feature Tickers */}
            <div className="pt-6 border-t border-outline-variant/15 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-primary text-sm font-bold">
                      <Icon className="w-3.5 h-3.5" />
                      <span>{stat.value}</span>
                    </div>
                    <p className="text-[10px] font-label uppercase tracking-wider text-on-surface-variant leading-tight">
                      {stat.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </ScrollReveal>

          {/* Right Hero Visual Showcase */}
          <ScrollReveal
            variant="fade-left"
            delay={200}
            duration={800}
            className="lg:col-span-5 relative"
          >
            <div className="relative mx-auto max-w-sm lg:max-w-none">
              {/* Main Lookbook Visual */}
              <div className="aspect-[4/5] max-h-96 sm:max-h-[420px] mx-auto rounded-2xl overflow-hidden border border-outline-variant/30 shadow-2xl relative group">
                <img
                  src="/images/products/radiant-sunflower.jpg"
                  alt="KNOTKARI Handcrafted Sunburst Sunflower Crochet Bouquet"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />

                {/* Floating Artisan Card */}
                <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-xl bg-surface-container-lowest/95 backdrop-blur-md border border-outline-variant/30 flex items-center justify-between shadow-lg">
                  <div>
                    <span className="text-[9px] font-label uppercase tracking-widest text-primary font-bold block">
                      Featured • Artisan Spotlight
                    </span>
                    <h4 className="font-headline text-sm text-on-surface font-bold">
                      Radiant Sunburst Sunflower
                    </h4>
                    <p className="text-xs text-primary font-bold">
                      ₹200{' '}
                      <span className="text-[10px] text-on-surface-variant line-through font-normal">
                        M.R.P. ₹299
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      addToCart(PRODUCTS[1], 1);
                      addToast('Added Radiant Sunburst Sunflower to Cart', 'success');
                    }}
                    className="p-2.5 bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] font-bold rounded-lg shadow-sm transition-colors border border-[#fcd200]"
                    title="Quick Add to Cart"
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Floating Badge Accent */}
              <div className="absolute -top-3 -left-3 px-3 py-1.5 rounded-full bg-surface-container-high border border-primary/40 shadow-lg text-[10px] font-label uppercase tracking-widest text-on-background flex items-center gap-1.5">
                <Flame className="w-3 h-3 text-amber-400" />
                <span>Slow-Craft 2026 Collection</span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 2. CURATED COLLECTIONS GRID */}
      <section className="py-16 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
        <ScrollReveal variant="fade-up" className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="font-label text-xs uppercase tracking-widest text-primary font-bold">
            Curated Portals
          </span>
          <h2 className="font-display text-2xl sm:text-3xl text-on-background">
            Explore Handcrafted Categories
          </h2>
          <p className="text-xs sm:text-sm font-body text-on-surface-variant">
            From everlasting floral bouquets & individual stems to delicate accessories.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {[
            {
              title: 'Floral Bouquets & Stems',
              desc: 'Sculptural everlasting tulips, sunflowers, roses, and meadow bouquets crafted from organic mercerized yarn.',
              image: '/images/products/pearl-blossom-bouquet.jpg',
              category: 'bouquets',
            },
            {
              title: 'Charms & Keychains',
              desc: 'Delicate daisy clips, evil eye talismans, tulip bells, and rose keychains with polished silver hardware.',
              image: '/images/products/twin-tulip-charm.jpg',
              category: 'charms',
            },
          ].map((col, idx) => (
            <ScrollReveal
              key={idx}
              variant="fade-up"
              delay={idx * 150}
              onClick={onNavigateToShop}
              className="group relative h-80 rounded-2xl overflow-hidden cursor-pointer border border-outline-variant/20 shadow-md"
            >
              <img
                src={col.image}
                alt={col.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-90 group-hover:opacity-85 transition-opacity" />

              <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2">
                <span className="text-[10px] font-label uppercase tracking-widest text-primary font-bold">
                  Collection {idx + 1}
                </span>
                <h3 className="font-display text-xl text-on-background group-hover:text-primary transition-colors">
                  {col.title}
                </h3>
                <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                  {col.desc}
                </p>
                <div className="pt-2 flex items-center gap-1.5 text-xs font-label uppercase tracking-widest text-primary font-bold">
                  <span>Shop Collection</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* 3. FEATURED ATELIER DROPS (Amazon Style Grid) */}
      <section className="py-16 bg-surface-container-lowest border-y border-outline-variant/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <ScrollReveal
            variant="fade-up"
            className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4"
          >
            <div>
              <span className="font-label text-xs uppercase tracking-widest text-primary font-bold">
                Artisan Catalog
              </span>
              <h2 className="font-display text-2xl sm:text-3xl text-on-background mt-1">
                Featured Handcrafted Pieces (INR)
              </h2>
            </div>
            <button
              onClick={onNavigateToShop}
              className="text-xs font-label uppercase tracking-widest text-primary font-bold hover:underline flex items-center gap-1.5"
            >
              <span>View All {PRODUCTS.length} Pieces</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </ScrollReveal>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {featuredProducts.map((product, idx) => (
              <ScrollReveal
                key={product.id}
                variant="fade-up"
                delay={(idx % 5) * 80}
                distance="24px"
              >
                <ProductCard
                  product={product}
                  layoutMode="grid"
                  onQuickView={(p) => setSelectedProductForModal(p)}
                />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 4. THE KARIGARI CRAFT MANIFESTO */}
      <section className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <ScrollReveal variant="fade-right" duration={800} className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs uppercase tracking-widest font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Slow-Fashion Craftsmanship</span>
            </div>

            <h2 className="font-display text-3xl sm:text-5xl text-on-background leading-tight">
              Why True Crochet Can Never Be Machine-Made.
            </h2>

            <p className="font-body text-sm sm:text-base text-on-surface-variant leading-relaxed">
              Unlike industrial knitting or loom weaving, the unique physical knotting structure of
              crochet requires a human eye, manual tension control, and hand-swung bamboo hooks.
              Each piece in the **KNOTKARI** archive carries the distinctive signature rhythm of its
              master artisan.
            </p>

            <div className="space-y-4 pt-2">
              {[
                {
                  title: 'GOTS-Certified Organic Egyptian Cotton',
                  desc: 'Long-staple fibers mercerized for sublime silk sheen and enduring tensile strength.',
                },
                {
                  title: 'Internal Sculptural Wire Support',
                  desc: 'Flexible copper calyx structures allow you to bend, pose, and arrange stems endlessly.',
                },
                {
                  title: 'Zero Synthetic Microplastics',
                  desc: '100% natural fibers and natural vegetable dyes that gracefully age with time.',
                },
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4 items-start">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-headline text-sm font-semibold text-on-surface">
                      {item.title}
                    </h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <button
                onClick={onNavigateToStory}
                className="px-6 py-3 bg-surface-container-high hover:bg-surface-bright text-on-surface border border-outline-variant/30 text-xs font-label uppercase tracking-widest rounded transition-all flex items-center gap-2"
              >
                <span>Read The Karigari Manifesto</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </ScrollReveal>

          <ScrollReveal
            variant="fade-left"
            delay={200}
            duration={800}
            className="lg:col-span-6 grid grid-cols-2 gap-4"
          >
            <img
              src="https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&auto=format&fit=crop&q=80"
              alt="Crochet yarn and hooks in the atelier"
              className="rounded-2xl object-cover h-72 w-full border border-outline-variant/20 shadow-lg"
            />
            <img
              src="https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600&auto=format&fit=crop&q=80"
              alt="Master artisan crocheting handmade bouquet"
              className="rounded-2xl object-cover h-72 w-full mt-8 border border-outline-variant/20 shadow-lg"
            />
          </ScrollReveal>
        </div>
      </section>

      {/* 5. PATRON PRAISE & REVIEWS */}
      <section className="py-20 bg-surface-container-lowest border-t border-outline-variant/10">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <ScrollReveal variant="fade-up" className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <div className="flex justify-center items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <h2 className="font-display text-3xl sm:text-4xl text-on-background">
              Patron Praise & Testimonials
            </h2>
            <p className="text-xs font-body text-on-surface-variant">
              Hear from discerning collectors who chose KNOTKARI everlasting slow-fashion pieces.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  "The Midnight Tulip Ensemble looks breathtaking on our mahogany console. The stitch precision is unlike anything I've seen in modern retail.",
                name: 'Dr. Rohini Mehta',
                location: 'Bengaluru',
                item: 'Midnight Tulip Ensemble',
                verified: true,
              },
              {
                quote:
                  'Received the Artisan Daisy Charm wrapped with real wax seal and calligraphy note. It feels like haute couture right out of an old-world European salon.',
                name: 'Tanya Sen',
                location: 'South Mumbai',
                item: 'Artisan Daisy Charm',
                verified: true,
              },
              {
                quote:
                  'I bought the sunflower bouquet for our 5th anniversary. It still looks brand new months later. Truly an everlasting heirloom piece.',
                name: 'Aditya Varma',
                location: 'New Delhi',
                item: 'Sun-Kissed Single Bloom',
                verified: true,
              },
            ].map((review, i) => (
              <ScrollReveal
                key={i}
                variant="fade-up"
                delay={i * 120}
                className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/20 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-3">
                  <div className="flex text-amber-400 gap-1">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                  <p className="font-serif italic text-sm text-on-surface leading-relaxed">
                    "{review.quote}"
                  </p>
                </div>

                <div className="pt-4 border-t border-outline-variant/10 flex justify-between items-end">
                  <div>
                    <h4 className="font-headline text-sm font-semibold text-on-surface">
                      {review.name}
                    </h4>
                    <p className="text-[11px] text-on-surface-variant">
                      {review.location} • Acquired {review.item}
                    </p>
                  </div>
                  {review.verified && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-label uppercase font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Verified Patron
                    </span>
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 6. TRUST & FREQUENTLY ASKED QUESTIONS */}
      <section className="py-20 px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto">
        <ScrollReveal variant="fade-up" className="text-center mb-12 space-y-2">
          <span className="font-label text-xs uppercase tracking-widest text-primary font-semibold">
            Transparency & Support
          </span>
          <h2 className="font-display text-3xl text-on-background">Frequently Asked Inquiries</h2>
        </ScrollReveal>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <ScrollReveal
              key={idx}
              variant="fade-up"
              delay={idx * 70}
              distance="16px"
              className="bg-surface-container-low rounded-xl border border-outline-variant/20 overflow-hidden"
            >
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full p-5 text-left flex justify-between items-center gap-4 hover:bg-surface-container/50 transition-colors"
              >
                <span className="font-headline text-sm md:text-base font-semibold text-on-surface">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-primary shrink-0 transition-transform duration-200 ${
                    activeFaq === idx ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {activeFaq === idx && (
                <div className="p-5 pt-0 text-xs sm:text-sm text-on-surface-variant font-body leading-relaxed border-t border-outline-variant/10 animate-fade-in">
                  {faq.a}
                </div>
              )}
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Product Quick-View Modal */}
      {selectedProductForModal && (
        <ProductModal
          product={selectedProductForModal}
          onClose={() => setSelectedProductForModal(null)}
        />
      )}
    </main>
  );
}
