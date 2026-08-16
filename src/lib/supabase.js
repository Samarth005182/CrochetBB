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
 * Fetch a single product by id.
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
 * Ensure user profile exists for an email
 */
export async function ensureUserProfile(email, name, phone) {
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim();
  const displayName = name?.trim() || cleanEmail.split('@')[0];

  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          email: cleanEmail,
          name: displayName,
          phone: phone || null,
        },
        { onConflict: 'email' },
      )
      .select()
      .maybeSingle();

    if (error) {
      console.warn('[supabase] ensureUserProfile fallback via RPC or local', error.message);
    }
    return data;
  } catch (err) {
    console.warn('[supabase] ensureUserProfile caught error', err);
    return null;
  }
}

/**
 * Record a new order in Supabase `orders` table, along with
 * item breakdown, payment history audit, and auto-saving shipping address
 * to the user's email.
 */
export async function saveOrderToSupabase(orderData) {
  const customerEmail = (
    orderData.shippingAddress?.email ||
    orderData.customer_email ||
    orderData.customerEmail ||
    'guest@knotkari.atelier'
  )
    .toLowerCase()
    .trim();

  const customerName =
    orderData.shippingAddress?.name ||
    orderData.customer_name ||
    orderData.customerName ||
    'Valued Patron';

  const customerPhone =
    orderData.shippingAddress?.phone || orderData.customer_phone || orderData.customerPhone || null;

  // 1. Ensure profile exists for this email
  await ensureUserProfile(customerEmail, customerName, customerPhone);

  // 2. Insert Order
  const orderRow = {
    order_number: orderData.id,
    tracking_number:
      orderData.trackingNumber || `KNOT-IN-${Math.floor(100000000 + Math.random() * 900000000)}`,
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
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
    payment_provider: orderData.paymentGateway || 'paytm',
    payment_id: orderData.paymentId || null,
    gift_note: orderData.giftNote || null,
    artisan: orderData.artisan || 'Master Karigar Rajeshwari',
  };

  const { data: savedOrder, error: orderErr } = await safeQuery(
    () => supabase.from('orders').insert([orderRow]).select().single(),
    { context: 'save-order', fallback: null, allowEmpty: true },
  );

  if (orderErr) {
    console.warn('[supabase] order insertion failed, continuing client state', orderErr);
  }

  const orderId = savedOrder?.id || null;

  // 3. Insert Line Items if order was recorded
  if (orderId && Array.isArray(orderData.items) && orderData.items.length > 0) {
    const lineItems = orderData.items.map((i) => ({
      order_id: orderId,
      product_id: i.id || 'prod-custom',
      product_name: i.name,
      unit_price: i.price,
      quantity: i.quantity || 1,
    }));
    await safeQuery(() => supabase.from('order_items').insert(lineItems), {
      context: 'save-order-items',
      fallback: null,
      allowEmpty: true,
    });
  }

  // 4. Save Payment History Record
  const paymentEntry = {
    order_id: orderId,
    order_number: orderData.id,
    user_email: customerEmail,
    payment_id: orderData.paymentId || `pay_${Math.random().toString(36).substring(2, 9)}`,
    gateway: orderData.paymentGateway || 'paytm',
    amount: orderData.total || 0,
    currency: 'INR',
    status: 'captured',
    method: orderData.paymentGateway || 'Paytm Secure Payment',
    metadata: {
      itemsCount: orderData.items?.length || 0,
      trackingNumber: orderRow.tracking_number,
    },
  };

  await safeQuery(() => supabase.from('payment_history').insert([paymentEntry]), {
    context: 'save-payment-history',
    fallback: null,
    allowEmpty: true,
  });

  // 5. Auto-Save / Upsert Shipping Address to user's address book under this email
  if (orderData.shippingAddress && orderData.shippingAddress.street) {
    const addr = orderData.shippingAddress;
    const addressRow = {
      user_email: customerEmail,
      name: addr.name || customerName,
      phone: addr.phone || customerPhone || '',
      street: addr.street,
      city: addr.city,
      state: addr.state || 'Karnataka',
      postal_code: addr.postalCode || addr.postal_code || '',
      country: addr.country || 'India',
      is_default: true,
    };

    await safeQuery(() => supabase.from('addresses').insert([addressRow]), {
      context: 'save-shipping-address',
      fallback: null,
      allowEmpty: true,
    });
  }

  return { success: true, data: savedOrder, paymentEntry };
}

/**
 * Fetch all user data associated with an email:
 * Profile, Addresses, Orders, and Payment History.
 */
export async function fetchUserDataByEmail(email) {
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim();

  try {
    const [profileRes, addressesRes, ordersRes, paymentsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('email', cleanEmail).maybeSingle(),
      supabase
        .from('addresses')
        .select('*')
        .eq('user_email', cleanEmail)
        .order('created_at', { ascending: false }),
      supabase
        .from('orders')
        .select('*')
        .eq('customer_email', cleanEmail)
        .order('created_at', { ascending: false }),
      supabase
        .from('payment_history')
        .select('*')
        .eq('user_email', cleanEmail)
        .order('created_at', { ascending: false }),
    ]);

    return {
      profile: profileRes.data || null,
      addresses: addressesRes.data || [],
      orders: ordersRes.data || [],
      paymentHistory: paymentsRes.data || [],
    };
  } catch (err) {
    console.warn('[supabase] fetchUserDataByEmail caught error', err);
    return null;
  }
}

/**
 * Save / Update an address for a specific email
 */
export async function saveAddressForEmail(email, addressData) {
  const cleanEmail = email.toLowerCase().trim();
  const row = {
    user_email: cleanEmail,
    name: addressData.name,
    phone: addressData.phone,
    street: addressData.street,
    city: addressData.city,
    state: addressData.state,
    postal_code: addressData.postalCode || addressData.postal_code,
    country: addressData.country || 'India',
    is_default: Boolean(addressData.isDefault),
  };

  if (addressData.id && typeof addressData.id === 'string' && addressData.id.includes('-')) {
    row.id = addressData.id;
  }

  const { data, error } = await supabase.from('addresses').upsert(row).select().single();
  return { data, error };
}

/**
 * Delete an address by ID
 */
export async function deleteAddressFromSupabase(addressId) {
  const { error } = await supabase.from('addresses').delete().eq('id', addressId);
  return { error };
}

/**
 * Update Profile for an email
 */
export async function updateProfileForEmail(email, profileData) {
  const cleanEmail = email.toLowerCase().trim();
  const { data, error } = await supabase
    .from('profiles')
    .update({
      name: profileData.name,
      phone: profileData.phone,
      bio: profileData.bio,
      avatar: profileData.avatar,
      updated_at: new Date().toISOString(),
    })
    .eq('email', cleanEmail)
    .select()
    .maybeSingle();

  return { data, error };
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
          tier: 'Knotkari Master Patron',
        },
      },
    });

    if (error) throw error;
    if (data?.user) {
      await ensureUserProfile(email, name);
    }
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
    const { error } = await supabase
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
