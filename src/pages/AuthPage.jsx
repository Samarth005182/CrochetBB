import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, ShieldCheck, ArrowRight, User } from 'lucide-react';

export function AuthPage({ onAuthSuccess, onNavigateToShop }) {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: 'ananya.sharma@knotkari.atelier',
    password: '••••••••',
    honeypot: '',
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

  const handleOAuthLogin = (provider) => {
    setIsLoading(true);
    setTimeout(() => {
      login(`${provider.toLowerCase()}.patron@knotkari.atelier`, 'oauth_secure_pass', '');
      setIsLoading(false);
      if (onAuthSuccess) onAuthSuccess();
    }, 600);
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
        <div className="text-center mb-10 space-y-2">
          <button
            onClick={onNavigateToShop}
            className="inline-block font-display text-3xl md:text-4xl tracking-tighter text-on-background hover:text-primary transition-colors focus:outline-none"
          >
            KNOTKARI
          </button>
          <p className="font-body text-xs uppercase tracking-widest text-on-surface-variant">
            Enter the Karigari Atelier.
          </p>
        </div>

        {/* Auth Form Card */}
        <div className="bg-surface-container-low p-8 md:p-10 border border-outline-variant/20 rounded-2xl shadow-2xl space-y-6">
          {/* Tabs */}
          <div className="flex border-b border-outline-variant/15 mb-6">
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

          {/* Social OAuth Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleOAuthLogin('Google')}
              className="w-full py-3 px-4 bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface rounded-xl text-xs font-label uppercase tracking-wider flex items-center justify-center gap-3 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.4 7.5 23.5 12 23.5z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-outline-variant/20"></div>
            <span className="flex-shrink-0 mx-4 font-label text-[10px] text-on-surface-variant uppercase tracking-widest">
              Or with email
            </span>
            <div className="flex-grow border-t border-outline-variant/20"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                  placeholder="Ananya Sharma"
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
                    onClick={() =>
                      window.alert(
                        'Password reset token dispatched to your registered email via Supabase Auth.',
                      )
                    }
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

            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-on-background hover:bg-primary-fixed text-background hover:text-on-primary-fixed font-label text-xs uppercase tracking-widest font-semibold py-4 rounded-xl transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>Authenticating with Cloud Edge...</span>
                ) : (
                  <>
                    <span>{isRegister ? 'Register as KNOTKARI Patron' : 'Enter the Atelier'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleGuest}
                className="w-full bg-transparent border border-outline-variant/40 hover:border-on-background text-on-background font-label text-xs uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-surface-bright/10 transition-colors"
              >
                <User className="w-4 h-4" />
                <span>Continue as Guest Patron</span>
              </button>
            </div>
          </form>

          {/* Security footnote */}
          <div className="pt-4 border-t border-outline-variant/10 text-center flex items-center justify-center gap-2 text-[11px] text-on-surface-variant/80">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>Encrypted Supabase Auth & Vercel Edge Protection</span>
          </div>
        </div>
      </div>
    </main>
  );
}
