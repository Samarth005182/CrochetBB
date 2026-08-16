import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';
import { PROMO_CODES } from '../data/products';
import { promoLimiter, checkoutLimiter } from '../utils/rateLimiter';
import { validateVoucherServer } from '../lib/paytm';

const CartContext = createContext(null);

const FREE_SHIPPING_THRESHOLD = 499;
const STANDARD_SHIPPING_COST = 40;
const TAX_RATE = 0.0; // Inclusive of all taxes (Amazon India standard)

export function CartProvider({ children }) {
  // Initialize cart with sample items from prototype or localStorage
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('luxecraft_cart');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // Default initial items matching new catalog
    return [
      {
        id: 'prod-02-sunflower-bloom',
        name: 'Radiant Sunburst Crochet Sunflower Bouquet',
        subtitle: 'Deep Ochre & Cocoa Center • Butter Wrap',
        price: 200,
        quantity: 1,
        image: '/images/products/radiant-sunflower.jpg',
      },
    ];
  });

  const [appliedPromo, setAppliedPromo] = useState(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isSurgeModeEnabled, setIsSurgeModeEnabled] = useState(false);
  const [isWaitingInQueue, setIsWaitingInQueue] = useState(false);
  const [queueProgress, setQueueProgress] = useState(0);

  const { addToast } = useToast();

  useEffect(() => {
    localStorage.setItem('luxecraft_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item,
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          subtitle: product.subtitle || product.yarnType,
          price: product.price,
          quantity: quantity,
          image: product.image,
        },
      ];
    });

    addToast(`Added "${product.name}" to your atelier cart`, 'success');
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity: newQuantity } : item)),
    );
  };

  const removeFromCart = (productId) => {
    const item = items.find((i) => i.id === productId);
    setItems((prev) => prev.filter((i) => i.id !== productId));
    if (item) {
      addToast(`Removed "${item.name}" from your cart`, 'info');
    }
  };

  const clearCart = () => {
    setItems([]);
  };

  const applyPromoCode = async (codeStr) => {
    const cleanCode = codeStr.trim().toUpperCase();

    // Rate limit voucher validation against brute-force script attacks
    const limitCheck = promoLimiter.consume(1);
    if (!limitCheck.allowed) {
      addToast(
        `Promo verification rate limit reached. Please wait ${limitCheck.retryAfterSec}s.`,
        'error',
      );
      return false;
    }

    // Server-side authoritative validation. Falls back to local PROMO_CODES
    // only when the Edge Function is unreachable (dev/offline mode).
    const result = await validateVoucherServer(cleanCode, subtotal);
    let applied = null;

    if (result?.ok && result.valid) {
      applied = {
        code: result.code,
        label: result.label,
        discount: Number(result.discount_pct) / 100,
        serverValidated: true,
      };
    } else if (result?.ok === false && result.error === 'network-error' && PROMO_CODES[cleanCode]) {
      // network/edge-function unavailable — use legacy static fallback for dev
      applied = { code: cleanCode, ...PROMO_CODES[cleanCode], serverValidated: false };
    } else {
      addToast(
        `Privilege code "${cleanCode}" is not recognized, expired, or below minimum cart.`,
        'error',
      );
      return false;
    }

    setAppliedPromo(applied);
    addToast(
      `Privilege code "${applied.code}" applied: ${applied.label}${
        applied.serverValidated ? '' : ' (offline validation)'
      }`,
      'success',
    );
    return true;
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    addToast('Privilege code removed', 'info');
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const discountAmount = appliedPromo ? subtotal * appliedPromo.discount : 0;
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);

  const isFreeShipping = subtotalAfterDiscount >= FREE_SHIPPING_THRESHOLD || items.length === 0;
  const shippingCost = isFreeShipping ? 0 : STANDARD_SHIPPING_COST;
  const taxAmount = subtotalAfterDiscount * TAX_RATE;
  const grandTotal = subtotalAfterDiscount + shippingCost + taxAmount;
  const amountNeededForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotalAfterDiscount);

  // High-Traffic Surge / Virtual Queue Simulation
  const triggerTrafficSurgeCheckout = (onQueuePassed) => {
    const limitCheck = checkoutLimiter.consume(1);
    if (!limitCheck.allowed) {
      addToast(
        `High traffic detected. Please wait ${limitCheck.retryAfterSec}s before retrying.`,
        'error',
      );
      return false;
    }

    if (isSurgeModeEnabled) {
      setIsWaitingInQueue(true);
      setQueueProgress(15);

      // Simulate orderly queue advancement
      const interval = setInterval(() => {
        setQueueProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsWaitingInQueue(false);
            addToast('Queue verified. You have entered the priority checkout lane.', 'success');
            if (onQueuePassed) onQueuePassed();
            return 100;
          }
          return prev + 25;
        });
      }, 750);
      return true;
    } else {
      if (onQueuePassed) onQueuePassed();
      return true;
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        subtotal,
        totalItemCount,
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
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        isSurgeModeEnabled,
        setIsSurgeModeEnabled,
        isWaitingInQueue,
        setIsWaitingInQueue,
        queueProgress,
        triggerTrafficSurgeCheckout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
