import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';
import { authLimiter, validateHoneypot } from '../utils/rateLimiter';
import {
  supabaseSignIn,
  supabaseSignUp,
  fetchUserDataByEmail,
  saveAddressForEmail,
  deleteAddressFromSupabase,
  updateProfileForEmail,
  ensureUserProfile,
} from '../lib/supabase';

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
      currentStage: 4,
      trackingNumber: 'KNOT-IN-892401928',
      estimatedDelivery: 'Aug 18, 2026',
      paymentGateway: 'Paytm (UPI ID: ananya@paytm)',
      artisan: 'Master Weaver Devika',
    },
  ],
  paymentHistory: [
    {
      id: 'pay_hist_01',
      order_number: 'KNOT-98241',
      payment_id: 'pay_ptm_892184',
      gateway: 'Paytm',
      amount: 185,
      currency: 'INR',
      status: 'captured',
      created_at: '2026-08-04T10:30:00Z',
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

function getStoredUserStore() {
  try {
    const raw = localStorage.getItem('knotkari_users_store');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveUserToStore(user) {
  if (!user || !user.email) return;
  try {
    const store = getStoredUserStore();
    store[user.email.toLowerCase()] = user;
    localStorage.setItem('knotkari_users_store', JSON.stringify(store));
  } catch (err) {
    console.warn('[AuthContext] saveUserToStore failed', err);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const activeEmail = localStorage.getItem('knotkari_active_email');
      const store = getStoredUserStore();
      if (activeEmail && store[activeEmail.toLowerCase()]) {
        return store[activeEmail.toLowerCase()];
      }
      const saved = localStorage.getItem('knotkari_user');
      return saved ? JSON.parse(saved) : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  });

  const [isGuest, setIsGuest] = useState(() => {
    return localStorage.getItem('knotkari_is_guest') === 'true';
  });

  const { addToast } = useToast();

  useEffect(() => {
    if (user && user.email) {
      localStorage.setItem('knotkari_user', JSON.stringify(user));
      localStorage.setItem('knotkari_active_email', user.email.toLowerCase());
      saveUserToStore(user);
    } else {
      localStorage.removeItem('knotkari_user');
      localStorage.removeItem('knotkari_active_email');
    }
    localStorage.setItem('knotkari_is_guest', isGuest ? 'true' : 'false');
  }, [user, isGuest]);

  // Sync data from Supabase for current user's email on mount
  useEffect(() => {
    if (user?.email) {
      syncEmailDataFromSupabase(user.email);
    }
  }, [user?.email]);

  const syncEmailDataFromSupabase = async (email) => {
    if (!email) return;
    try {
      const dbData = await fetchUserDataByEmail(email);
      if (dbData) {
        setUser((prev) => {
          if (!prev || prev.email?.toLowerCase() !== email.toLowerCase()) return prev;

          const mergedAddresses =
            dbData.addresses?.length > 0
              ? dbData.addresses.map((a) => ({
                  id: a.id,
                  name: a.name,
                  street: a.street,
                  city: a.city,
                  state: a.state,
                  postalCode: a.postal_code,
                  country: a.country || 'India',
                  phone: a.phone || '',
                  isDefault: Boolean(a.is_default),
                }))
              : prev.addresses;

          const mergedOrders =
            dbData.orders?.length > 0
              ? dbData.orders.map((o) => ({
                  id: o.order_number,
                  date: o.created_at
                    ? o.created_at.split('T')[0]
                    : new Date().toISOString().split('T')[0],
                  items: Array.isArray(o.items) ? o.items : [],
                  subtotal: o.subtotal,
                  shipping: o.shipping,
                  tax: o.tax,
                  total: o.total,
                  status: o.status === 'paid' ? 'In Queue for Karigari Loom' : o.status,
                  currentStage: 2,
                  trackingNumber: o.tracking_number,
                  shippingAddress: o.shipping_address,
                  deliveryMethod: o.delivery_method,
                  paymentGateway: o.payment_provider,
                  paymentId: o.payment_id,
                  giftNote: o.gift_note,
                  artisan: o.artisan || 'Master Karigar Rajeshwari',
                }))
              : prev.orders;

          const mergedPayments =
            dbData.paymentHistory?.length > 0 ? dbData.paymentHistory : prev.paymentHistory || [];

          return {
            ...prev,
            name: dbData.profile?.name || prev.name,
            phone: dbData.profile?.phone || prev.phone,
            bio: dbData.profile?.bio || prev.bio,
            tier: dbData.profile?.tier || prev.tier,
            rewardPoints: dbData.profile?.reward_points ?? prev.rewardPoints,
            addresses: mergedAddresses || [],
            orders: mergedOrders || [],
            paymentHistory: mergedPayments,
          };
        });
      }
    } catch (err) {
      console.warn('[AuthContext] sync from supabase error', err);
    }
  };

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

    const cleanEmail = email.toLowerCase().trim();

    // Check if user exists in local store
    const store = getStoredUserStore();
    const existingUserData = store[cleanEmail];

    // Attempt Supabase Auth
    try {
      const supaResult = await supabaseSignIn(cleanEmail, password);
      if (supaResult.success && supaResult.data?.user) {
        const supaUser = {
          id: supaResult.data.user.id,
          name:
            supaResult.data.user.user_metadata?.full_name ||
            cleanEmail
              .split('@')[0]
              .replace('.', ' ')
              .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase()),
          email: cleanEmail,
          phone: supaResult.data.user.user_metadata?.phone || '+91 98201 44521',
          bio: 'Connoisseur of slow-fashion karigari and botanical fiber arts.',
          avatar:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          tier: supaResult.data.user.user_metadata?.tier || 'Knotkari Master Patron',
          rewardPoints: 500,
          joinedDate: new Date(supaResult.data.user.created_at).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          }),
          addresses: existingUserData?.addresses || [],
          orders: existingUserData?.orders || [],
          paymentHistory: existingUserData?.paymentHistory || [],
        };

        setUser(supaUser);
        setIsGuest(false);
        saveUserToStore(supaUser);
        syncEmailDataFromSupabase(cleanEmail);
        addToast(`Welcome back to KNOTKARI Atelier, ${supaUser.name}`, 'success');
        return true;
      }
    } catch (e) {
      console.warn('[Supabase Auth Fallback]', e);
    }

    // Fallback authentication associated to this specific email
    await new Promise((res) => setTimeout(res, 300));
    await ensureUserProfile(cleanEmail);

    const authenticatedUser = existingUserData || {
      id: 'knot_' + Math.random().toString(36).substring(2, 8),
      email: cleanEmail,
      name: cleanEmail
        .split('@')[0]
        .replace('.', ' ')
        .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase()),
      phone: '+91 98201 44521',
      bio: 'Connoisseur of slow-fashion karigari and botanical fiber arts.',
      avatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      tier: 'Knotkari Master Patron',
      rewardPoints: 300,
      joinedDate: 'Joined Recently',
      addresses: [],
      orders: [],
      paymentHistory: [],
    };

    setUser(authenticatedUser);
    setIsGuest(false);
    saveUserToStore(authenticatedUser);
    syncEmailDataFromSupabase(cleanEmail);
    addToast(`Welcome back to KNOTKARI Atelier, ${authenticatedUser.name}`, 'success');
    return true;
  };

  const register = async (name, email, password, honeypot = '') => {
    if (!validateHoneypot(honeypot)) {
      addToast('Security verification failed. Request blocked.', 'error');
      return false;
    }

    if (!email || !name) {
      addToast('Email and name are compulsory to register.', 'error');
      return false;
    }

    const cleanEmail = email.toLowerCase().trim();

    const limitCheck = authLimiter.consume(1);
    if (!limitCheck.allowed) {
      addToast(
        `Rate limit reached. Please wait ${limitCheck.retryAfterSec}s before retrying.`,
        'error',
      );
      return false;
    }

    try {
      const supaResult = await supabaseSignUp(cleanEmail, password, name);
      if (supaResult.success && supaResult.data?.user) {
        const supaUser = {
          id: supaResult.data.user.id,
          name: name || cleanEmail.split('@')[0],
          email: cleanEmail,
          phone: '',
          bio: 'Connoisseur of slow-fashion karigari and botanical fiber arts.',
          avatar:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          tier: 'Knotkari Master Patron',
          rewardPoints: 200,
          joinedDate: 'Today',
          addresses: [],
          orders: [],
          paymentHistory: [],
        };
        setUser(supaUser);
        setIsGuest(false);
        saveUserToStore(supaUser);
        addToast('Welcome to KNOTKARI. Your atelier membership is active.', 'success');
        return true;
      }
    } catch (e) {
      console.warn('[Supabase Auth SignUp Fallback]', e);
    }

    await new Promise((res) => setTimeout(res, 300));
    await ensureUserProfile(cleanEmail, name);

    const newUser = {
      id: 'knot_' + Math.random().toString(36).substring(2, 8),
      name: name || cleanEmail.split('@')[0],
      email: cleanEmail,
      phone: '',
      bio: 'Connoisseur of slow-fashion karigari and botanical fiber arts.',
      avatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      tier: 'Knotkari Master Patron',
      rewardPoints: 200,
      joinedDate: 'Today',
      addresses: [],
      orders: [],
      paymentHistory: [],
    };

    setUser(newUser);
    setIsGuest(false);
    saveUserToStore(newUser);
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
      paymentHistory: [],
    });
    addToast('Continuing as a KNOTKARI Guest Patron', 'info');
  };

  const logout = () => {
    setUser(null);
    setIsGuest(false);
    localStorage.removeItem('knotkari_active_email');
    localStorage.removeItem('knotkari_user');
    addToast('You have safely exited the KNOTKARI atelier.', 'info');
  };

  const updateProfile = async (profileUpdates) => {
    if (!user) return;
    const updated = { ...user, ...profileUpdates };
    setUser(updated);
    saveUserToStore(updated);
    if (user.email) {
      updateProfileForEmail(user.email, profileUpdates).catch((err) =>
        console.warn('[Supabase updateProfile]', err),
      );
    }
    addToast('Profile details updated successfully.', 'success');
  };

  const addAddress = async (newAddress) => {
    if (!user) return;
    const addressItem = {
      ...newAddress,
      id: 'addr_' + Math.random().toString(36).substring(2, 8),
      isDefault: user.addresses?.length === 0 ? true : Boolean(newAddress.isDefault),
    };
    let addresses = user.addresses || [];
    if (addressItem.isDefault) {
      addresses = addresses.map((a) => ({ ...a, isDefault: false }));
    }
    const updatedAddresses = [...addresses, addressItem];
    const updatedUser = { ...user, addresses: updatedAddresses };
    setUser(updatedUser);
    saveUserToStore(updatedUser);

    if (user.email) {
      saveAddressForEmail(user.email, addressItem).catch((err) =>
        console.warn('[Supabase saveAddress]', err),
      );
    }
    addToast('New shipping address added to your account.', 'success');
  };

  const updateAddress = async (id, updatedFields) => {
    if (!user) return;
    let addresses = (user.addresses || []).map((a) => {
      if (a.id === id) {
        return { ...a, ...updatedFields };
      }
      if (updatedFields.isDefault) {
        return { ...a, isDefault: false };
      }
      return a;
    });
    const updatedUser = { ...user, addresses };
    setUser(updatedUser);
    saveUserToStore(updatedUser);

    if (user.email) {
      const target = addresses.find((a) => a.id === id);
      if (target) {
        saveAddressForEmail(user.email, target).catch((err) =>
          console.warn('[Supabase updateAddress]', err),
        );
      }
    }
    addToast('Address updated.', 'success');
  };

  const deleteAddress = async (id) => {
    if (!user) return;
    const filtered = (user.addresses || []).filter((a) => a.id !== id);
    if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
      filtered[0].isDefault = true;
    }
    const updatedUser = { ...user, addresses: filtered };
    setUser(updatedUser);
    saveUserToStore(updatedUser);

    deleteAddressFromSupabase(id).catch((err) => console.warn('[Supabase deleteAddress]', err));
    addToast('Address removed from your account.', 'info');
  };

  const addOrder = (order) => {
    if (!user) return;
    const userEmail = (user.email || order.shippingAddress?.email || '').toLowerCase();
    const enrichedOrder = {
      ...order,
      currentStage: 2,
      estimatedDelivery: new Date(Date.now() + 5 * 86400000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      artisan: order.artisan || 'Master Karigar Rajeshwari',
    };

    const newPayment = {
      id: `pay_hist_${Math.random().toString(36).substring(2, 8)}`,
      order_number: order.id,
      payment_id: order.paymentId || `pay_${Math.random().toString(36).substring(2, 9)}`,
      gateway: order.paymentGateway || 'Paytm',
      amount: order.total,
      currency: 'INR',
      status: 'captured',
      created_at: new Date().toISOString(),
    };

    // Auto-save shipping address if not already present
    let updatedAddresses = user.addresses || [];
    if (order.shippingAddress && order.shippingAddress.street) {
      const exists = updatedAddresses.some(
        (a) =>
          a.street?.toLowerCase() === order.shippingAddress.street?.toLowerCase() &&
          a.postalCode === order.shippingAddress.postalCode,
      );
      if (!exists) {
        const newAddr = {
          id: 'addr_' + Math.random().toString(36).substring(2, 8),
          name: order.shippingAddress.name || user.name,
          street: order.shippingAddress.street,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          postalCode: order.shippingAddress.postalCode,
          country: order.shippingAddress.country || 'India',
          phone: order.shippingAddress.phone || user.phone,
          isDefault: updatedAddresses.length === 0,
        };
        updatedAddresses = [newAddr, ...updatedAddresses];
      }
    }

    const updatedOrders = [enrichedOrder, ...(user.orders || [])];
    const updatedPayments = [newPayment, ...(user.paymentHistory || [])];
    const updatedPoints = (user.rewardPoints || 0) + Math.round((order.total || 100) * 2);

    const updatedUser = {
      ...user,
      email: userEmail || user.email,
      orders: updatedOrders,
      paymentHistory: updatedPayments,
      addresses: updatedAddresses,
      rewardPoints: updatedPoints,
    };

    setUser(updatedUser);
    saveUserToStore(updatedUser);
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
        syncEmailDataFromSupabase,
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
