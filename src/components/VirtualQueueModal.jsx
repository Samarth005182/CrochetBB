import React from 'react';
import { useCart } from '../context/CartContext';
import { ShieldCheck, Clock, Users, Sparkles } from 'lucide-react';

export function VirtualQueueModal() {
  const { isWaitingInQueue, queueProgress, setIsWaitingInQueue } = useCart();

  if (!isWaitingInQueue) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-xl animate-fade-in">
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-lg p-8 max-w-lg w-full text-center relative overflow-hidden shadow-2xl">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-tertiary/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Brand Header */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center p-3 bg-surface-container-high rounded-full border border-primary/20 mb-3">
            <Sparkles className="w-6 h-6 text-primary animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <p className="font-display text-2xl tracking-tighter text-on-background">LUXE CRAFT</p>
          <p className="text-xs uppercase tracking-widest text-primary font-semibold mt-1">
            Atelier Priority Waiting Room
          </p>
        </div>

        {/* Narrative & Explanations */}
        <div className="space-y-3 mb-8">
          <h2 className="text-xl font-headline text-on-surface">
            High Patron Demand in Progress
          </h2>
          <p className="text-sm font-body text-on-surface-variant leading-relaxed">
            Due to a high volume of simultaneous patrons during this limited-edition drop, we are pacing checkout entries to guarantee handcrafted inventory reservation and bank-grade security.
          </p>
        </div>

        {/* Queue Progress Bar */}
        <div className="space-y-3 mb-6 bg-surface-container p-4 rounded border border-outline-variant/10">
          <div className="flex justify-between items-center text-xs font-medium text-on-surface">
            <span className="flex items-center gap-1.5 text-on-surface-variant">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span>Queue Position: <strong className="text-on-surface">#42</strong></span>
            </span>
            <span className="flex items-center gap-1.5 text-on-surface-variant">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>Estimated Wait: <strong className="text-on-surface">~4 seconds</strong></span>
            </span>
          </div>

          <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden relative">
            <div
              className="bg-gradient-to-r from-primary via-tertiary to-primary-fixed h-full transition-all duration-500 rounded-full"
              style={{ width: `${queueProgress}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center text-[11px] text-on-surface-variant">
            <span>Verifying session integrity</span>
            <span className="font-bold text-primary">{queueProgress}% Complete</span>
          </div>
        </div>

        {/* Security badges */}
        <div className="flex items-center justify-center gap-2 text-xs text-on-surface-variant/80 mb-6">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Protected by Anti-DDoS Token Verification</span>
        </div>

        <button
          onClick={() => setIsWaitingInQueue(false)}
          className="text-xs font-label uppercase tracking-widest text-on-surface-variant hover:text-on-surface underline underline-offset-4"
        >
          Cancel and return to catalog
        </button>
      </div>
    </div>
  );
}
