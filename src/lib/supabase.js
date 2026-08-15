import { createClient } from '@supabase/supabase-js';
import { PRODUCTS as FALLBACK_PRODUCTS } from '../data/products';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nagpjggmajzavpipdgoe.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_anon_key';

// Initialize Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});

/**
 * Fetch all products from Supabase `products` table.
 * Falls back to local rich catalog if database table is not yet seeded or offline.
 */
export async function getProductsFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      console.info('[Supabase] Using cached/fallback catalog dataset.');
      return FALLBACK_PRODUCTS;
    }

    return data.map((item) => ({
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
      reviewsCount: parseInt(item.reviews_count || 0),
      inStock: parseInt(item.in_stock || 10),
      featured: Boolean(item.featured)
    }));
  } catch (err) {
    console.warn('[Supabase] Fetch error, using fallback catalog:', err);
    return FALLBACK_PRODUCTS;
  }
}

/**
 * Record a new order in Supabase `orders` table.
 */
export async function saveOrderToSupabase(orderData) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          order_number: orderData.id,
          tracking_number: orderData.trackingNumber,
          customer_name: orderData.shippingAddress.name,
          customer_email: orderData.shippingAddress.email,
          shipping_address: orderData.shippingAddress,
          delivery_method: orderData.deliveryMethod,
          items: orderData.items,
          subtotal: orderData.subtotal,
          shipping: orderData.shipping,
          tax: orderData.tax,
          total: orderData.total,
          status: 'confirmed'
        }
      ])
      .select();

    if (error) {
      console.warn('[Supabase] Order insert error (table may need schema migration):', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err) {
    console.warn('[Supabase] Order save error:', err);
    return { success: false, error: err.message };
  }
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
          tier: 'Gold Craftsman Patron'
        }
      }
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
      password
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
    const { data, error } = await supabase.from('products').select('count', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116') {
      return { connected: true, authenticated: false, message: error.message };
    }
    return { connected: true, authenticated: true };
  } catch (err) {
    return { connected: false, message: err.message };
  }
}
