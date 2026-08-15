import React, { useState, useMemo, useEffect } from 'react';
import { PRODUCTS as DEFAULT_PRODUCTS, CATEGORIES } from '../data/products';
import { getProductsFromSupabase } from '../lib/supabase';
import { ProductCard } from '../components/ProductCard';
import { ProductModal } from '../components/ProductModal';
import { LayoutGrid, Columns, SlidersHorizontal, Search, Sparkles, Filter, Database } from 'lucide-react';
import { searchLimiter } from '../utils/rateLimiter';
import { useToast } from '../context/ToastContext';

export function ShopPage({ initialSearchQuery = '', onClearSearch }) {
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [sortBy, setSortBy] = useState('featured');
  const [layoutMode, setLayoutMode] = useState('editorial'); // 'editorial' | 'grid'
  const [selectedProductForModal, setSelectedProductForModal] = useState(null);
  const [visibleCount, setVisibleCount] = useState(6);
  const { addToast } = useToast();

  useEffect(() => {
    async function loadCatalog() {
      setIsLoadingProducts(true);
      const data = await getProductsFromSupabase();
      if (data && data.length > 0) {
        setProducts(data);
      }
      setIsLoadingProducts(false);
    }
    loadCatalog();
  }, []);

  // Filter & Sort logic
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'all' || product.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.yarnType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });
  }, [selectedCategory, searchQuery, sortBy]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    const check = searchLimiter.consume(1);
    if (!check.allowed) {
      addToast("Search throttling active to conserve bandwidth.", "info");
    }
    setSearchQuery(val);
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 3);
    addToast("Loaded archived atelier creations.", "info");
  };

  return (
    <main className="flex-grow pt-10 pb-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full">
      {/* Header Section */}
      <section className="mb-16 md:mb-20 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container rounded-full border border-outline-variant/20 mb-4 text-xs text-primary font-semibold uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Handcrafted in Limited Runs</span>
        </div>
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-on-background tracking-tight mb-4">
          The Artisan Collection
        </h1>
        <p className="font-body text-base md:text-lg text-on-surface-variant leading-relaxed">
          Curated hand-crocheted pieces, meticulously crafted for the discerning eye. A celebration of slow fashion, intricate texture, and timeless form.
        </p>
      </section>

      {/* Filter, Search & Layout Control Bar */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 pb-6 border-b border-outline-variant/15 gap-6">
        {/* Category Chips */}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`font-label text-xs uppercase tracking-widest px-4 py-2 rounded transition-all duration-200 ${
                selectedCategory === cat.id
                  ? 'bg-primary text-on-primary font-semibold shadow-md'
                  : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant/20'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search, Sort, and Layout controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Live Search Input */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Search works..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-3 py-1.5 bg-surface-container text-xs rounded border border-outline-variant/20 text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); if (onClearSearch) onClearSearch(); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant hover:text-on-surface"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 bg-surface-container px-3 py-1.5 rounded border border-outline-variant/20 text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-on-surface-variant" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-on-surface focus:outline-none cursor-pointer uppercase tracking-wider font-label text-[11px]"
            >
              <option value="featured" className="bg-surface-container-low">Featured Works</option>
              <option value="price-low" className="bg-surface-container-low">Price: Low to High</option>
              <option value="price-high" className="bg-surface-container-low">Price: High to Low</option>
              <option value="rating" className="bg-surface-container-low">Highest Rated</option>
            </select>
          </div>

          {/* Layout Toggle (Editorial Asymmetric vs Uniform Grid) */}
          <div className="hidden sm:flex items-center border border-outline-variant/20 rounded bg-surface-container p-0.5">
            <button
              onClick={() => setLayoutMode('editorial')}
              className={`p-1.5 rounded transition-colors ${
                layoutMode === 'editorial' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
              title="Editorial Lookbook View"
            >
              <Columns className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLayoutMode('grid')}
              className={`p-1.5 rounded transition-colors ${
                layoutMode === 'grid' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
              title="Uniform Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Product Catalog Display */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-24 space-y-4 bg-surface-container-low rounded border border-outline-variant/10">
          <p className="font-display text-2xl text-on-surface">No Creations Found</p>
          <p className="text-sm font-body text-on-surface-variant max-w-md mx-auto">
            We could not find any pieces matching your current filter or search criteria.
          </p>
          <button
            onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
            className="px-6 py-2.5 bg-surface-container-high text-xs font-label uppercase tracking-widest text-primary border border-primary/30 rounded"
          >
            Reset Filters
          </button>
        </div>
      ) : layoutMode === 'editorial' ? (
        /* Asymmetric Editorial Lookbook Grid */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
          {filteredProducts.slice(0, visibleCount).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              layout="editorial"
              onQuickView={(p) => setSelectedProductForModal(p)}
            />
          ))}
        </div>
      ) : (
        /* Standard 3-Column Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.slice(0, visibleCount).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              layout="grid"
              onQuickView={(p) => setSelectedProductForModal(p)}
            />
          ))}
        </div>
      )}

      {/* Load More Archives Button */}
      {filteredProducts.length > visibleCount && (
        <div className="mt-24 text-center">
          <button
            onClick={handleLoadMore}
            className="px-10 py-4 border border-outline-variant/50 text-on-surface font-label text-xs uppercase tracking-widest hover:bg-surface-bright/20 transition-all duration-300 rounded shadow-md"
          >
            View Archives & Older Editions
          </button>
        </div>
      )}

      {/* Quick View Product Modal */}
      {selectedProductForModal && (
        <ProductModal
          product={selectedProductForModal}
          onClose={() => setSelectedProductForModal(null)}
        />
      )}
    </main>
  );
}
