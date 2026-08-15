import React, { useState } from 'react';
import { ToastProvider } from './context/ToastContext';
import { WishlistProvider } from './context/WishlistContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { VirtualQueueModal } from './components/VirtualQueueModal';
import { TrafficGuardBanner } from './components/TrafficGuardBanner';

import { LandingPage } from './pages/LandingPage';
import { ShopPage } from './pages/ShopPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { AuthPage } from './pages/AuthPage';
import { AccountPage } from './pages/AccountPage';
import { StoryPage } from './pages/StoryPage';

import { Search, X } from 'lucide-react';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'shop' | 'cart' | 'checkout' | 'auth' | 'account' | 'story'
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      setCurrentPage('shop');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background selection:bg-primary/25 selection:text-primary-fixed">
      {/* Top Security & Traffic Surge Shield Bar */}
      <TrafficGuardBanner />

      {/* Primary Sticky Glass Navigation */}
      <Navbar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Search Modal Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-background/90 backdrop-blur-xl animate-fade-in">
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 max-w-2xl w-full relative shadow-2xl">
            <button
              onClick={() => setIsSearchOpen(false)}
              className="absolute top-4 right-4 p-2 text-on-surface-variant hover:text-on-surface"
              aria-label="Close search"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-display text-xl text-on-background mb-4">
              Search KNOTKARI Creations
            </h3>

            <form onSubmit={handleSearchSubmit} className="relative mb-4">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Search by flower name, yarn type, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-4 py-3 bg-surface-container rounded-xl border border-outline-variant/30 text-sm text-on-background placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none font-body"
              />
            </form>

            <div className="flex flex-wrap gap-2 text-xs text-on-surface-variant">
              <span className="font-label uppercase tracking-wider text-[10px] text-on-surface font-semibold py-1">
                Popular Searches:
              </span>
              {['Daisy', 'Sunflower', 'Tulip', 'Lavender', 'Tote', 'Merino Wool', 'Karigari'].map(
                (term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setSearchQuery(term);
                      setIsSearchOpen(false);
                      setCurrentPage('shop');
                    }}
                    className="px-3 py-1 bg-surface-container-high hover:bg-primary hover:text-on-primary rounded-lg transition-colors text-[11px]"
                  >
                    {term}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Page Router */}
      {currentPage === 'home' && (
        <LandingPage
          onNavigateToShop={() => {
            setCurrentPage('shop');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNavigateToStory={() => {
            setCurrentPage('story');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNavigateToAuth={() => {
            setCurrentPage('auth');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {currentPage === 'shop' && (
        <ShopPage initialSearchQuery={searchQuery} onClearSearch={() => setSearchQuery('')} />
      )}

      {currentPage === 'cart' && (
        <CartPage
          onNavigateToCheckout={() => {
            setCurrentPage('checkout');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNavigateToShop={() => {
            setCurrentPage('shop');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {currentPage === 'checkout' && (
        <CheckoutPage
          onNavigateToShop={() => {
            setCurrentPage('shop');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNavigateToAccount={() => {
            setCurrentPage('account');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {currentPage === 'auth' && (
        <AuthPage
          onAuthSuccess={() => {
            setCurrentPage('account');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNavigateToShop={() => {
            setCurrentPage('shop');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {currentPage === 'account' && (
        <AccountPage
          onNavigateToShop={() => {
            setCurrentPage('shop');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNavigateToAuth={() => {
            setCurrentPage('auth');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {currentPage === 'story' && (
        <StoryPage
          onNavigateToShop={() => {
            setCurrentPage('shop');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* Global Slide-Out Cart Drawer */}
      <CartDrawer
        onNavigateToCheckout={() => {
          setCurrentPage('checkout');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateToCart={() => {
          setCurrentPage('cart');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* High-Traffic Surge Waiting Room Queue Modal */}
      <VirtualQueueModal />

      {/* Editorial Luxury Footer */}
      <Footer setCurrentPage={setCurrentPage} />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
