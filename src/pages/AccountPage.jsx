import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import {
  User,
  Package,
  Heart,
  MapPin,
  Sparkles,
  LogOut,
  ShoppingBag,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export function AccountPage({ onNavigateToShop, onNavigateToAuth }) {
  const { user, isAuthenticated, isGuest, logout } = useAuth();
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'wishlist' | 'addresses' | 'perks'

  if (!isAuthenticated && !isGuest) {
    return (
      <main className="flex-grow flex items-center justify-center py-20 px-4">
        <div className="bg-surface-container-low p-8 rounded border border-outline-variant/20 max-w-md text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto text-primary border border-outline-variant/20">
            <User className="w-8 h-8" />
          </div>
          <h2 className="font-display text-2xl text-on-surface">Atelier Patron Portal</h2>
          <p className="text-sm font-body text-on-surface-variant">
            Please sign in to access your order history, fabrication tracking, and member privileges.
          </p>
          <button
            onClick={onNavigateToAuth}
            className="px-8 py-3.5 bg-primary text-on-primary font-label text-xs uppercase tracking-widest font-semibold rounded hover:bg-primary-fixed transition-colors"
          >
            Sign In / Enter Atelier
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-16">
      {/* Patron Header Profile */}
      <div className="bg-surface-container-low border border-outline-variant/20 rounded-lg p-6 md:p-8 mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center text-primary font-display text-2xl border border-primary/30 shadow-inner">
            {user?.name ? user.name[0] : 'P'}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl md:text-3xl text-on-background">{user?.name || 'Guest Patron'}</h1>
              <span className="px-3 py-0.5 rounded-full text-[11px] font-label uppercase font-semibold bg-primary/20 text-primary border border-primary/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>{user?.tier || 'Atelier Patron'}</span>
              </span>
            </div>
            <p className="font-body text-xs text-on-surface-variant mt-1">
              {user?.email || 'Guest Patron Session'} • Member since {user?.joinedDate || '2026'}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 border border-outline-variant/30 hover:border-error/40 hover:text-error text-xs font-label uppercase tracking-wider rounded transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit Atelier</span>
        </button>
      </div>

      {/* Account Navigation Tabs */}
      <div className="flex border-b border-outline-variant/15 mb-8 overflow-x-auto">
        {[
          { id: 'orders', label: 'Order History', icon: Package, count: user?.orders?.length || 0 },
          { id: 'wishlist', label: 'Curated Wishlist', icon: Heart, count: wishlist.length },
          { id: 'addresses', label: 'Saved Addresses', icon: MapPin, count: user?.addresses?.length || 0 },
          { id: 'perks', label: 'Patron Privileges', icon: Sparkles }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 font-label text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
                isActive
                  ? 'text-primary border-b-2 border-primary font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="ml-1 px-1.5 py-0.2 bg-surface-container rounded-full text-[10px]">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content 1: Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {(!user?.orders || user.orders.length === 0) ? (
            <div className="text-center py-16 bg-surface-container-low rounded border border-outline-variant/10">
              <Package className="w-10 h-10 mx-auto text-on-surface-variant mb-3 opacity-40" />
              <p className="font-display text-lg text-on-surface">No Orders Yet</p>
              <p className="text-xs text-on-surface-variant mt-1">Your handcrafted acquisitions will appear here.</p>
            </div>
          ) : (
            user.orders.map((order) => (
              <div
                key={order.id}
                className="bg-surface-container-low p-6 rounded border border-outline-variant/20 space-y-4"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-outline-variant/10">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-headline text-base text-on-surface font-semibold">Order #{order.id}</span>
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-label uppercase font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">Placed on {order.date}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="font-headline text-base text-primary font-bold">${order.total.toFixed(2)}</span>
                    <p className="text-[11px] font-mono text-on-surface-variant">Tracking: {order.trackingNumber}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs text-on-surface">
                      <span>{item.quantity}x {item.name}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab Content 2: Wishlist */}
      {activeTab === 'wishlist' && (
        <div>
          {wishlist.length === 0 ? (
            <div className="text-center py-16 bg-surface-container-low rounded border border-outline-variant/10 space-y-4">
              <Heart className="w-10 h-10 mx-auto text-on-surface-variant opacity-40" />
              <p className="font-display text-lg text-on-surface">Your Curated Wishlist is Empty</p>
              <p className="text-xs text-on-surface-variant">Save pieces by clicking the heart icon on any creation.</p>
              <button
                onClick={onNavigateToShop}
                className="px-6 py-2.5 bg-surface-container-high text-xs font-label uppercase tracking-widest text-primary border border-primary/30 rounded"
              >
                Browse Creations
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlist.map((item) => (
                <div
                  key={item.id}
                  className="bg-surface-container-low p-4 rounded border border-outline-variant/20 flex flex-col justify-between space-y-4"
                >
                  <div className="flex gap-4">
                    <img src={item.image} alt={item.name} className="w-20 h-20 rounded object-cover bg-surface-variant shrink-0" />
                    <div>
                      <h4 className="font-headline text-base text-on-surface">{item.name}</h4>
                      <p className="font-headline text-sm text-primary font-semibold mt-1">${item.price}</p>
                      <p className="text-[11px] text-on-surface-variant line-clamp-1 mt-1">{item.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-outline-variant/10">
                    <button
                      onClick={() => addToCart(item, 1)}
                      className="flex-1 py-2 bg-on-background hover:bg-primary-fixed text-background hover:text-on-primary-fixed text-xs font-label uppercase tracking-wider rounded font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Add to Bag</span>
                    </button>
                    <button
                      onClick={() => toggleWishlist(item)}
                      className="px-3 py-2 bg-surface-container-high hover:bg-error/20 text-on-surface-variant hover:text-error text-xs rounded transition-colors"
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

      {/* Tab Content 3: Addresses */}
      {activeTab === 'addresses' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {user?.addresses?.map((addr) => (
            <div key={addr.id} className="bg-surface-container-low p-6 rounded border border-outline-variant/20 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-headline text-sm font-semibold text-on-surface">{addr.name}</span>
                {addr.isDefault && (
                  <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] uppercase font-semibold rounded">
                    Default
                  </span>
                )}
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {addr.street}<br />
                {addr.city}, {addr.state} {addr.postalCode}<br />
                {addr.country}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Tab Content 4: Perks & Tier Privileges */}
      {activeTab === 'perks' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: "Priority Reservation", desc: "Guaranteed 24-hour advance access to new limited-edition flower drops.", icon: Sparkles },
            { title: "Complimentary Care", desc: "Lifetime complimentary steam refreshing and yarn re-tensioning.", icon: ShieldCheck },
            { title: "VIP Privilege Code", desc: "Use code SLOWCRAFT20 for an enduring 20% discount on all custom commissions.", icon: ExternalLink }
          ].map((perk, i) => {
            const Icon = perk.icon;
            return (
              <div key={i} className="bg-surface-container-low p-6 rounded border border-outline-variant/20 space-y-3">
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="font-headline text-base text-on-surface font-semibold">{perk.title}</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">{perk.desc}</p>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
