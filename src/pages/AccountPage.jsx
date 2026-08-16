import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import {
  User,
  Package,
  Heart,
  MapPin,
  Sparkles,
  LogOut,
  ShoppingBag,
  ShieldCheck,
  Edit3,
  Plus,
  Trash2,
  CheckCircle2,
  Key,
  Globe,
  Share2,
  Copy,
  CreditCard,
  Receipt,
} from 'lucide-react';

export function AccountPage({ onNavigateToShop, onNavigateToAuth }) {
  const {
    user,
    isAuthenticated,
    isGuest,
    logout,
    updateProfile,
    addAddress,
    updateAddress,
    deleteAddress,
  } = useAuth();
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'payments' | 'addresses' | 'profile' | 'wishlist' | 'perks'

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    avatar: user?.avatar || '',
  });

  // Address modal state
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    phone: '',
    isDefault: false,
  });

  if (!isAuthenticated && !isGuest) {
    return (
      <main className="flex-grow flex items-center justify-center py-20 px-4">
        <div className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/20 max-w-md text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto text-primary border border-outline-variant/20">
            <User className="w-8 h-8" />
          </div>
          <h2 className="font-display text-2xl text-on-surface">KNOTKARI Patron Portal</h2>
          <p className="text-sm font-body text-on-surface-variant">
            Please sign in with your email to access your handcrafted order journey, address book,
            payment history, and exclusive Karigari VIP privileges.
          </p>
          <button
            onClick={onNavigateToAuth}
            className="w-full py-3.5 bg-primary text-on-primary font-label text-xs uppercase tracking-widest font-semibold rounded hover:bg-primary-fixed transition-colors cursor-pointer"
          >
            Sign In / Enter Atelier
          </button>
        </div>
      </main>
    );
  }

  const handleProfileSave = (e) => {
    e.preventDefault();
    updateProfile(profileForm);
    setIsEditingProfile(false);
  };

  const handleOpenNewAddressModal = () => {
    setEditingAddressId(null);
    setAddressForm({
      name: user?.name || '',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      phone: user?.phone || '',
      isDefault: false,
    });
    setIsAddressModalOpen(true);
  };

  const handleOpenEditAddressModal = (addr) => {
    setEditingAddressId(addr.id);
    setAddressForm({ ...addr });
    setIsAddressModalOpen(true);
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (
      !addressForm.name?.trim() ||
      !addressForm.phone?.trim() ||
      !addressForm.street?.trim() ||
      !addressForm.city?.trim() ||
      !addressForm.state?.trim() ||
      !addressForm.postalCode?.trim()
    ) {
      addToast('All shipping address fields are compulsory.', 'error');
      return;
    }

    if (editingAddressId) {
      updateAddress(editingAddressId, addressForm);
    } else {
      addAddress(addressForm);
    }
    setIsAddressModalOpen(false);
  };

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(`https://knotkari.atelier/invite?ref=${user?.email || 'patron'}`);
    addToast('VIP Patron Referral Link copied to clipboard!', 'success');
  };

  return (
    <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-16">
      {/* 1. PATRON HEADER PROFILE CARD */}
      <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-6 md:p-8 mb-10 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="relative group">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-primary/40 shadow-inner"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-surface-container-highest flex items-center justify-center text-primary font-display text-3xl border-2 border-primary/30 shadow-inner">
                {user?.name ? user.name[0] : 'K'}
              </div>
            )}
            <button
              onClick={() => setIsEditingProfile(true)}
              className="absolute bottom-0 right-0 p-1.5 bg-primary text-on-primary rounded-full hover:bg-primary-fixed transition-colors shadow cursor-pointer"
              title="Edit Profile"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-2xl md:text-3xl text-on-background">
                {user?.name || 'Guest Patron'}
              </h1>
              <span className="px-3 py-0.5 rounded-full text-[11px] font-label uppercase font-semibold bg-primary/20 text-primary border border-primary/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>{user?.tier || 'Knotkari Master Patron'}</span>
              </span>
            </div>
            <p className="font-body text-xs text-on-surface-variant font-mono">
              {user?.email || 'Guest Session'} • Member since {user?.joinedDate || '2026'}
            </p>
            {user?.bio && (
              <p className="font-serif italic text-xs text-on-surface-variant/80 pt-1">
                "{user.bio}"
              </p>
            )}
          </div>
        </div>

        {/* Action / Points Pill */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-outline-variant/10">
          <div className="bg-surface-container px-4 py-2 rounded-xl border border-outline-variant/20 text-right">
            <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant block">
              Karigari Rewards
            </span>
            <span className="font-headline text-lg font-bold text-primary">
              {user?.rewardPoints || 200} pts
            </span>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 border border-outline-variant/30 hover:border-error/40 hover:text-error text-xs font-label uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Atelier</span>
          </button>
        </div>
      </div>

      {/* 2. NAVIGATION TABS */}
      <div className="flex border-b border-outline-variant/15 mb-8 overflow-x-auto gap-2">
        {[
          { id: 'orders', label: 'Order Journey', icon: Package, count: user?.orders?.length || 0 },
          {
            id: 'payments',
            label: 'Payment History',
            icon: Receipt,
            count: user?.paymentHistory?.length || 0,
          },
          {
            id: 'addresses',
            label: 'Saved Addresses',
            icon: MapPin,
            count: user?.addresses?.length || 0,
          },
          { id: 'profile', label: 'Security & Cloud Sync', icon: ShieldCheck },
          { id: 'wishlist', label: 'Curated Wishlist', icon: Heart, count: wishlist.length },
          { id: 'perks', label: 'VIP Club & Rewards', icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 font-label text-xs uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'text-primary border-b-2 border-primary font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="ml-1 px-2 py-0.5 bg-surface-container rounded-full text-[10px]">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. TAB 1: ORDER JOURNEY & TRACKER */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {!user?.orders || user.orders.length === 0 ? (
            <div className="text-center py-16 bg-surface-container-low rounded-2xl border border-outline-variant/10 space-y-3">
              <Package className="w-12 h-12 mx-auto text-on-surface-variant opacity-40" />
              <p className="font-display text-xl text-on-surface">No Karigari Orders Yet</p>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                Explore our catalog to commission handcrafted floral stems and slow-fashion pieces.
              </p>
              <button
                onClick={onNavigateToShop}
                className="px-6 py-2.5 bg-primary text-on-primary font-label text-xs uppercase tracking-widest rounded-lg font-semibold mt-2 cursor-pointer"
              >
                Browse Atelier Pieces
              </button>
            </div>
          ) : (
            user.orders.map((order) => (
              <div
                key={order.id}
                className="bg-surface-container-low p-6 md:p-8 rounded-2xl border border-outline-variant/20 space-y-6 shadow-md"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-outline-variant/10">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-headline text-lg text-on-surface font-semibold">
                        Order #{order.id}
                      </span>
                      <span className="px-3 py-0.5 rounded text-[11px] font-label uppercase font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1">
                      Placed on {order.date} • Registered to{' '}
                      <span className="text-primary font-mono">{user.email}</span>
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="font-headline text-lg text-primary font-bold">
                      ₹{order.total?.toFixed ? order.total.toFixed(0) : order.total}
                    </span>
                    <p className="text-xs font-mono text-on-surface-variant mt-0.5">
                      Tracking: {order.trackingNumber}
                    </p>
                  </div>
                </div>

                {/* 5-Stage Live Karigari Timeline */}
                <div className="py-4">
                  <span className="text-[11px] font-label uppercase tracking-widest text-on-surface-variant font-semibold block mb-4">
                    Artisan Craft & Dispatch Timeline
                  </span>
                  <div className="grid grid-cols-5 gap-2 text-center relative">
                    <div className="absolute top-4 left-[10%] right-[10%] h-0.5 bg-outline-variant/20 -z-0" />

                    {[
                      { step: 1, label: '1. Fiber Prep', desc: 'Organic Cotton Dyeing' },
                      { step: 2, label: '2. Karigari Loom', desc: 'Hand-Crochet Stitching' },
                      { step: 3, label: '3. Steaming & QC', desc: 'Tension Inspection' },
                      { step: 4, label: '4. Wax Seal Pack', desc: 'Archival Boxing' },
                      { step: 5, label: '5. Delivered', desc: 'White-Glove Courier' },
                    ].map((st) => {
                      const isComplete = (order.currentStage || 2) >= st.step;
                      const isCurrent = (order.currentStage || 2) === st.step;
                      return (
                        <div
                          key={st.step}
                          className="flex flex-col items-center relative z-10 space-y-1.5"
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              isCurrent
                                ? 'bg-primary text-on-primary ring-4 ring-primary/30 animate-pulse'
                                : isComplete
                                  ? 'bg-emerald-500 text-black'
                                  : 'bg-surface-container text-on-surface-variant border border-outline-variant/30'
                            }`}
                          >
                            {isComplete ? <CheckCircle2 className="w-4 h-4" /> : st.step}
                          </div>
                          <span
                            className={`text-[11px] font-label uppercase font-semibold ${isComplete ? 'text-on-surface' : 'text-on-surface-variant/60'}`}
                          >
                            {st.label}
                          </span>
                          <span className="text-[10px] text-on-surface-variant hidden md:block leading-tight">
                            {st.desc}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Items List */}
                <div className="bg-surface-container/60 p-4 rounded-xl space-y-2 border border-outline-variant/10">
                  <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant block mb-1 font-semibold">
                    Pieces in Commission
                  </span>
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs text-on-surface">
                      <span className="font-medium">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="font-mono">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                  {order.paymentGateway && (
                    <div className="pt-2 border-t border-outline-variant/10 flex justify-between text-[11px] text-primary/80 font-mono">
                      <span>Gateway: {order.paymentGateway}</span>
                      <span>
                        Est. Delivery: {order.estimatedDelivery || 'In 4-6 business days'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. TAB 2: PAYMENT HISTORY AUDIT */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center pb-2 border-b border-outline-variant/10">
            <div>
              <h3 className="font-display text-xl text-on-surface">Payment History</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                All financial transactions and authorization references associated with{' '}
                <span className="text-primary font-mono">{user?.email}</span>.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
              <CreditCard className="w-4 h-4" />
              <span>SSL 256-Bit Verified</span>
            </div>
          </div>

          {!user?.paymentHistory || user.paymentHistory.length === 0 ? (
            <div className="text-center py-16 bg-surface-container-low rounded-2xl border border-outline-variant/10 space-y-3">
              <Receipt className="w-12 h-12 mx-auto text-on-surface-variant opacity-40" />
              <p className="font-display text-xl text-on-surface">No Payment Records Yet</p>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                Completed commissions and checkout payments will be archived here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {user.paymentHistory.map((pay, idx) => (
                <div
                  key={pay.id || idx}
                  className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm hover:border-outline-variant/40 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-headline text-base font-semibold text-on-surface">
                        {pay.order_number
                          ? `Order #${pay.order_number}`
                          : `Payment ${pay.payment_id}`}
                      </span>
                      <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-mono uppercase font-semibold rounded-full border border-emerald-500/30">
                        {pay.status || 'captured'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant font-mono">
                      <span>Ref: {pay.payment_id}</span>
                      <span>Gateway: {pay.gateway || 'Razorpay'}</span>
                      <span>
                        Date:{' '}
                        {pay.created_at
                          ? new Date(pay.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Recent'}
                      </span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="font-headline text-lg font-bold text-primary">
                      ₹{pay.amount}
                    </span>
                    <span className="text-[11px] text-on-surface-variant block font-mono">
                      {pay.currency || 'INR'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. TAB 3: SAVED ADDRESSES */}
      {activeTab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-display text-xl text-on-surface">Your Shipping Destinations</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Saved destination addresses linked to{' '}
                <span className="text-primary font-mono">{user?.email}</span>.
              </p>
            </div>
            <button
              onClick={handleOpenNewAddressModal}
              className="px-4 py-2 bg-primary text-on-primary font-label text-xs uppercase tracking-widest rounded-lg flex items-center gap-2 hover:bg-primary-fixed transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Address</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {user?.addresses?.map((addr) => (
              <div
                key={addr.id}
                className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/20 space-y-4 relative shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-headline text-base font-semibold text-on-surface">
                      {addr.name}
                    </span>
                    {addr.isDefault && (
                      <span className="ml-2 px-2 py-0.5 bg-primary/20 text-primary text-[10px] uppercase font-semibold rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEditAddressModal(addr)}
                      className="p-1 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                      title="Edit Address"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {user.addresses.length > 1 && (
                      <button
                        onClick={() => deleteAddress(addr.id)}
                        className="p-1 text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                        title="Delete Address"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {addr.street}
                  <br />
                  {addr.city}, {addr.state} {addr.postalCode}
                  <br />
                  {addr.country}
                </p>

                {addr.phone && (
                  <p className="text-xs text-on-surface-variant/80 font-mono">Tel: {addr.phone}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. TAB 4: PROFILE & SECURITY */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Profile Details Editor */}
          <div className="lg:col-span-7 bg-surface-container-low p-6 md:p-8 rounded-2xl border border-outline-variant/20 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-outline-variant/10">
              <h3 className="font-display text-xl text-on-surface">Patron Profile Settings</h3>
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="text-xs font-label uppercase tracking-widest text-primary hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditingProfile ? 'Cancel' : 'Edit Details'}</span>
              </button>
            </div>

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="space-y-1">
                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block">
                  Registered Email (Compulsory & Account Key)
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="ghost-input w-full py-2 text-sm text-on-background/70 font-mono bg-surface-container/50 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block">
                  Full Name
                </label>
                <input
                  type="text"
                  disabled={!isEditingProfile}
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="ghost-input w-full py-2 text-sm text-on-background disabled:opacity-75"
                />
              </div>

              <div className="space-y-1">
                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block">
                  Phone / WhatsApp Contact
                </label>
                <input
                  type="text"
                  disabled={!isEditingProfile}
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="ghost-input w-full py-2 text-sm text-on-background disabled:opacity-75 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block">
                  Patron Bio / Aesthetic Preference
                </label>
                <textarea
                  rows={2}
                  disabled={!isEditingProfile}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  placeholder="e.g. Passionate about botanical floral art and sustainable slow fashion."
                  className="ghost-input w-full py-2 text-sm text-on-background disabled:opacity-75 resize-none"
                />
              </div>

              {isEditingProfile && (
                <div className="pt-2 flex gap-3">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-primary text-on-primary font-label text-xs uppercase tracking-widest rounded font-semibold cursor-pointer"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-6 py-2.5 bg-surface-container text-on-surface font-label text-xs uppercase tracking-widest rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Right: Cloud Sync & Security Center */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/20 space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                <Globe className="w-4 h-4" />
                <span>Supabase Database & Cloud Sync</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Your profile, orders, addresses, and payment transaction logs are bound to your
                email and stored with 256-bit encryption.
              </p>
              <div className="bg-surface-container p-3 rounded-lg flex items-center justify-between text-xs font-mono">
                <span className="text-on-surface-variant">Associated Email:</span>
                <span className="text-primary font-semibold">{user?.email}</span>
              </div>
              <div className="bg-surface-container p-3 rounded-lg flex items-center justify-between text-xs font-mono">
                <span className="text-on-surface-variant">Database Sync:</span>
                <span className="text-emerald-300">Live (Schema v3)</span>
              </div>
            </div>

            {/* Session Security Logs */}
            <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/20 space-y-3">
              <div className="flex items-center gap-2 text-primary text-sm font-semibold">
                <Key className="w-4 h-4" />
                <span>Active Device Sessions</span>
              </div>
              <div className="space-y-2 text-xs">
                {user?.sessionLogs?.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-surface-container rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <span className="text-on-surface font-medium block">{log.device}</span>
                      <span className="text-[10px] text-on-surface-variant">{log.time}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-semibold">
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB 5: WISHLIST */}
      {activeTab === 'wishlist' && (
        <div>
          {wishlist.length === 0 ? (
            <div className="text-center py-16 bg-surface-container-low rounded-2xl border border-outline-variant/10 space-y-4">
              <Heart className="w-12 h-12 mx-auto text-on-surface-variant opacity-40" />
              <p className="font-display text-xl text-on-surface">Your Curated Wishlist is Empty</p>
              <p className="text-xs text-on-surface-variant">
                Save pieces by clicking the heart icon on any creation.
              </p>
              <button
                onClick={onNavigateToShop}
                className="px-6 py-2.5 bg-surface-container-high text-xs font-label uppercase tracking-widest text-primary border border-primary/30 rounded-lg cursor-pointer"
              >
                Browse Creations
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlist.map((item) => (
                <div
                  key={item.id}
                  className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 flex flex-col justify-between space-y-4 shadow"
                >
                  <div className="flex gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 rounded-xl object-cover bg-surface-variant shrink-0"
                    />
                    <div>
                      <h4 className="font-headline text-base text-on-surface">{item.name}</h4>
                      <p className="font-headline text-sm text-primary font-bold mt-1">
                        ₹{item.price}
                      </p>
                      <p className="text-[11px] text-on-surface-variant line-clamp-1 mt-1">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-outline-variant/10">
                    <button
                      onClick={() => addToCart(item, 1)}
                      className="flex-1 py-2 bg-on-background hover:bg-primary-fixed text-background hover:text-on-primary-fixed text-xs font-label uppercase tracking-wider rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Add to Bag</span>
                    </button>
                    <button
                      onClick={() => toggleWishlist(item)}
                      className="px-3 py-2 bg-surface-container-high hover:bg-error/20 text-on-surface-variant hover:text-error text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 8. TAB 6: VIP CLUB & REWARDS */}
      {activeTab === 'perks' && (
        <div className="space-y-8">
          <div className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/20 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-label uppercase tracking-widest text-primary font-semibold">
                  Patron Tier Status
                </span>
                <h3 className="font-display text-2xl text-on-surface mt-0.5">
                  {user?.tier || 'Knotkari Master Patron'}
                </h3>
              </div>
              <span className="font-mono text-base font-bold text-primary">
                {user?.rewardPoints || 1240} / 2000 pts to Guild Legend
              </span>
            </div>

            <div className="w-full bg-surface-container rounded-full h-3 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-1000"
                style={{ width: '62%' }}
              />
            </div>

            <p className="text-xs text-on-surface-variant">
              Earn 2 points for every ₹100 spent on handcrafted orders. Unlock complimentary
              botanical commissions at 2,000 points.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/20 space-y-4">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Your Active Privilege Vouchers</span>
              </div>
              <div className="space-y-3">
                {[
                  {
                    code: 'ATELIER10',
                    desc: '10% privilege discount on handcrafted orders',
                    min: 'No min',
                  },
                  { code: 'LUXE15', desc: '15% off luxury commissions above ₹100', min: '₹100' },
                  { code: 'SLOWCRAFT20', desc: '20% off custom bouquet commissions', min: '₹150' },
                ].map((v, i) => (
                  <div
                    key={i}
                    className="p-3 bg-surface-container rounded-xl flex justify-between items-center border border-outline-variant/10"
                  >
                    <div>
                      <span className="font-mono text-sm font-bold text-primary block">
                        {v.code}
                      </span>
                      <span className="text-[11px] text-on-surface-variant">{v.desc}</span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(v.code);
                        addToast(`Coupon code ${v.code} copied!`, 'success');
                      }}
                      className="px-3 py-1 bg-surface-container-high hover:bg-primary hover:text-on-primary text-xs rounded transition-colors cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/20 space-y-4">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <Share2 className="w-4 h-4" />
                <span>Invite Discerning Friends</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Gift your friends ₹50 off their first KNOTKARI acquisition. You will receive 300 VIP
                reward points upon their completed order.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`https://knotkari.atelier/invite?ref=${user?.email || 'patron'}`}
                  className="ghost-input flex-grow py-2 text-xs text-on-surface font-mono"
                />
                <button
                  onClick={handleCopyReferral}
                  className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-label uppercase tracking-widest font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT ADDRESS */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fade-in">
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="font-display text-xl text-on-surface">
              {editingAddressId ? 'Edit Address' : 'Add New Shipping Address'}
            </h3>

            <form onSubmit={handleAddressSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block">
                    Recipient Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.name}
                    onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                    className="ghost-input w-full py-2 text-sm text-on-background"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block">
                    Phone Contact <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="ghost-input w-full py-2 text-sm text-on-background font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block">
                  Street Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.street}
                  onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                  className="ghost-input w-full py-2 text-sm text-on-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block">
                    City <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="ghost-input w-full py-2 text-sm text-on-background"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block">
                    State / Region <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="ghost-input w-full py-2 text-sm text-on-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block">
                    PIN / Postal Code <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.postalCode}
                    onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                    className="ghost-input w-full py-2 text-sm text-on-background font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block">
                    Country
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.country}
                    onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                    className="ghost-input w-full py-2 text-sm text-on-background"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-5 py-2.5 bg-surface-container text-on-surface font-label text-xs uppercase tracking-widest rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary text-on-primary font-label text-xs uppercase tracking-widest rounded-lg font-semibold cursor-pointer"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
