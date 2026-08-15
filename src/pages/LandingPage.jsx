import React, { useState } from 'react';
import { PRODUCTS } from '../data/products';
import { ProductCard } from '../components/ProductCard';
import { ProductModal } from '../components/ProductModal';
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

  const featuredProducts = PRODUCTS.slice(0, 4);

  const stats = [
    { value: '100%', label: 'GOTS Organic Fibers', icon: Feather },
    { value: '5.8 hrs', label: 'Avg Craft Time per Piece', icon: Clock },
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
      a: 'We support industry-standard encrypted payments via Razorpay (UPI, Google Pay, PhonePe, Paytm, all major Credit/Debit Cards, NetBanking) and international payment networks.',
    },
    {
      q: 'Can I include a personalized calligraphy gift note?',
      a: 'Yes! Every order includes complimentary archival kraft wrapping and a wax-sealed calligraphy card. You can add your bespoke message during checkout.',
    },
  ];

  return (
    <main className="flex-grow w-full overflow-hidden">
      {/* 1. EDITORIAL HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-margin-mobile md:px-margin-desktop py-20 bg-radial-gradient">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-container-max mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
          {/* Left Text & CTAs */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-surface-container-high/80 border border-primary/30 text-primary text-xs font-label uppercase tracking-widest backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bespoke Karigari • Slow-Fashion Crochet</span>
            </div>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-on-background tracking-tight leading-[1.08]">
              Heritage Knots. <br />
              <span className="italic font-normal text-primary-fixed">Timeless Karigari.</span>
            </h1>

            <p className="font-body text-base sm:text-lg text-on-surface-variant max-w-xl leading-relaxed">
              Elevating the ancient intimacy of crochet into haute slow-fashion couture. Everlasting
              botanical bouquets, heirloom carryalls, and bespoke charms hand-looped by master
              artisans.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                onClick={onNavigateToShop}
                className="px-8 py-4 bg-on-background hover:bg-primary-fixed text-background hover:text-on-primary-fixed font-label text-xs uppercase tracking-widest font-semibold rounded transition-all duration-300 shadow-xl flex items-center justify-center gap-3 group"
              >
                <span>Explore The Collection</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onNavigateToStory}
                className="px-8 py-4 bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 text-on-surface font-label text-xs uppercase tracking-widest rounded transition-all flex items-center justify-center gap-2"
              >
                <span>Our Karigari Story</span>
              </button>
            </div>

            {/* Quick Feature Tickers */}
            <div className="pt-8 border-t border-outline-variant/15 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center gap-1.5 text-primary text-sm font-semibold">
                      <Icon className="w-4 h-4" />
                      <span>{stat.value}</span>
                    </div>
                    <p className="text-[11px] font-label uppercase tracking-wider text-on-surface-variant leading-tight">
                      {stat.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Hero Visual Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Main Lookbook Visual */}
              <div className="aspect-[4/5] rounded-2xl overflow-hidden border border-outline-variant/30 shadow-2xl relative group">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBHwtqSmwPaSvvRpSkfHi4nFMO4V8b0mxN5_UANwuPz8DeWadaI1vWEWQ7gMAqnaC6cb6KL4Nam3givx7g3Yr2Ii4WgKJh7fQRAfYTs8hlCdre94QrgIjpueAj_K7tR9eb71cmNgvaNxCWphz7xMWo6ngjt1asvvKzY8kGKUFSCRx79JR6cBSk57XcfCT2VfJwIMwbpzz_AV_HYkF7nqwAUVHaQY9yIBwdzb9keFl4rUURcnAtzm8Wpe3MmI-EDe6jdhrs"
                  alt="KNOTKARI Handcrafted Sunburst Sunflower Crochet Bouquet"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />

                {/* Floating Artisan Card */}
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-surface-container-lowest/90 backdrop-blur-md border border-outline-variant/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-label uppercase tracking-widest text-primary font-semibold block">
                      Limited Karigari Drop
                    </span>
                    <h4 className="font-headline text-base text-on-surface font-semibold">
                      Sun-Kissed Golden Bloom
                    </h4>
                    <p className="text-xs text-on-surface-variant font-mono">
                      5.0 hrs • Organic Merino Wool
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      addToCart(PRODUCTS[1], 1);
                      addToast('Added Sun-Kissed Bloom to Bag', 'success');
                    }}
                    className="p-3 bg-primary text-on-primary rounded-lg hover:bg-primary-fixed transition-colors"
                    title="Quick Add"
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Floating Badge Accent */}
              <div className="absolute -top-4 -left-4 px-4 py-2 rounded-full bg-surface-container-high border border-primary/40 shadow-lg text-[11px] font-label uppercase tracking-widest text-on-background flex items-center gap-1.5 animate-bounce">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Monsoon 2026 Capsule</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CURATED COLLECTIONS GRID */}
      <section className="py-20 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="font-label text-xs uppercase tracking-widest text-primary font-semibold">
            Curated Portals
          </span>
          <h2 className="font-display text-3xl sm:text-4xl text-on-background">
            Explore Handcrafted Categories
          </h2>
          <p className="text-sm font-body text-on-surface-variant">
            From everlasting floral stem sculptures to intricate accessory charms and slow-fashion
            carryalls.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Botanical Bouquets & Stems',
              desc: 'Sculptural everlasting tulips, sunflowers, and French lavender crafted from organic mercerized yarn.',
              image:
                'https://lh3.googleusercontent.com/aida-public/AB6AXuDd-Z9FKQEqLMSctYI9Sq3o05hpPALgXJRsmL4WgHEmXFMnrOlYG9-FUvrtjXP9fBn35MYTMAec0mp_bUb4xrbotW0tyjLroFEvvfXnZG7BGru-WNtuA_EIgln6BrJjYoUpbk3SM6tsiRpBd2VAeVS3kkLxzvcDWcETlH4sLtDzYYKBvIRy7VN-0R5_5oaiMSjxqlEOcbyOWRpPlIy0ahe-vXE4UUXSpXyhlt4lA5Dl0NImoSBbl3G-TvQ8hRV51_jqwHo',
              category: 'bouquets',
            },
            {
              title: 'Charms & Handcrafted Accents',
              desc: 'Delicate daisy clips, botanical keychains, and heirloom brooches with 925 sterling silver hardware.',
              image:
                'https://lh3.googleusercontent.com/aida-public/AB6AXuBsud4sLvFgIeiO9gtKVCuIb5MLXPM9trOBkDI4ZddIZpq-nnfkb5-WZSh_BVHW5oF01QSjml1paGQ6aiyV6Cqp7llciS_jNMYkbxWEjWVwxBTDyl-4TYtgkVqADoYojwwvMreGM-wqJZlNbJHYg2Dm0dlkNT6ag1625UG1DYO4WMYPUokul7mlvZfmaRS6LXt2tZgU3QMWWapYRyoYEo3WScNejNJyeDdOgqaDYfkJxslA_053aruBzupHuUiPQcFceq8',
              category: 'charms',
            },
            {
              title: 'Heirloom Totes & Carryalls',
              desc: 'Structural waffle-stitch and granny-square handbags reinforced with organic cotton linen linings.',
              image:
                'https://lh3.googleusercontent.com/aida-public/AB6AXuB29kX22QcMhD-v5fI53l6_gZ99kZ_G0_1wH9f5YjG0oU6a8i2dF8H0uJ9a_a1cE7gB8kD2iM4oP1qR3sT5uV7wX9yZ_A0bC2dE4fG6hI8jK0lM2nO4pQ6rS8tU0vW2xY4z-example-tote-crochet',
              fallbackImage:
                'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&auto=format&fit=crop&q=80',
              category: 'handbags',
            },
          ].map((col, idx) => (
            <div
              key={idx}
              onClick={onNavigateToShop}
              className="group relative h-96 rounded-2xl overflow-hidden cursor-pointer border border-outline-variant/20 shadow-lg"
            >
              <img
                src={col.fallbackImage || col.image}
                alt={col.title}
                onError={(e) => {
                  if (col.fallbackImage) e.target.src = col.fallbackImage;
                }}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-90 group-hover:opacity-80 transition-opacity" />

              <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2">
                <span className="text-[10px] font-label uppercase tracking-widest text-primary font-semibold">
                  Collection {idx + 1}
                </span>
                <h3 className="font-display text-2xl text-on-background group-hover:text-primary transition-colors">
                  {col.title}
                </h3>
                <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                  {col.desc}
                </p>
                <div className="pt-2 flex items-center gap-2 text-xs font-label uppercase tracking-widest text-primary font-semibold">
                  <span>Shop Collection</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. FEATURED ATELIER DROPS */}
      <section className="py-20 bg-surface-container-lowest border-y border-outline-variant/10">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
            <div>
              <span className="font-label text-xs uppercase tracking-widest text-primary font-semibold">
                Signature Pieces
              </span>
              <h2 className="font-display text-3xl sm:text-4xl text-on-background mt-1">
                Featured Karigari Drops
              </h2>
            </div>
            <button
              onClick={onNavigateToShop}
              className="text-xs font-label uppercase tracking-widest text-primary hover:underline flex items-center gap-1.5"
            >
              <span>View Full Atelier Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                layoutMode="grid"
                onOpenModal={setSelectedProductForModal}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 4. THE KARIGARI CRAFT MANIFESTO */}
      <section className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
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
          </div>

          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
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
          </div>
        </div>
      </section>

      {/* 5. PATRON PRAISE & REVIEWS */}
      <section className="py-20 bg-surface-container-lowest border-t border-outline-variant/10">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
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
          </div>

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
              <div
                key={i}
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. TRUST & FREQUENTLY ASKED QUESTIONS */}
      <section className="py-20 px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto">
        <div className="text-center mb-12 space-y-2">
          <span className="font-label text-xs uppercase tracking-widest text-primary font-semibold">
            Transparency & Support
          </span>
          <h2 className="font-display text-3xl text-on-background">Frequently Asked Inquiries</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
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
            </div>
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
