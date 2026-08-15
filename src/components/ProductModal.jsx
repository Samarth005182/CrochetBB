import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { X, Heart, Plus, Minus, Clock, Sparkles, ShieldCheck, ShoppingBag, Star } from 'lucide-react';

export function ProductModal({ product, onClose }) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart, setIsCartDrawerOpen } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  if (!product) return null;

  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    onClose();
    setIsCartDrawerOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-background/90 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div
        className="bg-surface-container-low border border-outline-variant/30 rounded-lg max-w-4xl w-full relative overflow-hidden shadow-2xl my-auto text-on-background"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2 rounded-full bg-surface-container-high/80 text-on-surface hover:text-primary transition-colors border border-outline-variant/20"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 max-h-[85vh] overflow-y-auto">
          {/* Left Column: Product Photography */}
          <div className="md:col-span-6 bg-surface-container-lowest relative flex items-center justify-center p-6 md:p-8 border-b md:border-b-0 md:border-r border-outline-variant/10">
            <div className="relative w-full aspect-[4/5] rounded overflow-hidden shadow-inner">
              <img
                src={product.image}
                alt={product.alt || product.name}
                className="w-full h-full object-cover"
              />
              {product.badge && (
                <div className="absolute top-4 left-4 px-3 py-1 bg-surface-container/90 backdrop-blur-md border border-outline-variant/20 rounded-full">
                  <span className="font-label text-[11px] text-on-surface uppercase tracking-wider font-semibold">
                    {product.badge}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Artisan Details & Purchasing */}
          <div className="md:col-span-6 p-6 md:p-8 flex flex-col justify-between space-y-6">
            <div>
              {/* Category & Rating */}
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-label uppercase tracking-widest text-primary font-semibold">
                  {product.category}
                </span>
                <div className="flex items-center gap-1 text-amber-300 text-xs">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="font-semibold text-on-surface">{product.rating}</span>
                  <span className="text-on-surface-variant">({product.reviewsCount} reviews)</span>
                </div>
              </div>

              {/* Title & Price */}
              <h2 className="font-display text-2xl md:text-3xl text-on-surface mb-2">
                {product.name}
              </h2>
              <p className="font-headline text-xl text-primary mb-4">
                ${product.price}
              </p>

              {/* Description */}
              <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-6">
                {product.description}
              </p>

              {/* Artisan Specs Grid */}
              <div className="bg-surface-container p-4 rounded border border-outline-variant/15 space-y-3 mb-6 text-xs">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-on-surface font-semibold">Yarn Composition: </span>
                    <span className="text-on-surface-variant">{product.yarnType}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-on-surface font-semibold">Artisan Handcraft Time: </span>
                    <span className="text-on-surface-variant">{product.craftHours} of meticulous stitchwork</span>
                  </div>
                </div>

                {product.dimensions && (
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="text-on-surface font-semibold">Dimensions: </span>
                      <span className="text-on-surface-variant">{product.dimensions}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Artisan Note */}
              {product.artisanNotes && (
                <blockquote className="border-l-2 border-primary/50 pl-3 italic text-xs text-on-surface-variant/90 mb-6">
                  "{product.artisanNotes}"
                </blockquote>
              )}
            </div>

            {/* Quantity Stepper & Add to Cart */}
            <div className="space-y-4 pt-4 border-t border-outline-variant/10">
              <div className="flex items-center justify-between">
                <span className="font-label text-xs uppercase tracking-wider text-on-surface-variant">Quantity</span>
                <div className="flex items-center border border-outline-variant/30 rounded bg-surface-container-high">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-2 text-on-surface hover:text-primary transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-4 font-headline text-sm font-semibold text-on-surface">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="p-2 text-on-surface hover:text-primary transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 py-4 bg-on-background hover:bg-primary-fixed text-background hover:text-on-primary-fixed font-label text-xs uppercase tracking-widest font-semibold rounded flex items-center justify-center gap-2 transition-colors duration-300 shadow-lg"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Acquire for Atelier — ${(product.price * quantity).toFixed(2)}</span>
                </button>

                <button
                  onClick={() => toggleWishlist(product)}
                  className={`p-4 border rounded transition-colors ${
                    inWishlist
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface-container-high text-on-surface border-outline-variant/30 hover:border-primary'
                  }`}
                  aria-label="Toggle wishlist"
                >
                  <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
