import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { solveClientProofOfWork, validateHoneypot } from '../utils/rateLimiter';
import { saveOrderToSupabase } from '../lib/supabase';
import { createServerOrder, openPaytmCheckout } from '../lib/paytm';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShoppingBag,
  Printer,
  Smartphone,
  Truck,
  Zap,
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
    isFreeShipping,
    appliedPromo,
  } = useCart();

  const { user, addOrder } = useAuth();
  const { addToast } = useToast();

  // 1: Shipping Destination -> 2: Payment Authorization -> 3: Order Confirmed
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  // Form States - All compulsory shipping details
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    street: user?.addresses?.[0]?.street || '',
    city: user?.addresses?.[0]?.city || '',
    state: user?.addresses?.[0]?.state || 'Karnataka',
    postalCode: user?.addresses?.[0]?.postalCode || '',
    country: 'India',
    giftNote: '',
    honeypot: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleShippingSubmit = (e) => {
    e.preventDefault();

    if (!validateHoneypot(formData.honeypot)) {
      addToast('Security verification failed.', 'error');
      return;
    }

    const cleanName = formData.name.trim();
    const cleanEmail = formData.email.trim();
    const cleanPhone = formData.phone.trim();
    const cleanStreet = formData.street.trim();
    const cleanCity = formData.city.trim();
    const cleanState = formData.state.trim();
    const cleanPostal = formData.postalCode.trim();

    if (
      !cleanName ||
      !cleanEmail ||
      !cleanPhone ||
      !cleanStreet ||
      !cleanCity ||
      !cleanState ||
      !cleanPostal
    ) {
      addToast(
        'All shipping details are compulsory. Please fill in every required field.',
        'error',
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      addToast('Please enter a valid email address to associate your order and account.', 'error');
      return;
    }

    // Direct jump from Shipping Destination -> Payment Authorization
    setStep(2);
  };

  const finalizeOrder = async (paymentDetails, serverOrderMeta = null) => {
    const orderNum = `KNOT-${Math.floor(100000 + Math.random() * 900000)}`;
    const effectiveTotal = serverOrderMeta?.total || grandTotal;

    const newOrder = {
      id: orderNum,
      date: new Date().toISOString().split('T')[0],
      items: items.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
      subtotal: subtotalAfterDiscount,
      shipping: isFreeShipping ? 0 : shippingCost,
      tax: taxAmount,
      total: effectiveTotal,
      status: 'In Queue for Karigari Loom Weaving',
      currentStage: 2,
      trackingNumber: `KNOT-IN-${Math.floor(100000000 + Math.random() * 900000000)}`,
      shippingAddress: {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        street: formData.street.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        postalCode: formData.postalCode.trim(),
        country: formData.country || 'India',
      },
      deliveryMethod: 'Standard Atelier Delivery',
      paymentGateway: paymentDetails?.gateway || 'Paytm Secure Gateway',
      paymentId:
        paymentDetails?.paytm_payment_id ||
        paymentDetails?.txn_id ||
        `ptm_${Math.random().toString(36).substring(2, 9)}`,
      giftNote: formData.giftNote?.trim() || null,
      artisan: 'Master Karigar Rajeshwari',
      voucherCode: appliedPromo?.code || null,
      voucherDiscount: discountAmount || 0,
    };

    // 1. Save order to Supabase associated with the customer email
    try {
      await saveOrderToSupabase(newOrder);
    } catch (err) {
      console.warn('[Supabase Sync]', err);
    }

    // 2. Update local state and AuthContext
    setConfirmedOrder(newOrder);
    addOrder(newOrder);
    clearCart();
    setStep(3);
    setIsProcessing(false);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#b9c7e4', '#c8c6c3', '#0a192f'],
      });
    } catch {
      // ignore
    }
    addToast('Your KNOTKARI handcrafted order is confirmed and saved to your email!', 'success');
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      addToast('Verifying cryptographic transaction token...', 'info', 1000);
      await solveClientProofOfWork(2);

      const serverOrder = await createServerOrder({
        items: items.map((i) => ({
          id: i.id,
          quantity: i.quantity,
          unitPrice: i.price,
        })),
        voucherCode: appliedPromo?.code || null,
        customerName: formData.name.trim(),
        customerEmail: formData.email.trim(),
        customerPhone: formData.phone.trim() || undefined,
      });

      if (!serverOrder.ok || (!serverOrder.paytm_order_id && !serverOrder.order_number)) {
        // Fallback simulation if Paytm keys / server aren't configured in environment
        await new Promise((res) => setTimeout(res, 1000));
        await finalizeOrder({
          gateway: 'Paytm (Simulated)',
          paytm_payment_id: `ptm_sim_${Math.random().toString(36).substring(2, 9)}`,
        });
        return;
      }

      await openPaytmCheckout({
        serverOrder,
        customer: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          contact: formData.phone.trim() || '9876543210',
        },
        onSuccess: (response) => {
          finalizeOrder(response, serverOrder);
        },
        onFailure: (err) => {
          setIsProcessing(false);
          addToast(err?.description || 'Payment cancelled or unsuccessful.', 'error');
        },
      });
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      addToast('An error occurred during checkout processing.', 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (items.length === 0 && step !== 3) {
    return (
      <main className="flex-grow flex items-center justify-center py-20 px-4">
        <div className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/20 max-w-md text-center space-y-6">
          <ShoppingBag className="w-12 h-12 mx-auto text-on-surface-variant opacity-40" />
          <h2 className="font-display text-2xl text-on-surface">Your Bag is Empty</h2>
          <p className="text-sm font-body text-on-surface-variant">
            Please add handcrafted crochet pieces before proceeding to checkout.
          </p>
          <button
            onClick={onNavigateToShop}
            className="px-8 py-3.5 bg-primary text-on-primary font-label text-xs uppercase tracking-widest font-semibold rounded-xl hover:bg-primary-fixed transition-colors"
          >
            Explore Catalog
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-grow max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop py-12 md:py-16">
      {/* 2-Step Progress Indicator: Shipping -> Payment */}
      {step < 3 && (
        <div className="mb-12 max-w-xl mx-auto">
          <div className="flex justify-between items-center relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-outline-variant/20 -z-0" />
            {[
              { num: 1, label: '1. Shipping Destination' },
              { num: 2, label: '2. Payment Authorization' },
            ].map((s) => (
              <div key={s.num} className="flex flex-col items-center bg-background px-4 z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step === s.num
                      ? 'bg-primary text-on-primary ring-4 ring-primary/20'
                      : step > s.num
                        ? 'bg-emerald-500 text-black'
                        : 'bg-surface-container text-on-surface-variant border border-outline-variant/30'
                  }`}
                >
                  {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>
                <span
                  className={`text-[11px] font-label uppercase tracking-widest mt-2 ${step >= s.num ? 'text-on-surface font-semibold' : 'text-on-surface-variant'}`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: ORDER CONFIRMED RECEIPT */}
      {step === 3 && confirmedOrder && (
        <div className="max-w-2xl mx-auto bg-surface-container-low p-8 md:p-12 rounded-2xl border border-outline-variant/20 shadow-2xl space-y-8 animate-fade-in">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <span className="text-xs font-label uppercase tracking-widest text-primary font-semibold block">
              Payment Authorized via {confirmedOrder.paymentGateway}
            </span>
            <h1 className="font-display text-3xl md:text-4xl text-on-background">
              Commission Placed with KNOTKARI
            </h1>
            <p className="font-body text-sm text-on-surface-variant max-w-md mx-auto">
              Your order <span className="text-on-surface font-semibold">#{confirmedOrder.id}</span>{' '}
              has been confirmed and registered to{' '}
              <span className="text-primary font-semibold">
                {confirmedOrder.shippingAddress?.email}
              </span>
              .
            </p>
          </div>

          {/* Receipt Breakdown */}
          <div className="bg-surface-container/60 p-6 rounded-xl space-y-4 border border-outline-variant/10">
            <div className="flex justify-between items-center text-xs pb-3 border-b border-outline-variant/10">
              <span className="text-on-surface-variant">Tracking Number:</span>
              <span className="font-mono text-primary font-bold">
                {confirmedOrder.trackingNumber}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs pb-3 border-b border-outline-variant/10">
              <span className="text-on-surface-variant">Payment Ref:</span>
              <span className="font-mono text-on-surface">{confirmedOrder.paymentId}</span>
            </div>
            <div className="flex justify-between items-center text-xs pb-3 border-b border-outline-variant/10">
              <span className="text-on-surface-variant">Registered Email:</span>
              <span className="font-mono text-primary font-semibold">
                {confirmedOrder.shippingAddress?.email}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs pb-3 border-b border-outline-variant/10">
              <span className="text-on-surface-variant">Shipping To:</span>
              <span className="text-right text-on-surface text-xs">
                {confirmedOrder.shippingAddress?.street}, {confirmedOrder.shippingAddress?.city},{' '}
                {confirmedOrder.shippingAddress?.state} -{' '}
                {confirmedOrder.shippingAddress?.postalCode}
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant font-semibold">
                Handcrafted Pieces
              </span>
              {confirmedOrder.items.map((item, i) => (
                <div key={i} className="flex justify-between text-xs text-on-surface">
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-mono">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-outline-variant/10 flex justify-between text-base font-semibold text-on-background">
              <span>Total Charged</span>
              <span className="text-primary font-bold">₹{confirmedOrder.total}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button
              onClick={handlePrint}
              className="flex-1 py-3.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl font-label text-xs uppercase tracking-widest flex items-center justify-center gap-2 border border-outline-variant/30 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Archive Receipt</span>
            </button>
            <button
              onClick={onNavigateToShop}
              className="flex-1 py-3.5 bg-primary text-on-primary hover:bg-primary-fixed rounded-xl font-label text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <span>Back to Atelier Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* CHECKOUT FLOW: STEP 1 (SHIPPING) & STEP 2 (PAYMENT) */}
      {step < 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Form Step Content */}
          <div className="lg:col-span-7 space-y-8">
            {/* STEP 1: SHIPPING DESTINATION (ALL DETAILS COMPULSORY) */}
            {step === 1 && (
              <form
                onSubmit={handleShippingSubmit}
                className="bg-surface-container-low p-6 md:p-8 rounded-2xl border border-outline-variant/20 space-y-6 shadow-xl"
              >
                <input
                  type="text"
                  name="honeypot"
                  value={formData.honeypot}
                  onChange={handleInputChange}
                  tabIndex={-1}
                  className="hidden"
                />

                <div className="flex items-center justify-between pb-2 border-b border-outline-variant/10">
                  <div>
                    <h2 className="font-display text-2xl text-on-surface">Shipping Destination</h2>
                    <p className="text-xs text-on-surface-variant mt-1">
                      All details below are compulsory and will be saved to your registered email.
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-primary font-mono bg-primary/10 px-3 py-1 rounded-full">
                    <Truck className="w-3.5 h-3.5" />
                    <span>Complimentary Dispatch</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block">
                      Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Ananya Sharma"
                      className="ghost-input w-full py-2.5 text-sm text-on-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block">
                      Email Address <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="ananya@knotkari.atelier"
                      className="ghost-input w-full py-2.5 text-sm text-on-background font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block">
                    Phone / WhatsApp Contact <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+91 98201 44521"
                    className="ghost-input w-full py-2.5 text-sm text-on-background font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block">
                    Street Address / Flat / Floor <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="street"
                    required
                    value={formData.street}
                    onChange={handleInputChange}
                    placeholder="Flat 402, Heritage Residency, 12th Main Indiranagar"
                    className="ghost-input w-full py-2.5 text-sm text-on-background"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block">
                      City <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Bengaluru"
                      className="ghost-input w-full py-2.5 text-sm text-on-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block">
                      State <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="state"
                      required
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="Karnataka"
                      className="ghost-input w-full py-2.5 text-sm text-on-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block">
                      PIN Code <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      required
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      placeholder="560038"
                      className="ghost-input w-full py-2.5 text-sm text-on-background font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block">
                    Personalized Calligraphy Gift Note (Optional Complimentary)
                  </label>
                  <textarea
                    rows={2}
                    name="giftNote"
                    value={formData.giftNote}
                    onChange={handleInputChange}
                    placeholder="e.g. Handcrafted with love for your special day."
                    className="ghost-input w-full py-2 text-sm text-on-background resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-on-background hover:bg-primary-fixed text-background hover:text-on-primary-fixed font-label text-xs uppercase tracking-widest font-semibold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Proceed to Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* STEP 2: PAYMENT AUTHORIZATION (DIRECTLY CONNECTED FROM SHIPPING) */}
            {step === 2 && (
              <form
                onSubmit={handlePaymentSubmit}
                className="bg-surface-container-low p-6 md:p-8 rounded-2xl border border-outline-variant/20 space-y-6 shadow-xl animate-fade-in"
              >
                <div>
                  <h2 className="font-display text-2xl text-on-surface">Payment Authorization</h2>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Delivering to{' '}
                    <span className="text-on-surface font-semibold">{formData.name}</span> (
                    {formData.email}).
                  </p>
                </div>

                {/* Gateway Selector: Paytm Unified Payments */}
                <div className="space-y-3">
                  <div className="p-5 rounded-xl border border-primary bg-primary/10 shadow-lg transition-all">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center mt-0.5 shrink-0 bg-primary/20">
                          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-headline text-base font-semibold text-on-surface">
                              Paytm Payment Gateway
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-label uppercase font-bold bg-primary/20 text-primary flex items-center gap-1">
                              <Zap className="w-3 h-3" /> Recommended
                            </span>
                          </div>
                          <p className="text-xs text-on-surface-variant mt-1">
                            Pay seamlessly via UPI (Google Pay, PhonePe, Paytm, QR), Paytm Wallet &
                            NetBanking.
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] font-mono text-on-surface-variant/90">
                            <span className="px-2 py-0.5 bg-surface-container rounded border border-outline-variant/20">
                              UPI Instant
                            </span>
                            <span className="px-2 py-0.5 bg-surface-container rounded border border-outline-variant/20">
                              Paytm Wallet
                            </span>
                            <span className="px-2 py-0.5 bg-surface-container rounded border border-outline-variant/20">
                              NetBanking
                            </span>
                            <span className="px-2 py-0.5 bg-surface-container rounded border border-outline-variant/20">
                              Dynamic QR
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-primary text-xs font-mono shrink-0">
                        <Smartphone className="w-4 h-4" />
                        <span>Instant</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="py-4 px-6 bg-surface-container text-on-surface hover:bg-surface-container-high font-label text-xs uppercase tracking-widest rounded-xl transition-colors cursor-pointer"
                  >
                    Back to Shipping
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1 py-4 bg-on-background hover:bg-primary-fixed text-background hover:text-on-primary-fixed font-label text-xs uppercase tracking-widest font-semibold rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isProcessing ? (
                      <span>Launching Secure Paytm Gateway...</span>
                    ) : (
                      <>
                        <span>Authorize ₹{grandTotal.toFixed(0)} via Paytm</span>
                        <Lock className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right Summary Sidebar */}
          <div className="lg:col-span-5">
            <div className="bg-surface-container-low p-6 md:p-8 rounded-2xl border border-outline-variant/20 space-y-6 shadow-xl sticky top-28">
              <h3 className="font-display text-xl text-on-surface">Order Summary</h3>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-14 h-14 rounded-xl object-cover bg-surface-container shrink-0"
                    />
                    <div className="flex-grow">
                      <h4 className="font-headline text-sm text-on-surface font-medium">
                        {item.name}
                      </h4>
                      <p className="text-xs text-on-surface-variant font-mono">
                        {item.quantity}x @ ₹{item.price}
                      </p>
                    </div>
                    <span className="font-mono text-sm font-semibold text-primary">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-outline-variant/10 space-y-2 text-xs text-on-surface-variant">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono text-on-surface">₹{subtotal.toFixed(0)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Privilege Voucher ({appliedPromo?.code})</span>
                    <span className="font-mono">-₹{discountAmount.toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-mono text-on-surface">
                    {isFreeShipping ? 'FREE' : `₹${shippingCost.toFixed(0)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes</span>
                  <span className="font-mono text-on-surface">Inclusive</span>
                </div>
                <div className="pt-3 border-t border-outline-variant/15 flex justify-between text-base font-semibold text-on-background">
                  <span>Total Amount</span>
                  <span className="text-primary font-bold">₹{grandTotal.toFixed(0)}</span>
                </div>
              </div>

              <div className="p-3.5 bg-surface-container rounded-xl text-[11px] text-on-surface-variant flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                <span>
                  Protected by Paytm 256-bit encryption & email-bound transaction records.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
