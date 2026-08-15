import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';
import { authLimiter, validateHoneypot } from '../utils/rateLimiter';
import { supabaseSignIn, supabaseSignUp } from '../lib/supabase';

const AuthContext = createContext(null);

const DEFAULT_USER = {
  id: "user_78912",
  name: "Victoria Sterling",
  email: "victoria.sterling@atelier.luxe",
  tier: "Gold Craftsman Patron",
  joinedDate: "October 2024",
  addresses: [
    {
      id: "addr_1",
      name: "Victoria Sterling",
      street: "742 Evergreen Terrace, Suite 4B",
      city: "New York",
      state: "NY",
      postalCode: "10021",
      country: "United States",
      isDefault: true
    }
  ],
  orders: [
    {
      id: "LX-98241",
      date: "2026-07-28",
      items: [
        { name: "The Artisan Daisy Charm", price: 45, quantity: 1 },
        { name: "Midnight Tulip Ensemble", price: 140, quantity: 1 }
      ],
      total: 185,
      status: "Delivered",
      trackingNumber: "LX-US-892401928"
    }
  ]
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('luxecraft_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isGuest, setIsGuest] = useState(() => {
    return localStorage.getItem('luxecraft_is_guest') === 'true';
  });

  const { addToast } = useToast();

  useEffect(() => {
    if (user) {
      localStorage.setItem('luxecraft_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('luxecraft_user');
    }
    localStorage.setItem('luxecraft_is_guest', isGuest ? 'true' : 'false');
  }, [user, isGuest]);

  const login = async (email, password, honeypot = "") => {
    // 1. Anti-Bot honeypot check
    if (!validateHoneypot(honeypot)) {
      addToast("Security verification failed. Request blocked.", "error");
      return false;
    }

    // 2. Token Bucket Rate Limiting
    const limitCheck = authLimiter.consume(1);
    if (!limitCheck.allowed) {
      addToast(`Rate limit reached. Please wait ${limitCheck.retryAfterSec}s before retrying.`, "error");
      return false;
    }

    if (!email || !password) {
      addToast("Please provide both email and password.", "error");
      return false;
    }

    // Attempt Supabase Auth
    try {
      const supaResult = await supabaseSignIn(email, password);
      if (supaResult.success && supaResult.data?.user) {
        const supaUser = {
          id: supaResult.data.user.id,
          name: supaResult.data.user.user_metadata?.full_name || email.split('@')[0],
          email: supaResult.data.user.email,
          tier: supaResult.data.user.user_metadata?.tier || "Gold Craftsman Patron",
          joinedDate: new Date(supaResult.data.user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          addresses: DEFAULT_USER.addresses,
          orders: []
        };
        setUser(supaUser);
        setIsGuest(false);
        addToast(`Welcome back to the atelier, ${supaUser.name}`, "success");
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
      name: email.split('@')[0].replace('.', ' ').replace(/(^\w|\s\w)/g, (m) => m.toUpperCase())
    };
    setUser(authenticatedUser);
    setIsGuest(false);
    addToast(`Welcome back to the atelier, ${authenticatedUser.name}`, "success");
    return true;
  };

  const register = async (name, email, password, honeypot = "") => {
    if (!validateHoneypot(honeypot)) {
      addToast("Security verification failed. Request blocked.", "error");
      return false;
    }

    const limitCheck = authLimiter.consume(1);
    if (!limitCheck.allowed) {
      addToast(`Rate limit reached. Please wait ${limitCheck.retryAfterSec}s before retrying.`, "error");
      return false;
    }

    // Attempt Supabase Auth SignUp
    try {
      const supaResult = await supabaseSignUp(email, password, name);
      if (supaResult.success && supaResult.data?.user) {
        const supaUser = {
          id: supaResult.data.user.id,
          name: name || email.split('@')[0],
          email: supaResult.data.user.email,
          tier: "Bronze Artisan Apprentice",
          joinedDate: "Today",
          addresses: [],
          orders: []
        };
        setUser(supaUser);
        setIsGuest(false);
        addToast("Welcome to Luxe Craft Atelier. Your account is active.", "success");
        return true;
      }
    } catch (e) {
      console.warn('[Supabase Auth SignUp Fallback]', e);
    }

    await new Promise((res) => setTimeout(res, 400));
    const newUser = {
      id: "user_" + Math.random().toString(36).substring(2, 8),
      name: name || "Atelier Guest",
      email: email,
      tier: "Bronze Artisan Apprentice",
      joinedDate: "Today",
      addresses: [],
      orders: []
    };

    setUser(newUser);
    setIsGuest(false);
    addToast("Welcome to Luxe Craft Atelier. Your account is active.", "success");
    return true;
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    setUser({
      id: "guest_" + Math.random().toString(36).substring(2, 8),
      name: "Guest Patron",
      email: "",
      tier: "Guest",
      addresses: [],
      orders: []
    });
    addToast("Continuing as an Atelier Guest Patron", "info");
  };

  const logout = () => {
    setUser(null);
    setIsGuest(false);
    addToast("You have exited the atelier", "info");
  };

  const addOrder = (order) => {
    if (!user) return;
    const updatedOrders = [order, ...(user.orders || [])];
    setUser((prev) => ({ ...prev, orders: updatedOrders }));
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
        addOrder
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
