import React from 'react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { Heart, Plus, Eye } from 'lucide-react';

export function ProductCard({ product, layout = 'editorial', onQuickView }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const inWishlist = isInWishlist(product.id);

  const isEditorial = layout === 'editorial';

  return (
    <article
      className={`group relative flex flex-col transition-all duration-500 ${
        isEditorial ? product.desktopColSpan || 'col-span-1 md:col-span-6' : 'col-span-1'
      }`}
    >
      {/* Image Container with Shimmer & Hover zoom */}
      <div
        className={`relative w-full ${
          isEditorial ? product.aspectRatio || 'aspect-[4/5]' : 'aspect-[4/5]'
        } bg-surface-container overflow-hidden mb-5 border border-outline-variant/10 group-hover:border-outline-variant/30 rounded-DEFAULT transition-all duration-500`}
      >
        {/* Subtle tonal overlay */}
        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-500 z-10 pointer-events-none" />

        {/* Product Photo */}
        <img
          src={product.image}
          alt={product.alt || product.name}
          loading="lazy"
          className="object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Badge (Limited Edition, Best Seller, etc.) */}
        {product.badge && (
          <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-surface-container/80 backdrop-blur-md border border-outline-variant/20 rounded-full shadow-lg">
            <span className="font-label text-[11px] text-on-surface uppercase tracking-wider font-semibold">
              {product.badge}
            </span>
          </div>
        )}

        {/* Wishlist Button (Top Right) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute top-4 right-4 z-20 p-2 rounded-full backdrop-blur-md border transition-all duration-300 ${
            inWishlist
              ? 'bg-primary text-on-primary border-primary'
              : 'bg-surface-container/70 text-on-surface hover:text-primary border-outline-variant/20 hover:bg-surface-container'
          }`}
        >
          <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} />
        </button>

        {/* Quick Action Overlay (Appears on Hover) */}
        <div className="absolute inset-x-4 bottom-4 z-20 flex gap-2 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <button
            onClick={() => onQuickView(product)}
            className="flex-1 py-2.5 bg-surface-container-highest/90 hover:bg-surface-bright text-on-surface text-xs font-label uppercase tracking-widest backdrop-blur-md border border-outline-variant/30 rounded flex items-center justify-center gap-1.5 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Details</span>
          </button>
          <button
            onClick={() => addToCart(product, 1)}
            className="flex-1 py-2.5 bg-on-background hover:bg-primary-fixed text-background hover:text-on-primary-fixed text-xs font-label uppercase tracking-widest font-semibold backdrop-blur-md rounded flex items-center justify-center gap-1.5 transition-colors duration-300"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>

      {/* Product Metadata */}
      <div className="flex justify-between items-start cursor-pointer" onClick={() => onQuickView(product)}>
        <div>
          <h3 className="font-headline text-lg md:text-xl text-on-surface group-hover:text-primary transition-colors mb-1">
            {product.name}
          </h3>
          <p className="font-body text-xs md:text-sm text-on-surface-variant line-clamp-1">
            {product.subtitle}
          </p>
        </div>
        <span className="font-headline text-base md:text-lg text-on-surface pl-3 whitespace-nowrap">
          ${product.price}
        </span>
      </div>
    </article>
  );
}
