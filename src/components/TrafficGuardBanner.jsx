import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { ShieldCheck, Zap, Server, Activity, ChevronDown, ChevronUp } from 'lucide-react';

export function TrafficGuardBanner() {
  const { isSurgeModeEnabled, setIsSurgeModeEnabled } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <aside aria-label="Security and Traffic Status" className="w-full bg-surface-container-lowest border-b border-outline-variant/10 text-on-surface-variant text-xs py-1.5 px-4 z-40 transition-all duration-300">
      <div className="max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-primary">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="font-semibold uppercase tracking-widest text-[10px]">Atelier DDoS & Surge Shield</span>
          </div>
          <span className="hidden sm:inline text-outline-variant">•</span>
          <div className="flex items-center gap-1.5 text-on-surface-variant">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Edge Mitigation Active (L7 Rate-Limit: 15 req/s)</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSurgeModeEnabled(!isSurgeModeEnabled)}
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] uppercase font-semibold tracking-wider transition-colors duration-200 ${
              isSurgeModeEnabled
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-surface-container-high text-on-surface-variant border border-outline-variant/20 hover:text-on-surface'
            }`}
            title="Toggle simulated limited-edition drop surge traffic waiting room"
          >
            <Zap className="w-3 h-3" />
            <span>Surge Mode: {isSurgeModeEnabled ? 'ACTIVE (Drop Mode)' : 'Normal'}</span>
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface text-[10px] uppercase tracking-wider"
          >
            <span>Specs</span>
            {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="max-w-container-max mx-auto mt-2 pt-2 border-t border-outline-variant/10 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-on-surface-variant/80">
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>Anti-Bot PoW Challenge & Honeypot active on forms</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>Circuit Breaker: Automatic fallback with exponential backoff</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>Cloudflare Edge Turnstile & Token Bucket limiter armed</span>
          </div>
        </div>
      )}
    </aside>
  );
}
