import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import {
  X,
  Heart,
  Plus,
  Minus,
  Clock,
  Sparkles,
  ShieldCheck,
  ShoppingBag,
  Star,
  Zap,
  Truck,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

export function ProductModal({ product, onClose }) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart, setIsCartDrawerOpen } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  if (!product) return null;

  const inWishlist = isInWishlist(product.id);
  const discountPercent =
    product.discountPercent ||
    (product.mrp && product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : null);
  const savings = product.mrp ? (product.mrp - product.price) * quantity : null;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    onClose();
    setIsCartDrawerOpen(true);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    onClose();
    setIsCartDrawerOpen(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-background/85 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl max-w-4xl w-full relative overflow-hidden shadow-2xl my-auto text-on-background max-h-[90vh] flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2 rounded-full bg-surface-container-high/90 text-on-surface hover:text-primary transition-colors border border-outline-variant/20 shadow-md"
          aria-label="Close product dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Column: Product Photography (Compact & sharp) */}
        <div className="md:w-1/2 bg-surface-container-low p-6 sm:p-8 flex flex-col items-center justify-center relative border-b md:border-b-0 md:border-r border-outline-variant/15">
          <div className="relative w-full aspect-square max-w-sm rounded-xl overflow-hidden shadow-md border border-outline-variant/20 bg-surface-container">
            <img
              src={product.image}
              alt={product.alt || product.name}
              className="w-full h-full object-cover object-center"
            />
            {product.badge && (
              <div className="absolute top-3 left-3 px-2.5 py-1 bg-surface-container-lowest/90 backdrop-blur-md border border-outline-variant/20 rounded-md shadow-sm">
                <span className="font-label text-[11px] text-primary uppercase tracking-wider font-bold">
                  {product.badge}
                </span>
              </div>
            )}
          </div>
          <div className="mt-3 text-center">
            <span className="text-[11px] text-on-surface-variant font-mono">
              Product SKU / Reference ID: <strong className="text-on-surface">{product.id}</strong>
            </span>
          </div>
        </div>

        {/* Right Column: Amazon-Style Product Details & Purchase Card */}
        <div className="md:w-1/2 p-6 sm:p-8 overflow-y-auto space-y-5 flex-1">
          {/* Brand & Title */}
          <div>
            <div className="flex items-center justify-between text-xs text-primary font-label uppercase tracking-widest font-semibold mb-1">
              <span>KNOTKARI Slow-Craft Atelier</span>
              <span className="text-on-surface-variant font-mono text-[10px]">
                ID: {product.id}
              </span>
            </div>
            <h2 className="font-headline text-xl sm:text-2xl font-bold text-on-surface leading-tight">
              {product.name}
            </h2>
            <p className="text-xs text-on-surface-variant mt-1">{product.subtitle}</p>

            {/* Amazon Rating Line */}
            <div className="flex items-center gap-2 mt-2 pb-3 border-b border-outline-variant/15">
              <div className="flex items-center text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < Math.floor(product.rating || 5)
                        ? 'fill-current text-amber-400'
                        : 'text-amber-400/40'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-on-surface">{product.rating}</span>
              <span className="text-xs text-primary underline cursor-pointer">
                {product.reviewsCount} ratings
              </span>
              {product.boughtPastMonth && (
                <span className="text-xs text-on-surface-variant ml-auto font-medium">
                  {product.boughtPastMonth}
                </span>
              )}
            </div>
          </div>

          {/* Pricing Section in INR */}
          <div className="space-y-1 bg-surface-container/60 p-3.5 rounded-xl border border-outline-variant/20">
            <div className="flex items-baseline gap-2.5">
              {discountPercent && (
                <span className="text-lg font-bold text-[#cc0c39]">-{discountPercent}%</span>
              )}
              <div className="flex items-baseline">
                <span className="text-sm font-bold text-on-surface relative -top-1">₹</span>
                <span className="font-display text-3xl font-bold text-on-surface tracking-tight">
                  {product.price}
                </span>
              </div>
            </div>

            {product.mrp && (
              <div className="text-xs text-on-surface-variant">
                M.R.P.: <span className="line-through">₹{product.mrp}</span>
                {savings && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold ml-2">
                    (You Save: ₹{savings})
                  </span>
                )}
              </div>
            )}
            <p className="text-[11px] text-on-surface-variant">Inclusive of all taxes</p>
          </div>

          {/* Delivery & Stock Highlights */}
          <div className="space-y-2 text-xs border-y border-outline-variant/15 py-3">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium">
              <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>FREE Delivery on orders over ₹499 • Fast Dispatch</span>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant">
              <RotateCcw className="w-4 h-4 text-primary shrink-0" />
              <span>7 Days Replacement & Lifetime Stitch Warranty</span>
            </div>
            <div className="pt-1">
              {product.inStock <= 6 ? (
                <span className="text-amber-600 dark:text-amber-400 font-bold text-xs">
                  Only {product.inStock} left in stock - order soon
                </span>
              ) : (
                <span className="text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                  In Stock • Ready to ship
                </span>
              )}
            </div>
          </div>

          {/* Description & Key Specs */}
          <div className="space-y-2">
            <h4 className="text-xs font-label uppercase tracking-wider font-semibold text-on-surface">
              About this handcrafted item
            </h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">{product.description}</p>
            <ul className="text-xs text-on-surface-variant space-y-1.5 pt-1">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong>Material:</strong> {product.yarnType}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong>Craft Time:</strong> {product.craftHours} of hand-stitchwork
                </span>
              </li>
              {product.dimensions && (
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span>
                    <strong>Dimensions:</strong> {product.dimensions}
                  </span>
                </li>
              )}
            </ul>
          </div>

          {/* Quantity & Actions (Amazon Style) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-on-surface">Quantity:</span>
              <div className="flex items-center border border-outline-variant/30 rounded-lg bg-surface-container">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2 text-on-surface hover:text-primary transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-4 font-headline text-sm font-bold text-on-surface">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="p-2 text-on-surface hover:text-primary transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={handleAddToCart}
                className="flex-1 py-3 px-4 bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] text-[#0f1111] border border-[#fcd200] rounded-full text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart — ₹{product.price * quantity}</span>
              </button>

              <button
                onClick={handleBuyNow}
                className="flex-1 py-3 px-4 bg-[#ffa41c] hover:bg-[#fa8900] active:bg-[#e87a00] text-[#0f1111] border border-[#ff8f00] rounded-full text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Buy Now</span>
              </button>

              <button
                onClick={() => toggleWishlist(product)}
                className={`p-3 rounded-full border transition-all flex items-center justify-center ${
                  inWishlist
                    ? 'bg-rose-500 text-white border-rose-600 shadow-md'
                    : 'bg-surface-container text-on-surface border-outline-variant/30 hover:border-primary'
                }`}
                aria-label="Toggle Wishlist"
              >
                <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
