import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ToastProvider } from './context/ToastContext';
import { WishlistProvider } from './context/WishlistContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { VirtualQueueModal } from './components/VirtualQueueModal';
import { TrafficGuardBanner } from './components/TrafficGuardBanner';
import { SearchModal } from './components/SearchModal';
import { ScrollToTopOnNav } from './components/ScrollToTop';
import { Seo } from './lib/seo';
import { ShopGridSkeleton } from './components/Skeleton';

const LandingPage = lazy(() =>
  import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })),
);
const ShopPage = lazy(() => import('./pages/ShopPage').then((m) => ({ default: m.ShopPage })));
const CartPage = lazy(() => import('./pages/CartPage').then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() =>
  import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })),
);
const AuthPage = lazy(() => import('./pages/AuthPage').then((m) => ({ default: m.AuthPage })));
const AccountPage = lazy(() =>
  import('./pages/AccountPage').then((m) => ({ default: m.AccountPage })),
);
const StoryPage = lazy(() => import('./pages/StoryPage').then((m) => ({ default: m.StoryPage })));
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

function PageFallback() {
  return (
    <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto pt-12">
      <Seo title="Loading · Luxe Craft Atelier" />
      <ShopGridSkeleton count={6} />
    </div>
  );
}

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // helpers passed down as replacement for the old setCurrentPage prop
  const goTo = (path) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onOpenSearch = () => setIsSearchOpen(true);
  const onClearSearch = () => setSearchQuery('');

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background selection:bg-primary/25 selection:text-primary-fixed">
      <ScrollToTopOnNav />
      <TrafficGuardBanner />

      <Navbar onOpenSearch={onOpenSearch} />

      <SearchModal
        open={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSearch={(query) => {
          setSearchQuery(query);
          setIsSearchOpen(false);
          if (location.pathname !== '/shop') goTo('/shop');
        }}
      />

      <main className="flex-grow">
        <ErrorBoundary>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route
                path="/"
                element={
                  <LandingPage
                    onNavigateToShop={() => goTo('/shop')}
                    onNavigateToStory={() => goTo('/story')}
                  />
                }
              />
              <Route
                path="/shop"
                element={
                  <ShopPage initialSearchQuery={searchQuery} onClearSearch={onClearSearch} />
                }
              />
              <Route
                path="/cart"
                element={
                  <CartPage
                    onNavigateToCheckout={() => goTo('/checkout')}
                    onNavigateToShop={() => goTo('/shop')}
                  />
                }
              />
              <Route
                path="/checkout"
                element={
                  <CheckoutPage
                    onNavigateToShop={() => goTo('/shop')}
                    onNavigateToAccount={() => goTo('/account')}
                  />
                }
              />
              <Route
                path="/auth"
                element={
                  <AuthPage
                    onAuthSuccess={() => goTo('/account')}
                    onNavigateToShop={() => goTo('/shop')}
                  />
                }
              />
              <Route
                path="/account"
                element={
                  <AccountPage
                    onNavigateToShop={() => goTo('/shop')}
                    onNavigateToAuth={() => goTo('/auth')}
                  />
                }
              />
              <Route path="/story" element={<StoryPage onNavigateToShop={() => goTo('/shop')} />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      <CartDrawer
        onNavigateToCheckout={() => goTo('/checkout')}
        onNavigateToCart={() => goTo('/cart')}
      />

      <VirtualQueueModal />
      <Footer />
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err) {
    console.error('[ErrorBoundary] route crashed:', err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center py-20 px-6">
          <Seo title="Atelier Glitch · Luxe Craft Atelier" />
          <h1 className="font-display text-3xl mb-4">A stitch dropped.</h1>
          <p className="text-on-surface-variant mb-6">
            Refresh the page to return to the boutique, or continue browsing the collection.
          </p>
          <button
            onClick={() => window.location.assign('/')}
            className="px-6 py-3 bg-primary text-on-primary rounded-xl text-xs uppercase tracking-widest"
          >
            Return to Atelier
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <WishlistProvider>
              <CartProvider>
                <AppRoutes />
              </CartProvider>
            </WishlistProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}
