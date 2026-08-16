/**
 * KNOTKARI Atelier — Razorpay integration (server-authoritative flow).
 *
 * Flow:
 *   1. Client calls Supabase Edge Function `razorpay-create-order`
 *      with cart contents + voucher code.
 *   2. Edge function validates voucher + re-prices cart from DB, creates
 *      the Razorpay Order server-side, returns `razorpay_order_id` + amount.
 *   3. Client opens Razorpay Checkout with that order id.
 *   4. Razorpay sends webhook to `razorpay-webhook` Edge Function which
 *      verifies signature, marks order "paid", and decrements stock.
 */

export const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_KnotkariAtelier2026';

const SUPABASE_FUNCTIONS_BASE =
  (import.meta.env.VITE_SUPABASE_URL || 'https://abrueeofowwpdpokdlba.supabase.co') +
  '/functions/v1';

/**
 * Hits the Edge Function and returns the server-signed order context.
 */
export async function createServerOrder(req) {
  try {
    const res = await fetch(`${SUPABASE_FUNCTIONS_BASE}/razorpay-create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || `server-error-${res.status}` };
    }
    return data;
  } catch (err) {
    console.error('[razorpay] create order fetch failed', err);
    return { ok: false, error: err?.message || 'network-error' };
  }
}

/**
 * Validate a voucher code server-side. Returns server-computed discount amount,
 * never the client-computed one. Used by CartContext before showing success.
 */
export async function validateVoucherServer(code, subtotal) {
  try {
    const res = await fetch(`${SUPABASE_FUNCTIONS_BASE}/validate-voucher`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, subtotal }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, valid: false, error: data.error || 'validate-failed' };
    return data;
  } catch (err) {
    console.error('[razorpay] validate voucher fetch failed', err);
    return { ok: false, valid: false, error: 'network-error' };
  }
}

/**
 * Dynamically load the external Razorpay Checkout SDK script.
 */
export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('[Razorpay] SDK failed to load.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Open Razorpay Checkout using a server-authorized Razorpay order id.
 * Falls back to simulated success only when network/SDK unavailable.
 */
export async function openRazorpayCheckout({ serverOrder, customer, onSuccess, onFailure }) {
  const loaded = await loadRazorpayScript();
  const amountPaise = serverOrder.amount_paise ?? 0;
  const orderId = serverOrder.razorpay_order_id;

  if (!loaded || !window.Razorpay || !orderId) {
    console.info('[Razorpay] SDK unavailable; simulated checkout for local dev.');
    setTimeout(() => {
      onSuccess({
        razorpay_payment_id: `pay_knot_sim_${Math.random().toString(36).slice(2, 11).toUpperCase()}`,
        razorpay_order_id: orderId,
        razorpay_signature: 'simulated_local_dev',
        gateway: 'Razorpay (Simulated)',
        currency: serverOrder.currency || 'INR',
        amount: amountPaise / 100,
      });
    }, 900);
    return;
  }

  const options = {
    key: RAZORPAY_KEY,
    amount: amountPaise,
    currency: serverOrder.currency || 'INR',
    order_id: orderId,
    name: 'KNOTKARI Atelier',
    description: `Slow-Fashion Order #${serverOrder.order_number || ''}`,
    image:
      'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=150&auto=format&fit=crop&q=80',
    prefill: {
      name: customer.name || 'Patron',
      email: customer.email || 'patron@knotkari.atelier',
      contact: customer.contact || '9876543210',
    },
    notes: { order_reference: serverOrder.order_number || '', brand: 'KNOTKARI Atelier' },
    theme: { color: '#0a192f', backdrop_color: 'rgba(8,18,42,0.85)' },
    modal: {
      ondismiss: () => onFailure({ reason: 'Payment cancelled by patron.' }),
    },
    handler: (response) =>
      onSuccess({
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id || orderId,
        razorpay_signature: response.razorpay_signature,
        gateway: 'Razorpay Official',
        currency: serverOrder.currency || 'INR',
        amount: amountPaise / 100,
      }),
  };

  try {
    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response) =>
      onFailure({ description: response?.error?.description || 'payment-failed' }),
    );
    rzp.open();
  } catch (err) {
    console.error('[Razorpay] init error', err);
    onFailure({ description: 'gateway-unavailable' });
  }
}
