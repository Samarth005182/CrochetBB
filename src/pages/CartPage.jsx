import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { PRODUCTS } from '../data/products';
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Tag,
  X,
  ShoppingBag,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export function CartPage({ onNavigateToCheckout, onNavigateToShop }) {
  const {
    items,
    updateQuantity,
    removeFromCart,
    subtotal,
    appliedPromo,
    applyPromoCode,
    removePromoCode,
    discountAmount,
    subtotalAfterDiscount,
    shippingCost,
    taxAmount,
    grandTotal,
    isFreeShipping,
    amountNeededForFreeShipping,
    freeShippingThreshold,
    triggerTrafficSurgeCheckout,
    addToCart,
  } = useCart();

  const [promoInput, setPromoInput] = useState('');
  const { addToast } = useToast();

  const handleApplyPromo = (e) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const success = applyPromoCode(promoInput);
    if (success) setPromoInput('');
  };

  const handleCheckoutClick = () => {
    if (items.length === 0) {
      addToast('Your atelier cart is currently empty.', 'error');
      return;
    }
    triggerTrafficSurgeCheckout(() => {
      onNavigateToCheckout();
    });
  };

  // Cross-sell recommendations (items not in current cart)
  const recommendations = PRODUCTS.filter((p) => !items.some((item) => item.id === p.id)).slice(
    0,
    3,
  );

  return (
    <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-16">
      {/* Header */}
      <header className="mb-12">
        <h1 className="font-display text-3xl md:text-5xl text-on-background mb-3">
          Your Atelier Cart
        </h1>
        <p className="font-body text-sm md:text-base text-on-surface-variant">
          Review your slow-fashion selections before proceeding to bespoke checkout.
        </p>
      </header>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-low rounded border border-outline-variant/10 max-w-2xl mx-auto space-y-6">
          <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mx-auto text-primary border border-outline-variant/20">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h2 className="font-display text-2xl text-on-surface">Your Bag is Empty</h2>
          <p className="font-body text-sm text-on-surface-variant max-w-md mx-auto">
            You have not added any pieces to your cart. Explore our boutique catalog to discover
            hand-crocheted heirlooms.
          </p>
          <button
            onClick={onNavigateToShop}
            className="px-8 py-3.5 bg-primary text-on-primary font-label text-xs uppercase tracking-widest font-semibold rounded hover:bg-primary-fixed transition-colors shadow-lg"
          >
            Explore Artisan Collection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Cart Items List */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Complimentary shipping banner */}
            <div className="p-4 bg-surface-container rounded border border-outline-variant/15 text-xs">
              {isFreeShipping ? (
                <div className="flex items-center gap-2 text-primary font-medium">
                  <Sparkles className="w-4 h-4" />
                  <span>
                    Complimentary White-Glove Atelier Delivery is included with this acquisition.
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-on-surface-variant">
                    Add{' '}
                    <strong className="text-primary font-semibold">
                      ${amountNeededForFreeShipping.toFixed(2)}
                    </strong>{' '}
                    more to qualify for complimentary shipping.
                  </p>
                  <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (subtotalAfterDiscount / freeShippingThreshold) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Item Articles */}
            {items.map((item) => (
              <article
                key={item.id}
                className="flex flex-col sm:flex-row gap-6 p-6 rounded bg-surface-container-low border border-outline-variant/20 hover:bg-surface-container transition-colors duration-300"
              >
                <div className="w-full sm:w-44 h-44 bg-surface-variant rounded overflow-hidden shrink-0 relative group">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>

                <div className="flex flex-col flex-grow justify-between py-1">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-headline text-lg md:text-xl text-on-surface font-medium">
                        {item.name}
                      </h3>
                      <span className="font-headline text-base md:text-lg text-on-surface font-semibold pl-4">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                    <p className="font-body text-xs text-on-surface-variant mb-4">
                      {item.subtitle}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-outline-variant/10">
                    {/* Quantity Stepper */}
                    <div className="flex items-center border border-outline-variant/30 rounded bg-surface-container-high">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1.5 px-3 text-on-surface-variant hover:text-on-surface transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 font-headline text-xs font-semibold text-on-surface">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1.5 px-3 text-on-surface-variant hover:text-on-surface transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Remove Action */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-error transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="font-label uppercase tracking-wider text-[10px]">
                        Remove
                      </span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Right Column: Order Summary Card */}
          <div className="lg:col-span-4">
            <div className="bg-surface-container-low p-6 md:p-8 rounded border border-outline-variant/20 sticky top-28 space-y-6">
              <h2 className="font-display text-xl text-on-background pb-4 border-b border-outline-variant/10">
                Order Summary
              </h2>

              {/* Promo Code Input */}
              <div>
                <label className="font-label text-[11px] uppercase tracking-widest text-on-surface-variant block mb-2">
                  Atelier Privilege Code
                </label>
                {appliedPromo ? (
                  <div className="flex items-center justify-between p-3 bg-surface-container rounded border border-primary/30 text-xs">
                    <div className="flex items-center gap-2 text-primary font-medium">
                      <Tag className="w-3.5 h-3.5" />
                      <span>
                        {appliedPromo.code} ({(appliedPromo.discount * 100).toFixed(0)}% Off)
                      </span>
                    </div>
                    <button
                      onClick={removePromoCode}
                      className="text-on-surface-variant hover:text-error p-1"
                      title="Remove promo code"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyPromo} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. ATELIER10"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      className="ghost-input flex-1 py-1.5 text-xs uppercase tracking-wider"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-surface-container-high hover:bg-surface-bright text-on-surface border border-outline-variant/30 text-[11px] font-label uppercase tracking-widest rounded"
                    >
                      Apply
                    </button>
                  </form>
                )}
                <p className="text-[10px] text-on-surface-variant/70 mt-1.5">
                  Try test privileges: <code className="text-primary font-mono">SLOWCRAFT15</code>{' '}
                  or <code className="text-primary font-mono">KNOTKARI20</code>
                </p>
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-3 pt-2 text-sm text-on-surface-variant border-t border-outline-variant/10">
                <div className="flex justify-between">
                  <span>Bag Subtotal</span>
                  <span className="text-on-surface">${subtotal.toFixed(2)}</span>
                </div>

                {appliedPromo && (
                  <div className="flex justify-between text-primary">
                    <span>Privilege Discount</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Estimated Shipping</span>
                  <span className="text-on-surface">
                    {isFreeShipping ? 'Complimentary' : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Estimated Tax (8%)</span>
                  <span className="text-on-surface">${taxAmount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-base font-semibold text-on-surface pt-4 border-t border-outline-variant/15">
                  <span className="font-display">Total Due</span>
                  <span className="font-headline text-xl text-primary">
                    ${grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={handleCheckoutClick}
                className="w-full py-4 bg-on-background hover:bg-primary-fixed text-background hover:text-on-primary-fixed font-label text-xs uppercase tracking-widest font-semibold rounded flex items-center justify-center gap-2 transition-all duration-300 shadow-xl"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Trust Badges */}
              <div className="pt-2 flex items-center justify-center gap-4 text-[11px] text-on-surface-variant/80">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Secure 256-bit Encrypted
                </span>
                <span>•</span>
                <span>White-Glove Box Packaging</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cross-Sell Recommendations Section */}
      {recommendations.length > 0 && (
        <section className="mt-24 pt-12 border-t border-outline-variant/15">
          <div className="mb-8">
            <h3 className="font-display text-2xl text-on-background mb-2">Curated Complements</h3>
            <p className="text-xs font-body text-on-surface-variant">
              Pieces selected by our master stitchers to pair with your selections.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="bg-surface-container-low p-4 rounded border border-outline-variant/15 flex gap-4 items-center group"
              >
                <img
                  src={rec.image}
                  alt={rec.name}
                  className="w-16 h-16 rounded object-cover bg-surface-variant shrink-0"
                />
                <div className="flex-1">
                  <h4 className="font-headline text-sm text-on-surface group-hover:text-primary transition-colors">
                    {rec.name}
                  </h4>
                  <p className="font-headline text-xs text-primary font-semibold mt-0.5">
                    ${rec.price}
                  </p>
                </div>
                <button
                  onClick={() => addToCart(rec, 1)}
                  className="px-3 py-2 bg-surface-container-high hover:bg-primary text-on-surface hover:text-on-primary text-[10px] font-label uppercase tracking-wider rounded transition-colors"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
