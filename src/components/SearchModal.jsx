import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Seo } from '../lib/seo';

/**
 * Standalone Search modal — extracted from the legacy App.jsx inline modal.
 * Reachable from Navbar. Promotes search query into shop route through
 * the URL search param rather than shared state where possible.
 */
export function SearchModal({ open, onClose, onSearch }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { addToast } = useCart();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query.trim());
  };

  const popular = ['Daisy', 'Sunflower', 'Tulip', 'Lavender', 'Tote', 'Merino Wool'];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-background/90 backdrop-blur-xl animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Search the atelier collection"
    >
      <Seo title="Search" path="/search" />
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-lg p-6 max-w-2xl w-full relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-on-surface-variant hover:text-on-surface"
          aria-label="Close search"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <h3 className="font-display text-xl text-on-background mb-4">
          Search the Atelier Collection
        </h3>

        <form onSubmit={handleSubmit} className="relative mb-4">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            placeholder="Search by flower name, yarn type, or keyword..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full pl-10 pr-4 py-3 bg-surface-container rounded border border-outline-variant/30 text-sm text-on-background placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none font-body"
          />
        </form>

        <div className="flex flex-wrap gap-2 text-xs text-on-surface-variant">
          <span className="font-label uppercase tracking-wider text-[10px] text-on-surface font-semibold py-1">
            Popular Searches:
          </span>
          {popular.map((term) => (
            <button
              key={term}
              onClick={() => {
                onSearch(term);
              }}
              className="px-2.5 py-1 bg-surface-container-high hover:bg-primary hover:text-on-primary rounded transition-colors text-[11px]"
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
