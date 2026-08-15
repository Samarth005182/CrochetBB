import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';
import { authLimiter, validateHoneypot } from '../utils/rateLimiter';
import { supabaseSignIn, supabaseSignUp } from '../lib/supabase';

const AuthContext = createContext(null);

const DEFAULT_USER = {
  id: 'knot_patron_8921',
  name: 'Ananya Sharma',
  email: 'ananya.sharma@knotkari.atelier',
  phone: '+91 98201 44521',
  bio: 'Connoisseur of slow-fashion karigari and botanical fiber arts.',
  avatar:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  tier: 'Knotkari Master Patron',
  rewardPoints: 1240,
  joinedDate: 'November 2024',
  addresses: [
    {
      id: 'addr_1',
      name: 'Ananya Sharma',
      street: 'Flat 402, Heritage Residency, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560038',
      country: 'India',
      phone: '+91 98201 44521',
      isDefault: true,
    },
    {
      id: 'addr_2',
      name: 'Ananya Sharma (Studio)',
      street: '18/A, Arts Quarter, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400050',
      country: 'India',
      phone: '+91 98201 44521',
      isDefault: false,
    },
  ],
  orders: [
    {
      id: 'KNOT-98241',
      date: '2026-08-04',
      items: [
        { name: 'The Artisan Daisy Charm', price: 45, quantity: 1 },
        { name: 'Midnight Tulip Ensemble', price: 140, quantity: 1 },
      ],
      total: 185,
      status: 'Dispatched',
      currentStage: 4, // 1: Fiber Prep, 2: Karigari Loom, 3: Steaming & QC, 4: Dispatched, 5: Delivered
      trackingNumber: 'KNOT-IN-892401928',
      estimatedDelivery: 'Aug 18, 2026',
      paymentGateway: 'Razorpay (UPI ID: ananya@oksbi)',
      artisan: 'Master Weaver Devika',
    },
  ],
  sessionLogs: [
    {
      id: 's1',
      ip: '103.21.244.12',
      device: 'Chrome on macOS (Bengaluru)',
      time: 'Just now',
      status: 'Active',
    },
    {
      id: 's2',
      ip: '103.21.244.12',
      device: 'Safari on iPhone 15 Pro',
      time: 'Yesterday, 8:42 PM',
      status: 'Verified',
    },
  ],
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('knotkari_user');
      return saved ? JSON.parse(saved) : DEFAULT_USER; // Default logged in for smooth instant demo
    } catch {
      return DEFAULT_USER;
    }
  });

  const [isGuest, setIsGuest] = useState(() => {
    return localStorage.getItem('knotkari_is_guest') === 'true';
  });

  const { addToast } = useToast();

  useEffect(() => {
    if (user) {
      localStorage.setItem('knotkari_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('knotkari_user');
    }
    localStorage.setItem('knotkari_is_guest', isGuest ? 'true' : 'false');
  }, [user, isGuest]);

  const login = async (email, password, honeypot = '') => {
    if (!validateHoneypot(honeypot)) {
      addToast('Security verification failed. Request blocked.', 'error');
      return false;
    }

    const limitCheck = authLimiter.consume(1);
    if (!limitCheck.allowed) {
      addToast(
        `Rate limit reached. Please wait ${limitCheck.retryAfterSec}s before retrying.`,
        'error',
      );
      return false;
    }

    if (!email || !password) {
      addToast('Please provide both email and password.', 'error');
      return false;
    }

    // Attempt Supabase Auth
    try {
      const supaResult = await supabaseSignIn(email, password);
      if (supaResult.success && supaResult.data?.user) {
        const supaUser = {
          ...DEFAULT_USER,
          id: supaResult.data.user.id,
          name: supaResult.data.user.user_metadata?.full_name || email.split('@')[0],
          email: supaResult.data.user.email,
          tier: supaResult.data.user.user_metadata?.tier || 'Knotkari Patron',
          joinedDate: new Date(supaResult.data.user.created_at).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          }),
        };
        setUser(supaUser);
        setIsGuest(false);
        addToast(`Welcome back to KNOTKARI Atelier, ${supaUser.name}`, 'success');
        return true;
      }
    } catch (e) {
      console.warn('[Supabase Auth Fallback]', e);
    }

    // Fallback simulated authentication
    await new Promise((res) => setTimeout(res, 400));
    const authenticatedUser = {
      ...DEFAULT_USER,
      email: email,
      name: email
        .split('@')[0]
        .replace('.', ' ')
        .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase()),
    };
    setUser(authenticatedUser);
    setIsGuest(false);
    addToast(`Welcome back to KNOTKARI Atelier, ${authenticatedUser.name}`, 'success');
    return true;
  };

  const register = async (name, email, password, honeypot = '') => {
    if (!validateHoneypot(honeypot)) {
      addToast('Security verification failed. Request blocked.', 'error');
      return false;
    }

    const limitCheck = authLimiter.consume(1);
    if (!limitCheck.allowed) {
      addToast(
        `Rate limit reached. Please wait ${limitCheck.retryAfterSec}s before retrying.`,
        'error',
      );
      return false;
    }

    try {
      const supaResult = await supabaseSignUp(email, password, name);
      if (supaResult.success && supaResult.data?.user) {
        const supaUser = {
          ...DEFAULT_USER,
          id: supaResult.data.user.id,
          name: name || email.split('@')[0],
          email: supaResult.data.user.email,
          tier: 'Knotkari Karigar Apprentice',
          rewardPoints: 200,
          joinedDate: 'Today',
          addresses: [],
          orders: [],
        };
        setUser(supaUser);
        setIsGuest(false);
        addToast('Welcome to KNOTKARI. Your atelier membership is active.', 'success');
        return true;
      }
    } catch (e) {
      console.warn('[Supabase Auth SignUp Fallback]', e);
    }

    await new Promise((res) => setTimeout(res, 400));
    const newUser = {
      ...DEFAULT_USER,
      id: 'knot_' + Math.random().toString(36).substring(2, 8),
      name: name || 'Atelier Patron',
      email: email,
      tier: 'Knotkari Karigar Apprentice',
      rewardPoints: 200,
      joinedDate: 'Today',
      addresses: [],
      orders: [],
    };

    setUser(newUser);
    setIsGuest(false);
    addToast('Welcome to KNOTKARI. Your atelier membership is active.', 'success');
    return true;
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    setUser({
      id: 'guest_' + Math.random().toString(36).substring(2, 8),
      name: 'Guest Patron',
      email: '',
      tier: 'Guest',
      rewardPoints: 0,
      addresses: [],
      orders: [],
    });
    addToast('Continuing as a KNOTKARI Guest Patron', 'info');
  };

  const logout = () => {
    setUser(null);
    setIsGuest(false);
    addToast('You have safely exited the KNOTKARI atelier.', 'info');
  };

  const updateProfile = (profileUpdates) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...profileUpdates };
      return updated;
    });
    addToast('Profile details updated successfully.', 'success');
  };

  const addAddress = (newAddress) => {
    setUser((prev) => {
      if (!prev) return prev;
      const addressItem = {
        ...newAddress,
        id: 'addr_' + Math.random().toString(36).substring(2, 8),
        isDefault: prev.addresses?.length === 0 ? true : Boolean(newAddress.isDefault),
      };
      let addresses = prev.addresses || [];
      if (addressItem.isDefault) {
        addresses = addresses.map((a) => ({ ...a, isDefault: false }));
      }
      return { ...prev, addresses: [...addresses, addressItem] };
    });
    addToast('New shipping address added.', 'success');
  };

  const updateAddress = (id, updatedFields) => {
    setUser((prev) => {
      if (!prev) return prev;
      let addresses = prev.addresses.map((a) => {
        if (a.id === id) {
          return { ...a, ...updatedFields };
        }
        if (updatedFields.isDefault) {
          return { ...a, isDefault: false };
        }
        return a;
      });
      return { ...prev, addresses };
    });
    addToast('Address updated.', 'success');
  };

  const deleteAddress = (id) => {
    setUser((prev) => {
      if (!prev) return prev;
      const filtered = prev.addresses.filter((a) => a.id !== id);
      if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
        filtered[0].isDefault = true;
      }
      return { ...prev, addresses: filtered };
    });
    addToast('Address removed.', 'info');
  };

  const addOrder = (order) => {
    if (!user) return;
    const enrichedOrder = {
      ...order,
      currentStage: 2, // 2: In Karigari Loom Weaving
      estimatedDelivery: new Date(Date.now() + 6 * 86400000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      artisan: 'Master Karigar Rajeshwari',
    };
    const updatedOrders = [enrichedOrder, ...(user.orders || [])];
    const updatedPoints = (user.rewardPoints || 0) + Math.round((order.total || 100) * 2);
    setUser((prev) => ({ ...prev, orders: updatedOrders, rewardPoints: updatedPoints }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isGuest,
        isAuthenticated: !!user && !isGuest,
        login,
        register,
        continueAsGuest,
        logout,
        updateProfile,
        addAddress,
        updateAddress,
        deleteAddress,
        addOrder,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
