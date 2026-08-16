import React, { useState, useMemo, useEffect } from 'react';
import { PRODUCTS as DEFAULT_PRODUCTS, CATEGORIES } from '../data/products';
import { getProductsFromSupabase } from '../lib/supabase';
import { ProductCard } from '../components/ProductCard';
import { ProductModal } from '../components/ProductModal';
import {
  LayoutGrid,
  SlidersHorizontal,
  Search,
  Sparkles,
  Filter,
  Grid3X3,
  Grid2X2,
} from 'lucide-react';
import { searchLimiter } from '../utils/rateLimiter';
import { useToast } from '../context/ToastContext';

export function ShopPage({ initialSearchQuery = '', onClearSearch }) {
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [sortBy, setSortBy] = useState('featured');
  const [gridColumns, setGridColumns] = useState('compact'); // 'compact' (4 cols) | 'standard' (3 cols)
  const [selectedProductForModal, setSelectedProductForModal] = useState(null);
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
    return products
      .filter((product) => {
        const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
        const matchesSearch =
          !searchQuery ||
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.yarnType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        if (sortBy === 'bestseller') return (b.reviewsCount || 0) - (a.reviewsCount || 0);
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [products, selectedCategory, searchQuery, sortBy]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    const check = searchLimiter.consume(1);
    if (!check.allowed) {
      addToast('Search throttling active to conserve bandwidth.', 'info');
    }
    setSearchQuery(val);
  };

  return (
    <main className="flex-grow pt-8 pb-16 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto w-full">
      {/* Header Section */}
      <section className="mb-8 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container rounded-full border border-outline-variant/20 mb-3 text-xs text-primary font-semibold uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Handcrafted in Limited Runs • Pricing in INR</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-on-background tracking-tight mb-2">
          The Artisan Collection
        </h1>
        <p className="font-body text-sm sm:text-base text-on-surface-variant leading-relaxed">
          Explore our handcrafted everlasting crochet bouquets and charms. Carefully proportioned
          with high-detail stitchwork and fast dispatch.
        </p>
      </section>

      {/* Filter, Search & Sort Control Bar (Amazon Inspired) */}
      <section className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/20 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Category Chips */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`font-label text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-full transition-all duration-200 ${
                selectedCategory === cat.id
                  ? 'bg-primary text-on-primary font-bold shadow-sm'
                  : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant/20'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search, Sort, and Grid Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Live Search Input */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-8 py-2 bg-surface-container text-xs rounded-lg border border-outline-variant/25 text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  if (onClearSearch) onClearSearch();
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant hover:text-on-surface"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-surface-container px-3 py-2 rounded-lg border border-outline-variant/25 text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-on-surface-variant" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-on-surface focus:outline-none cursor-pointer font-medium text-xs"
            >
              <option value="featured" className="bg-surface-container">
                Sort by: Featured
              </option>
              <option value="bestseller" className="bg-surface-container">
                Sort by: Best Sellers
              </option>
              <option value="price-low" className="bg-surface-container">
                Price: Low to High
              </option>
              <option value="price-high" className="bg-surface-container">
                Price: High to Low
              </option>
              <option value="rating" className="bg-surface-container">
                Avg. Customer Review
              </option>
            </select>
          </div>

          {/* Column Layout Toggle */}
          <div className="hidden lg:flex items-center border border-outline-variant/20 rounded-lg bg-surface-container p-0.5">
            <button
              onClick={() => setGridColumns('compact')}
              className={`p-1.5 rounded transition-colors ${
                gridColumns === 'compact'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              title="Compact 4-5 Column Grid (Amazon Style)"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setGridColumns('standard')}
              className={`p-1.5 rounded transition-colors ${
                gridColumns === 'standard'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              title="Standard 3 Column Grid"
            >
              <Grid2X2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-on-surface-variant mb-4 px-1">
        <span>
          Showing <strong>1–{filteredProducts.length}</strong> of {filteredProducts.length}{' '}
          handcrafted products
        </span>
        <span className="text-[11px]">All prices in Indian Rupee (₹) • Inclusive of taxes</span>
      </div>

      {/* Amazon-Style Compact Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 space-y-4 bg-surface-container-low rounded-xl border border-outline-variant/10">
          <p className="font-display text-xl text-on-surface">No Products Found</p>
          <p className="text-xs font-body text-on-surface-variant max-w-md mx-auto">
            We could not find any pieces matching "{searchQuery}". Try searching for 'sunflower',
            'tulip', 'daisy', or resetting filters.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="px-5 py-2 bg-primary text-on-primary text-xs font-bold rounded-lg shadow-sm"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div
          className={`grid gap-4 sm:gap-5 ${
            gridColumns === 'compact'
              ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }`}
        >
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              layoutMode="grid"
              onQuickView={(p) => setSelectedProductForModal(p)}
            />
          ))}
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
