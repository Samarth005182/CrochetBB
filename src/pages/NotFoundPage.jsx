import { useLocation, useNavigate } from 'react-router-dom';
import { Seo } from '../lib/seo';

const ROUTE_LABELS = {
  '/': 'Home',
  '/shop': 'Artisan Shop',
  '/story': 'Karigari Craft',
  '/cart': 'Bag',
  '/account': 'Patron Portal',
};

export function NotFoundPage() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="max-w-xl mx-auto text-center px-6 py-28">
      <Seo
        title="Page Not Found"
        path={location.pathname}
        description="404 — this page has unraveled."
      />
      <p className="font-label text-xs uppercase tracking-widest text-primary mb-4">Error 404</p>
      <h1 className="font-display text-5xl tracking-tighter text-on-background mb-6">
        This thread has unraveled.
      </h1>
      <p className="font-body text-sm text-on-surface-variant mb-10 leading-relaxed">
        The page you're searching for has slipped beyond the loom. Return to the boutique or
        continue your journey through our slow-fashion collection.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="px-7 py-3 bg-primary text-on-primary text-xs font-label uppercase tracking-widest rounded-xl hover:opacity-90 transition-opacity"
        >
          Return Home
        </button>
        <button
          onClick={() => navigate('/shop')}
          className="px-7 py-3 border border-outline-variant/40 text-on-background text-xs font-label uppercase tracking-widest rounded-xl hover:bg-surface-container-high transition-colors"
        >
          Browse Collection
        </button>
      </div>
      <p className="mt-12 text-[10px] uppercase tracking-widest text-on-surface-variant/50">
        Path: {location.pathname}
      </p>
    </div>
  );
}
