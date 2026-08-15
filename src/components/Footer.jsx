import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { authLimiter, validateHoneypot } from '../utils/rateLimiter';
import { ArrowRight, Sparkles, Shield, Heart } from 'lucide-react';

export function Footer({ setCurrentPage }) {
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const { addToast } = useToast();

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!validateHoneypot(honeypot)) {
      addToast('Verification check failed.', 'error');
      return;
    }

    const check = authLimiter.consume(1);
    if (!check.allowed) {
      addToast(`Please wait ${check.retryAfterSec}s before submitting.`, 'error');
      return;
    }

    if (!email || !email.includes('@')) {
      addToast('Please provide a valid email address.', 'error');
      return;
    }

    addToast(
      'Welcome to KNOTKARI. Enjoy 15% off with code SLOWCRAFT15 on your first order!',
      'success',
    );
    setEmail('');
  };

  return (
    <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/10 pt-20 pb-12 mt-auto">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        {/* Top Newsletter & Brand Statement */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-16 border-b border-outline-variant/10">
          <div className="lg:col-span-6 space-y-4">
            <span className="font-display text-3xl tracking-tighter text-on-background">
              KNOTKARI
            </span>
            <p className="font-body text-on-surface-variant max-w-md leading-relaxed text-sm">
              Honoring the timeless intimacy of handmade crochet and Indian karigari. Every loop and
              petal is woven with patience, passion, and supreme slow-fashion dedication.
            </p>
            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-primary/80 uppercase tracking-widest font-semibold">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Slow Fashion
              </span>
              <span className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5" /> 100% Organic Yarns
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Lifetime Heirloom Stitch
              </span>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <h4 className="font-headline text-lg text-on-background">The Karigari Gazette</h4>
            <p className="font-body text-xs text-on-surface-variant">
              Receive private invitations to limited-edition capsule drops, artisan journal entries,
              and a 15% welcome privilege voucher.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3">
              {/* Invisible Honeypot Anti-bot field */}
              <input
                type="text"
                name="user_note_secondary"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
              />
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="ghost-input flex-grow py-2 text-sm text-on-background placeholder:text-on-surface-variant/50 focus:border-b-primary"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 bg-surface-container-high hover:bg-surface-bright text-on-surface border border-outline-variant/30 text-xs font-label uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 rounded-xl"
              >
                <span>Join Atelier</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Footer Navigation Links */}
        <div className="py-8 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-on-surface-variant">
          <nav className="flex flex-wrap justify-center gap-6 md:gap-8">
            <button
              onClick={() => {
                setCurrentPage('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-primary transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => {
                setCurrentPage('shop');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-primary transition-colors"
            >
              Artisan Shop
            </button>
            <button
              onClick={() => {
                setCurrentPage('story');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-primary transition-colors"
            >
              Our Karigari Craft
            </button>
            <button
              onClick={() => {
                setCurrentPage('cart');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-primary transition-colors"
            >
              Bag & Shipping
            </button>
            <button
              onClick={() => {
                setCurrentPage('account');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-primary transition-colors"
            >
              Patron Dashboard
            </button>
          </nav>

          <p className="text-center font-body text-xs text-on-surface-variant/70">
            © {new Date().getFullYear()} KNOTKARI ATELIER. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </footer>
  );
}
