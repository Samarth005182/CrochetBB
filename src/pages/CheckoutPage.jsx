import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { solveClientProofOfWork, validateHoneypot } from '../utils/rateLimiter';
import { saveOrderToSupabase } from '../lib/supabase';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  CreditCard,
  Truck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShoppingBag,
  Printer
} from 'lucide-react';

export function CheckoutPage({ onNavigateToShop }) {
  const {
    items,
    subtotal,
    discountAmount,
    subtotalAfterDiscount,
    shippingCost,
    taxAmount,
    grandTotal,
    clearCart,
    isFreeShipping
  } = useCart();

  const { user, isAuthenticated, addOrder } = useAuth();
  const { addToast } = useToast();

  const [step, setStep] = useState(1); // 1: Shipping, 2: Delivery, 3: Payment, 4: Confirmed
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  // Form States
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    street: user?.addresses?.[0]?.street || '',
    city: user?.addresses?.[0]?.city || '',
    state: user?.addresses?.[0]?.state || 'NY',
    postalCode: user?.addresses?.[0]?.postalCode || '',
    country: 'United States',
    honeypot: ''
  });

  const [deliveryMethod, setDeliveryMethod] = useState('standard'); // 'standard' | 'express'
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' | 'applepay' | 'cod'

  // Card details
  const [cardData, setCardData] = useState({
    number: '•••• •••• •••• 4242',
    name: user?.name || 'VICTORIA STERLING',
    expiry: '09/28',
    cvc: '•••'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleShippingSubmit = (e) => {
    e.preventDefault();
    if (!validateHoneypot(formData.honeypot)) {
      addToast("Security verification failed.", "error");
      return;
    }
    if (!formData.name || !formData.email || !formData.street || !formData.city || !formData.postalCode) {
      addToast("Please fill in all required shipping fields.", "error");
      return;
    }
    setStep(2);
  };

  const handleDeliverySubmit = (e) => {
    e.preventDefault();
    setStep(3);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // 1. Solve Client Proof of Work Challenge to throttle bot surges
      addToast("Verifying cryptographic transaction token...", "info", 1500);
      const powResult = await solveClientProofOfWork(2);
      console.log("[Proof-of-Work Completed]", powResult);

      // 2. Simulate Payment gateway delay
      await new Promise((res) => setTimeout(res, 1200));

      const newOrder = {
        id: `LX-${Math.floor(100000 + Math.random() * 900000)}`,
        date: new Date().toISOString().split('T')[0],
        items: items.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity })),
        subtotal: subtotalAfterDiscount,
        shipping: deliveryMethod === 'express' ? 35 : (isFreeShipping ? 0 : 15),
        tax: taxAmount,
        total: grandTotal + (deliveryMethod === 'express' ? 20 : 0),
        status: "Confirmed & In Queue for Atelier Crafting",
        trackingNumber: `LX-US-${Math.floor(100000000 + Math.random() * 900000000)}`,
        shippingAddress: { ...formData },
        deliveryMethod: deliveryMethod === 'express' ? 'White-Glove Express' : 'Standard Atelier Delivery'
      };

      // 3. Save Order to Supabase database (non-blocking)
      saveOrderToSupabase(newOrder).catch((err) => console.warn('[Supabase Sync]', err));

      setConfirmedOrder(newOrder);
      addOrder(newOrder);
      clearCart();
      setStep(4);
      setIsProcessing(false);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#b9c7e4', '#d9e2ff', '#c8c6c3']
        });
      } catch (e) {
        console.log(e);
      }

      addToast("Order successfully authorized! Welcome to the Atelier family.", "success");
    } catch (err) {
      setIsProcessing(false);
      addToast("Payment authorization failed. Please try again.", "error");
    }
  };

  const effectiveTotal = grandTotal + (deliveryMethod === 'express' ? 20 : 0);

  return (
    <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-16">
      {/* Checkout Progress Stepper */}
      {step < 4 && (
        <div className="max-w-2xl mx-auto mb-12">
          <div className="flex justify-between items-center relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-surface-container-highest -translate-y-1/2 z-0" />
            {[
              { num: 1, label: 'Shipping' },
              { num: 2, label: 'Delivery' },
              { num: 3, label: 'Payment' }
            ].map((s) => (
              <div key={s.num} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-headline text-xs font-bold transition-all ${
                    step >= s.num
                      ? 'bg-primary text-on-primary shadow-lg ring-4 ring-background'
                      : 'bg-surface-container text-on-surface-variant ring-4 ring-background'
                  }`}
                >
                  {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>
                <span className="font-label text-[11px] uppercase tracking-wider text-on-surface-variant mt-2">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Screen (Step 4) */}
      {step === 4 && confirmedOrder ? (
        <div className="max-w-2xl mx-auto bg-surface-container-low border border-outline-variant/30 rounded-lg p-8 md:p-12 text-center space-y-8 animate-fade-in shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mx-auto text-primary border border-primary/30">
            <Sparkles className="w-10 h-10 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="font-label text-xs uppercase tracking-widest text-primary font-semibold">
              Order Confirmed & Scheduled
            </span>
            <h1 className="font-display text-3xl md:text-4xl text-on-background">
              Thank You for Your Patronage
            </h1>
            <p className="font-body text-sm text-on-surface-variant max-w-md mx-auto">
              Your order <strong className="text-on-surface">#{confirmedOrder.id}</strong> has been secured. Our master stitchers have reserved your yarns.
            </p>
          </div>

          {/* Receipt Breakdown Box */}
          <div className="bg-surface-container p-6 rounded text-left text-xs space-y-4 border border-outline-variant/15">
            <div className="flex justify-between items-center border-b border-outline-variant/10 pb-3 font-semibold">
              <span className="text-on-surface">Tracking Reference:</span>
              <span className="font-mono text-primary">{confirmedOrder.trackingNumber}</span>
            </div>

            <div className="space-y-2">
              <p className="font-label uppercase tracking-widest text-on-surface-variant text-[10px]">
                Items in Fabrication:
              </p>
              {confirmedOrder.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-on-surface">
                  <span>{item.quantity}x {item.name}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-outline-variant/10 pt-3 space-y-1.5 text-on-surface-variant">
              <div className="flex justify-between">
                <span>Delivery:</span>
                <span>{confirmedOrder.deliveryMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Dispatched To:</span>
                <span className="text-on-surface">{confirmedOrder.shippingAddress.street}, {confirmedOrder.shippingAddress.city}</span>
              </div>
              <div className="flex justify-between font-semibold text-on-surface text-sm pt-2 border-t border-outline-variant/10">
                <span>Total Paid:</span>
                <span className="text-primary font-headline text-base">${confirmedOrder.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <button
              onClick={() => window.print()}
              className="px-6 py-3 bg-surface-container-high hover:bg-surface-bright text-on-surface font-label text-xs uppercase tracking-widest rounded border border-outline-variant/30 flex items-center justify-center gap-2"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Atelier Invoice</span>
            </button>

            <button
              onClick={onNavigateToShop}
              className="px-8 py-3 bg-primary text-on-primary font-label text-xs uppercase tracking-widest font-semibold rounded hover:bg-primary-fixed transition-colors shadow-lg"
            >
              Return to Catalog
            </button>
          </div>
        </div>
      ) : (
        /* Multi-Step Checkout Form Columns */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Interactive Form by Step */}
          <div className="lg:col-span-7 bg-surface-container-low p-6 md:p-10 rounded border border-outline-variant/20">
            {step === 1 && (
              <form onSubmit={handleShippingSubmit} className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-display text-2xl text-on-background">1. Shipping Address</h2>
                  {isAuthenticated && (
                    <span className="text-xs text-primary font-medium">Auto-filled from Member Profile</span>
                  )}
                </div>

                {/* Anti-Bot Honeypot Field */}
                <input
                  type="text"
                  name="honeypot"
                  value={formData.honeypot}
                  onChange={handleInputChange}
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2 sm:col-span-2">
                    <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Lady Victoria Sterling"
                      className="ghost-input w-full py-2 text-sm text-on-background"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block">
                      Email for Dispatch Updates *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="victoria@sterling.com"
                      className="ghost-input w-full py-2 text-sm text-on-background"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      name="street"
                      value={formData.street}
                      onChange={handleInputChange}
                      required
                      placeholder="742 Evergreen Terrace, Suite 4B"
                      className="ghost-input w-full py-2 text-sm text-on-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      placeholder="New York"
                      className="ghost-input w-full py-2 text-sm text-on-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block">
                      Postal Code *
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      required
                      placeholder="10021"
                      className="ghost-input w-full py-2 text-sm text-on-background"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-outline-variant/10 flex justify-end">
                  <button
                    type="submit"
                    className="px-8 py-3.5 bg-on-background hover:bg-primary-fixed text-background hover:text-on-primary-fixed font-label text-xs uppercase tracking-widest font-semibold rounded flex items-center gap-2 transition-all shadow-md"
                  >
                    <span>Proceed to Delivery</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleDeliverySubmit} className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-display text-2xl text-on-background">2. Delivery Method</h2>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-on-surface-variant hover:text-primary underline"
                  >
                    Edit Shipping
                  </button>
                </div>

                <div className="space-y-4">
                  <label
                    className={`flex items-start gap-4 p-5 rounded border cursor-pointer transition-all ${
                      deliveryMethod === 'standard'
                        ? 'bg-surface-container border-primary shadow-lg ring-1 ring-primary'
                        : 'bg-surface-container-high/50 border-outline-variant/20 hover:bg-surface-container'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="standard"
                      checked={deliveryMethod === 'standard'}
                      onChange={() => setDeliveryMethod('standard')}
                      className="mt-1 accent-primary"
                    />
                    <div className="flex-1 flex justify-between">
                      <div>
                        <p className="font-headline text-base text-on-surface font-medium">Standard Atelier Delivery</p>
                        <p className="text-xs text-on-surface-variant mt-1">3–5 Business Days in signature cotton dust bag.</p>
                      </div>
                      <span className="font-headline text-sm text-primary font-semibold">
                        {isFreeShipping ? 'Complimentary' : '$15.00'}
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-4 p-5 rounded border cursor-pointer transition-all ${
                      deliveryMethod === 'express'
                        ? 'bg-surface-container border-primary shadow-lg ring-1 ring-primary'
                        : 'bg-surface-container-high/50 border-outline-variant/20 hover:bg-surface-container'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="express"
                      checked={deliveryMethod === 'express'}
                      onChange={() => setDeliveryMethod('express')}
                      className="mt-1 accent-primary"
                    />
                    <div className="flex-1 flex justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-headline text-base text-on-surface font-medium">Express White-Glove Insured</p>
                          <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] rounded font-semibold uppercase">Priority</span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-1">1–2 Business Days with insurance and wax-sealed keepsake box.</p>
                      </div>
                      <span className="font-headline text-sm text-primary font-semibold">
                        +$20.00
                      </span>
                    </div>
                  </label>
                </div>

                <div className="pt-6 border-t border-outline-variant/10 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 text-xs font-label uppercase tracking-widest text-on-surface-variant hover:text-on-surface"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    className="px-8 py-3.5 bg-on-background hover:bg-primary-fixed text-background hover:text-on-primary-fixed font-label text-xs uppercase tracking-widest font-semibold rounded flex items-center gap-2 transition-all shadow-md"
                  >
                    <span>Proceed to Payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handlePaymentSubmit} className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-display text-2xl text-on-background">3. Payment Details</h2>
                  <div className="flex items-center gap-1.5 text-xs text-primary">
                    <Lock className="w-3.5 h-3.5" />
                    <span>256-Bit TLS</span>
                  </div>
                </div>

                {/* Payment Tabs */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { id: 'card', label: 'Credit Card', icon: CreditCard },
                    { id: 'applepay', label: 'Apple / Google', icon: Sparkles },
                    { id: 'cod', label: 'Atelier Wire', icon: Truck }
                  ].map((p) => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPaymentMethod(p.id)}
                        className={`p-3 rounded border text-xs font-label uppercase tracking-wider flex flex-col items-center gap-1.5 transition-all ${
                          paymentMethod === p.id
                            ? 'bg-surface-container border-primary text-primary shadow-md'
                            : 'bg-surface-container-high/40 border-outline-variant/20 text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Interactive Credit Card Mockup */}
                {paymentMethod === 'card' && (
                  <div className="space-y-6">
                    <div className="p-6 rounded-lg bg-gradient-to-tr from-surface-container-highest via-surface-container-high to-surface-bright border border-outline-variant/30 shadow-2xl relative overflow-hidden text-on-surface">
                      <div className="flex justify-between items-center mb-8">
                        <span className="font-display text-lg tracking-widest">LUXE CRAFT PATRON</span>
                        <CreditCard className="w-6 h-6 text-primary" />
                      </div>
                      <p className="font-mono text-lg tracking-widest mb-6">
                        {cardData.number}
                      </p>
                      <div className="flex justify-between items-end text-xs font-mono">
                        <div>
                          <p className="text-[10px] text-on-surface-variant uppercase">Cardholder</p>
                          <p className="uppercase font-semibold">{formData.name || cardData.name}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-on-surface-variant uppercase">Expires</p>
                          <p className="font-semibold">{cardData.expiry}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-1">
                          Card Number
                        </label>
                        <input
                          type="text"
                          defaultValue="4242 4242 4242 4242"
                          className="ghost-input w-full py-2 text-sm text-on-background font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-1">
                          Expiration Date
                        </label>
                        <input
                          type="text"
                          defaultValue="09/28"
                          className="ghost-input w-full py-2 text-sm text-on-background font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-1">
                          Security CVC
                        </label>
                        <input
                          type="password"
                          defaultValue="892"
                          maxLength={4}
                          className="ghost-input w-full py-2 text-sm text-on-background font-mono"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod !== 'card' && (
                  <div className="p-6 bg-surface-container rounded text-center space-y-2 border border-outline-variant/15">
                    <p className="font-headline text-base text-on-surface font-medium">Instant One-Click Authorization</p>
                    <p className="text-xs text-on-surface-variant">Biometric face/touch authentication will be requested upon clicking submit.</p>
                  </div>
                )}

                <div className="pt-6 border-t border-outline-variant/10 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={isProcessing}
                    className="flex items-center gap-2 text-xs font-label uppercase tracking-widest text-on-surface-variant hover:text-on-surface"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="px-8 py-4 bg-on-background hover:bg-primary-fixed text-background hover:text-on-primary-fixed font-label text-xs uppercase tracking-widest font-semibold rounded flex items-center gap-2 transition-all shadow-xl disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin" />
                        <span>Authorizing Transaction...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Authorize Payment — ${effectiveTotal.toFixed(2)}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right Column: Mini Cart Summary */}
          <div className="lg:col-span-5">
            <div className="bg-surface-container-low p-6 md:p-8 rounded border border-outline-variant/20 sticky top-28 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/10">
                <h3 className="font-display text-lg text-on-background">Your Order</h3>
                <span className="text-xs text-primary font-semibold uppercase">{items.length} item(s)</span>
              </div>

              <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded object-cover bg-surface-variant shrink-0" />
                    <div className="flex-1 text-xs">
                      <p className="font-headline text-on-surface font-medium leading-snug">{item.name}</p>
                      <p className="text-on-surface-variant text-[11px]">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-headline text-xs font-semibold text-on-surface">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-4 border-t border-outline-variant/10 text-xs text-on-surface-variant">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotalAfterDiscount.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>Discount</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{deliveryMethod === 'express' ? '$35.00' : (isFreeShipping ? 'Complimentary' : '$15.00')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-on-surface pt-3 border-t border-outline-variant/15">
                  <span className="font-display text-base">Grand Total</span>
                  <span className="font-headline text-lg text-primary">${effectiveTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="p-3 bg-surface-container rounded border border-outline-variant/10 text-[11px] text-on-surface-variant flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                <span>Backed by our Slow Fashion Artisanal Quality Guarantee.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
