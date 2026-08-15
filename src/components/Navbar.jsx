import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';

export function Navbar({ onOpenSearch }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItemCount, setIsCartDrawerOpen } = useCart();
  const { wishlist } = useWishlist();
  const { isAuthenticated, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: '/', label: 'Home' },
    { id: '/shop', label: 'Artisan Shop' },
    { id: '/story', label: 'Karigari Craft' },
    { id: '/cart', label: 'Bag' },
    {
      id: '/account',
      label: isAuthenticated ? user?.name?.split(' ')[0] || 'Dashboard' : 'Patron Portal',
    },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const goTo = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <header className="sticky top-0 w-full z-40 bg-background/90 backdrop-blur-lg border-b border-outline-variant/10 transition-all duration-300">
        <div className="flex justify-between items-center h-20 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-on-background hover:text-primary transition-colors p-2 -ml-2 rounded-lg hover:bg-surface-bright/10"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <span className="material-symbols-outlined">close</span>
            ) : (
              <span className="material-symbols-outlined">menu</span>
            )}
          </button>

          {/* Brand Logo */}
          <button
            onClick={() => goTo('/')}
            className="flex items-center gap-2 text-left focus:outline-none group"
          >
            <span className="font-display text-2xl md:text-3xl tracking-tighter text-on-background group-hover:text-primary transition-colors">
              KNOTKARI
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[9px] font-label uppercase tracking-widest bg-primary/15 text-primary border border-primary/25">
              Atelier
            </span>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 font-label text-xs uppercase tracking-widest font-semibold">
            {navLinks.map((link) => {
              const active = isActive(link.id);
              return (
                <button
                  key={link.id}
                  onClick={() => goTo(link.id)}
                  className={`py-1.5 transition-all duration-200 ${
                    active
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-on-surface-variant hover:text-on-background hover:bg-surface-bright/10 px-2 rounded-md'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onOpenSearch}
              className="text-on-background hover:text-primary transition-colors p-2 rounded-lg hover:bg-surface-bright/10"
              aria-label="Search Collection"
              title="Search collection"
            >
              <span className="material-symbols-outlined">search</span>
            </button>

            <button
              onClick={() => goTo('/account')}
              className="relative text-on-background hover:text-primary transition-colors p-2 rounded-lg hover:bg-surface-bright/10 hidden sm:flex"
              aria-label="View Wishlist"
              title="Your Wishlist"
            >
              <span className="material-symbols-outlined">favorite</span>
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 bg-tertiary text-on-tertiary text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-fade-in">
                  {wishlist.length}
                </span>
              )}
            </button>

            <button
              onClick={() => goTo(isAuthenticated ? '/account' : '/auth')}
              className="text-on-background hover:text-primary transition-colors p-2 rounded-lg hover:bg-surface-bright/10 hidden sm:flex"
              aria-label="Member Account"
              title={isAuthenticated ? `Signed in as ${user?.name}` : 'Member Sign In'}
            >
              <span
                className={`material-symbols-outlined ${isAuthenticated ? 'text-primary' : ''}`}
              >
                person
              </span>
            </button>

            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="relative text-on-background hover:text-primary transition-colors p-2 rounded-lg hover:bg-surface-bright/10"
              aria-label="Open Atelier Cart"
              title="Atelier Cart Drawer"
            >
              <span className="material-symbols-outlined">shopping_bag</span>
              {totalItemCount > 0 && (
                <span className="absolute top-1 right-1 bg-primary text-on-primary text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {totalItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-background/95 backdrop-blur-2xl animate-fade-in flex flex-col pt-24 px-6 pb-12">
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-6 right-6 p-2 text-on-surface-variant hover:text-on-surface"
            aria-label="Close menu"
          >
            <span className="material-symbols-outlined">close</span>
          </button>

          <div className="text-center mb-8 space-y-1">
            <span className="font-display text-3xl tracking-tighter text-on-background">
              KNOTKARI
            </span>
            <p className="text-xs uppercase tracking-widest text-primary font-semibold">
              Luxury Slow-Craft Atelier
            </p>
          </div>

          <nav className="flex flex-col gap-5 font-label uppercase tracking-widest text-base text-center flex-grow justify-center">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => goTo(link.id)}
                className={`py-3 transition-colors ${
                  isActive(link.id)
                    ? 'text-primary font-bold border-b border-primary/40'
                    : 'text-on-surface-variant hover:text-on-background'
                }`}
              >
                {link.label}
              </button>
            ))}
            {!isAuthenticated && (
              <button
                onClick={() => goTo('/auth')}
                className="py-3 text-on-surface-variant hover:text-primary"
              >
                Sign In / Register
              </button>
            )}
          </nav>

          <div className="border-t border-outline-variant/20 pt-6 flex justify-around text-on-surface-variant">
            <button
              onClick={() => goTo('/account')}
              className="flex items-center gap-2 text-xs uppercase tracking-wider"
            >
              <span className="material-symbols-outlined text-[16px]">favorite</span>
              <span>Wishlist ({wishlist.length})</span>
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsCartDrawerOpen(true);
              }}
              className="flex items-center gap-2 text-xs uppercase tracking-wider"
            >
              <span className="material-symbols-outlined text-[16px]">shopping_bag</span>
              <span>Bag ({totalItemCount})</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
