import React from 'react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { Heart, ShoppingBag, Eye, Star, Zap, Check } from 'lucide-react';

export function ProductCard({ product, onQuickView, onOpenModal, layoutMode = 'grid' }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const inWishlist = isInWishlist(product.id);
  const handleView = onQuickView || onOpenModal;

  const discountPercent =
    product.discountPercent ||
    (product.mrp && product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : null);

  const renderBadge = () => {
    if (!product.badge) return null;

    if (product.badgeType === 'bestseller' || product.badge.includes('Best Seller')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold bg-[#e67a00] text-white shadow-sm uppercase tracking-wide">
          {product.badge}
        </span>
      );
    }
    if (
      product.badgeType === 'highlight' ||
      product.badge.includes('Highlight') ||
      product.badge.includes('Spotlight') ||
      product.badge.includes('Edition')
    ) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold bg-[#1e293b] text-[#38bdf8] border border-[#38bdf8]/30 shadow-sm uppercase tracking-wide">
          {product.badge}
        </span>
      );
    }
    if (product.badgeType === 'deal' || product.badge.includes('Deal')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold bg-[#cc0c39] text-white shadow-sm uppercase tracking-wide">
          {product.badge}
        </span>
      );
    }
    if (
      product.badgeType === 'trending' ||
      product.badge.includes('Trending') ||
      product.badge.includes('Arrival')
    ) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold bg-emerald-800 text-emerald-200 border border-emerald-500/30 shadow-sm uppercase tracking-wide">
          {product.badge}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-semibold bg-surface-container-high/90 text-on-surface border border-outline-variant/30 backdrop-blur-sm">
        {product.badge}
      </span>
    );
  };

  return (
    <article
      className="group relative flex flex-col h-full bg-surface-container-lowest/80 hover:bg-surface-container-low/90 rounded-xl border border-outline-variant/20 hover:border-primary/40 transition-all duration-300 shadow-sm hover:shadow-xl p-3 sm:p-4 text-left"
      id={`card-${product.id}`}
    >
      {/* Product Image Container (Balanced, not oversized) */}
      <div
        className="relative w-full aspect-square sm:aspect-[4/5] max-h-56 sm:max-h-64 rounded-lg overflow-hidden bg-surface-container mb-3 cursor-pointer"
        onClick={() => handleView && handleView(product)}
      >
        <img
          src={product.image}
          alt={product.alt || product.name}
          loading="lazy"
          className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Amazon-style Badges */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start">
          {renderBadge()}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`absolute top-2 right-2 z-10 p-2 rounded-full backdrop-blur-md transition-all duration-200 border ${
            inWishlist
              ? 'bg-rose-500 text-white border-rose-600 shadow-md scale-105'
              : 'bg-background/80 text-on-surface hover:text-rose-500 border-outline-variant/20 hover:bg-background'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${inWishlist ? 'fill-current' : ''}`} />
        </button>

        {/* Quick View Hover Peek */}
        <div className="absolute inset-x-2 bottom-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleView && handleView(product);
            }}
            className="w-full py-1.5 px-3 bg-surface-container-highest/90 hover:bg-surface-bright text-on-surface text-[11px] font-label font-semibold uppercase tracking-wider rounded backdrop-blur-md border border-outline-variant/30 flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick View</span>
          </button>
        </div>
      </div>

      {/* Product Content / Amazon-Style Details */}
      <div className="flex flex-col flex-1 justify-between">
        <div className="space-y-1.5">
          {/* Subtitle / Category Breadcrumb */}
          <div className="flex items-center justify-between text-[11px] text-on-surface-variant font-label">
            <span className="uppercase tracking-wider font-medium text-primary line-clamp-1">
              {product.category === 'bouquets' ? 'Floral Stem' : 'Handcrafted Charm'}
            </span>
            <span className="text-[10px] text-on-surface-variant/70 font-mono">
              ID: {product.id}
            </span>
          </div>

          {/* Product Title */}
          <h3
            onClick={() => handleView && handleView(product)}
            className="font-headline text-sm sm:text-base font-semibold text-on-background group-hover:text-primary transition-colors cursor-pointer line-clamp-2 leading-snug"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Amazon Star Rating & Social Proof */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <div className="flex items-center text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor(product.rating || 5)
                      ? 'fill-current text-amber-400'
                      : 'text-amber-400/40'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-on-surface">{product.rating || '5.0'}</span>
            <span className="text-[11px] text-on-surface-variant">
              ({product.reviewsCount || 42})
            </span>
          </div>

          {/* Amazon Bought in past month text */}
          {product.boughtPastMonth && (
            <p className="text-[11px] text-on-surface-variant/80 font-medium">
              {product.boughtPastMonth}
            </p>
          )}

          {/* Amazon-Style Price Block (INR) */}
          <div className="pt-1.5 pb-1">
            <div className="flex items-baseline gap-2 flex-wrap">
              {discountPercent && (
                <span className="text-sm font-bold text-[#cc0c39] leading-none">
                  -{discountPercent}%
                </span>
              )}
              <div className="flex items-baseline">
                <span className="text-xs font-semibold text-on-surface relative -top-1">₹</span>
                <span className="font-display text-xl sm:text-2xl font-bold text-on-surface tracking-tight leading-none">
                  {product.price}
                </span>
              </div>
              {product.mrp && (
                <span className="text-xs text-on-surface-variant line-through">
                  M.R.P.: ₹{product.mrp}
                </span>
              )}
            </div>
          </div>

          {/* Amazon Delivery & Prime Badge */}
          <div className="space-y-1 text-[11px] text-on-surface-variant pt-1 border-t border-outline-variant/10">
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <Zap className="w-3 h-3 fill-current" />
              <span>FREE Delivery on orders over ₹499</span>
            </div>
            <div className="text-[11px]">
              {product.inStock <= 6 ? (
                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                  Only {product.inStock} left in stock - order soon
                </span>
              ) : (
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                  In stock • Ready for dispatch
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Amazon-Style "Add to Cart" Button */}
        <div className="pt-3 mt-2">
          <button
            onClick={() => addToCart(product, 1)}
            className="w-full py-2 px-4 bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] text-[#0f1111] border border-[#fcd200] hover:border-[#f2c200] rounded-full text-xs font-bold shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </article>
  );
}
