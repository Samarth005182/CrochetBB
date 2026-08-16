import { createClient } from '@supabase/supabase-js';
import { PRODUCTS as FALLBACK_PRODUCTS } from '../data/products';
import { safeQuery } from './safeQuery';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://abrueeofowwpdpokdlba.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_anon_key';

// Initialize Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/** Shape-agnostic mapper: DB row -> client Product object. */
function mapProduct(item) {
  return {
    id: item.id || item.slug,
    name: item.name,
    subtitle: item.subtitle,
    price: parseFloat(item.price),
    category: item.category,
    badge: item.badge,
    aspectRatio: item.aspect_ratio || 'aspect-[4/5]',
    desktopColSpan: item.desktop_col_span || 'md:col-span-6',
    image: item.image_url || item.image,
    alt: item.alt || item.name,
    description: item.description,
    yarnType: item.yarn_type || item.yarnType,
    dimensions: item.dimensions,
    craftHours: item.craft_hours || item.craftHours,
    artisanNotes: item.artisan_notes || item.artisanNotes,
    careInstructions: item.care_instructions || item.careInstructions,
    rating: parseFloat(item.rating || 5.0),
    reviewsCount: parseInt(item.reviews_count || 0, 10),
    inStock: parseInt(item.in_stock || 10, 10),
    lowStockThreshold: parseInt(item.low_stock_threshold || 3, 10),
    featured: Boolean(item.featured),
  };
}

/**
 * Fetch all products from Supabase `products` table.
 * Falls back to local rich catalog if the table is empty or unreachable.
 */
export async function getProductsFromSupabase() {
  const { data, error } = await safeQuery(
    () => supabase.from('products').select('*').order('created_at', { ascending: false }),
    { context: 'fetch-products', fallback: FALLBACK_PRODUCTS, allowEmpty: false },
  );
  if (error && !data) {
    console.warn('[supabase] products unavailable, fallback used');
    return FALLBACK_PRODUCTS;
  }
  if (!Array.isArray(data)) return FALLBACK_PRODUCTS;
  return data.filter(Boolean).map(mapProduct);
}

/**
 * Fetch a single product by id (used by future /product/:slug route).
 */
export async function getProductByIdFromSupabase(id) {
  const { data, error } = await safeQuery(
    () => supabase.from('products').select('*').eq('id', id).limit(1).maybeSingle(),
    {
      context: 'fetch-product-single',
      fallback: FALLBACK_PRODUCTS.find((p) => p.id === id) || null,
      allowEmpty: true,
    },
  );
  if (error || !data) return null;
  return mapProduct(data);
}

/**
 * Record a new order in Supabase `orders` table.
 * Order status defaults to 'pending' under schema v2 (paid via webhook).
 */
export async function saveOrderToSupabase(orderData) {
  const { data, error } = await safeQuery(
    () =>
      supabase
        .from('orders')
        .insert([
          {
            order_number: orderData.id,
            tracking_number: orderData.trackingNumber,
            customer_name:
              orderData.shippingAddress?.name || orderData.customer_name || 'Valued Patron',
            customer_email:
              orderData.shippingAddress?.email ||
              orderData.customer_email ||
              'guest@knotkari.atelier',
            customer_phone: orderData.shippingAddress?.phone || orderData.customer_phone || null,
            shipping_address: orderData.shippingAddress || {},
            delivery_method: orderData.deliveryMethod || 'Standard Atelier Delivery',
            items: orderData.items || [],
            subtotal: orderData.subtotal || 0,
            shipping: orderData.shipping || 0,
            tax: orderData.tax || 0,
            total: orderData.total || 0,
            voucher_code: orderData.voucherCode || null,
            voucher_discount: orderData.voucherDiscount || 0,
            status: orderData.status || 'paid',
            payment_provider: orderData.paymentGateway || 'razorpay',
            payment_id: orderData.paymentId || null,
          },
        ])
        .select(),
    { context: 'save-order', fallback: null, allowEmpty: true },
  );

  if (error) {
    return { success: false, error: error.message || 'order-save-failed' };
  }
  return { success: true, data };
}

/**
 * Mark an order paid — called after Razorpay webhook success.
 * The authoritative update happens server-side via the webhook; this
 * client variant is a UX convenience for re-confirming in-session.
 */
export async function markOrderPaid(orderNumber, razorpayPaymentId) {
  const { error } = await safeQuery(
    () =>
      supabase
        .from('orders')
        .update({
          status: 'paid',
          payment_provider: 'razorpay',
          payment_id: razorpayPaymentId,
          paid_at: new Date().toISOString(),
        })
        .eq('order_number', orderNumber),
    { context: 'mark-order-paid', fallback: null, allowEmpty: true },
  );
  return { success: !error, error: error?.message };
}

/**
 * Sign Up with Supabase Auth
 */
export async function supabaseSignUp(email, password, name) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          tier: 'Gold Craftsman Patron',
        },
      },
    });

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Sign In with Supabase Auth
 */
export async function supabaseSignIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Check Supabase connection health
 */
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('count', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116') {
      return { connected: true, authenticated: false, message: error.message };
    }
    return { connected: true, authenticated: true };
  } catch (err) {
    return { connected: false, message: err.message };
  }
}
