import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';
import { PROMO_CODES } from '../data/products';
import { promoLimiter, checkoutLimiter } from '../utils/rateLimiter';

const CartContext = createContext(null);

const FREE_SHIPPING_THRESHOLD = 150;
const STANDARD_SHIPPING_COST = 15;
const TAX_RATE = 0.08; // 8% luxury sales tax

export function CartProvider({ children }) {
  // Initialize cart with sample items from prototype or localStorage
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('luxecraft_cart');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // Default initial items matching your_atelier_cart prototype
    return [
      {
        id: "sun-kissed-single",
        name: "Handmade Sunflower Bouquet",
        subtitle: "Warm ochre stitches, flexible stem",
        price: 85,
        quantity: 1,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA93r1LAk6HaRLHMIKSbZGnv3TT2bgxv_zhPZfRjfjikiEjStjznQHTgxXc0vrrhVDsln5LspqHbj4taSdp_08tkcikhZfedcb6P8f-XqjliLkdQV3FrWSv2iJrh7rxJNVLpk2pGlVvDk1DkTyo5k2t-CRlp8jaOObCqxVMEG-wjAmGRHZtKFIxoLAm1bAQjsjDllig3EeLDfDTVKb7ndj0UEvd5SD6mbfKnYx5G17O9QkzqJ-j8WxEuA"
      },
      {
        id: "midnight-tulip-ensemble",
        name: "Midnight Tulip Ensemble",
        subtitle: "Midnight navy & crimson velvet stitches",
        price: 140,
        quantity: 1,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDd-Z9FKQEqLMSctYI9Sq3o05hpPALgXJRsmL4WgHEmXFMnrOlYG9-FUvrtjXP9fBn35MYTMAec0mp_bUb4xrbotW0tyjLroFEvvfXnZG7BGru-WNtuA_EIgln6BrJjYoUpbk3SM6tsiRpBd2VAeVS3kkLxzvcDWcETlH4sLtDzYYKBvIRy7VN-0R5_5oaiMSjxqlEOcbyOWRpPlIy0ahe-vXE4UUXSpXyhlt4lA5Dl0NImoSBbl3G-TvQ8hRV51_jqwHo"
      }
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
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
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
          image: product.image
        }
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
      prev.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
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

  const applyPromoCode = (codeStr) => {
    const cleanCode = codeStr.trim().toUpperCase();
    
    // Rate limit voucher validation against brute-force script attacks
    const limitCheck = promoLimiter.consume(1);
    if (!limitCheck.allowed) {
      addToast(`Promo verification rate limit reached. Please wait ${limitCheck.retryAfterSec}s.`, "error");
      return false;
    }

    if (PROMO_CODES[cleanCode]) {
      setAppliedPromo({
        code: cleanCode,
        ...PROMO_CODES[cleanCode]
      });
      addToast(`Privilege code "${cleanCode}" applied: ${PROMO_CODES[cleanCode].label}`, "success");
      return true;
    } else {
      addToast(`Privilege code "${cleanCode}" is not recognized or expired.`, "error");
      return false;
    }
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    addToast("Privilege code removed", "info");
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
      addToast(`High traffic detected. Please wait ${limitCheck.retryAfterSec}s before retrying.`, "error");
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
            addToast("Queue verified. You have entered the priority checkout lane.", "success");
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
        triggerTrafficSurgeCheckout
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
