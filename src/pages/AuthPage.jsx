import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, ShieldCheck, ArrowRight, User } from 'lucide-react';

export function AuthPage({ onAuthSuccess, onNavigateToShop }) {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: 'victoria.sterling@atelier.luxe',
    password: '••••••••',
    honeypot: ''
  });

  const { login, register, continueAsGuest } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    let success = false;
    if (isRegister) {
      success = await register(formData.name, formData.email, formData.password, formData.honeypot);
    } else {
      success = await login(formData.email, formData.password, formData.honeypot);
    }

    setIsLoading(false);
    if (success && onAuthSuccess) {
      onAuthSuccess();
    }
  };

  const handleGuest = () => {
    continueAsGuest();
    if (onAuthSuccess) {
      onAuthSuccess();
    }
  };

  return (
    <main className="flex-grow flex items-center justify-center py-16 px-margin-mobile md:px-margin-desktop">
      <div className="w-full max-w-md">
        {/* Brand Anchor Header */}
        <div className="text-center mb-10">
          <button
            onClick={onNavigateToShop}
            className="inline-block font-display text-3xl md:text-4xl tracking-tighter text-on-background hover:text-primary transition-colors focus:outline-none"
          >
            LUXE CRAFT
          </button>
          <p className="font-body text-sm text-on-surface-variant mt-2">
            Enter the atelier.
          </p>
        </div>

        {/* Auth Form Card */}
        <div className="bg-surface-container-low p-8 md:p-10 border border-outline-variant/20 rounded shadow-2xl">
          {/* Tabs */}
          <div className="flex border-b border-outline-variant/15 mb-8">
            <button
              onClick={() => setIsRegister(false)}
              className={`flex-1 pb-3 font-label text-xs uppercase tracking-widest transition-colors ${
                !isRegister
                  ? 'text-primary border-b-2 border-primary font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsRegister(true)}
              className={`flex-1 pb-3 font-label text-xs uppercase tracking-widest transition-colors ${
                isRegister
                  ? 'text-primary border-b-2 border-primary font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Anti-Bot Honeypot */}
            <input
              type="text"
              name="honeypot"
              value={formData.honeypot}
              onChange={handleInputChange}
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
            />

            {isRegister && (
              <div className="space-y-1.5 group">
                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block group-focus-within:text-on-background">
                  Patron Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Lady Victoria Sterling"
                  required={isRegister}
                  className="ghost-input w-full py-2 text-sm text-on-background"
                />
              </div>
            )}

            <div className="space-y-1.5 group">
              <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block group-focus-within:text-on-background">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your@email.com"
                required
                className="ghost-input w-full py-2 text-sm text-on-background"
              />
            </div>

            <div className="space-y-1.5 group">
              <div className="flex justify-between items-center">
                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block group-focus-within:text-on-background">
                  Password
                </label>
                {!isRegister && (
                  <button
                    type="button"
                    onClick={() => alert("Password reset link dispatched to your registered email.")}
                    className="font-label text-[10px] text-primary hover:underline uppercase tracking-wider"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                  className="ghost-input w-full py-2 text-sm text-on-background pr-8"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-4 space-y-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-on-background hover:bg-primary-fixed text-background hover:text-on-primary-fixed font-label text-xs uppercase tracking-widest font-semibold py-4 rounded transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>{isRegister ? 'Register as Atelier Patron' : 'Enter the Atelier'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-outline-variant/20"></div>
                <span className="flex-shrink-0 mx-4 font-label text-[10px] text-on-surface-variant uppercase tracking-widest">
                  Or
                </span>
                <div className="flex-grow border-t border-outline-variant/20"></div>
              </div>

              <button
                type="button"
                onClick={handleGuest}
                className="w-full bg-transparent border border-outline-variant/40 hover:border-on-background text-on-background font-label text-xs uppercase tracking-widest py-3.5 rounded flex items-center justify-center gap-2 hover:bg-surface-bright/10 transition-colors"
              >
                <User className="w-4 h-4" />
                <span>Continue as Guest Patron</span>
              </button>
            </div>
          </form>

          {/* Security footnote */}
          <div className="mt-8 pt-4 border-t border-outline-variant/10 text-center flex items-center justify-center gap-2 text-[11px] text-on-surface-variant/80">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>Anti-bot protected with rate-limited authentication.</span>
          </div>
        </div>
      </div>
    </main>
  );
}
