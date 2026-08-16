import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Seo } from '../lib/seo';

const FUNCTIONS_BASE =
  (import.meta.env.VITE_SUPABASE_URL || 'https://abrueeofowwpdpokdlba.supabase.co') +
  '/functions/v1';

export function NewsletterConfirmPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [state, setState] = useState('pending');

  useEffect(() => {
    if (!token) return setState('failed');
    (async () => {
      try {
        const res = await fetch(`${FUNCTIONS_BASE}/confirm-subscriber`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        setState(data?.ok ? 'verified' : 'failed');
      } catch {
        setState('failed');
      }
    })();
  }, [token]);

  return (
    <main className="max-w-md mx-auto px-6 py-28 text-center">
      <Seo title="Newsletter Confirmation" path="/newsletter/confirm" />
      {state === 'pending' && (
        <>
          <span className="material-symbols-outlined text-4xl text-primary animate-pulse mb-4">
            hourglass_empty
          </span>
          <h1 className="font-display text-3xl mb-3">Weaving you in…</h1>
          <p className="text-on-surface-variant text-sm">Confirming your Atelier membership.</p>
        </>
      )}
      {state === 'verified' && (
        <>
          <span className="material-symbols-outlined text-5xl text-primary filled mb-4">
            check_circle
          </span>
          <h1 className="font-display text-3xl mb-3">Welcome, honored patron.</h1>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            Your subscription to The Karigari Gazette is confirmed. Enjoy 15% off with code{' '}
            <span className="font-mono text-primary">SLOWCRAFT15</span>.
          </p>
        </>
      )}
      {state === 'failed' && (
        <>
          <span className="material-symbols-outlined text-5xl text-error filled mb-4">error</span>
          <h1 className="font-display text-3xl mb-3">This thread has unraveled.</h1>
          <p className="text-on-surface-variant text-sm">
            The confirmation link is invalid or expired. Please re-subscribe from the footer.
          </p>
        </>
      )}
    </main>
  );
}
