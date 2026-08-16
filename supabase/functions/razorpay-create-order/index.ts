import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { adminClient, safeNumber } from '../_shared/supabase.ts';
import { preflight, json, errorJson, requireEnv } from '../_shared/utils.ts';

interface CreateOrderBody {
  items: Array<{ id: string; quantity: number; unitPrice: number }>;
  voucherCode?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  currency?: string;
}

// Razorpay Orders API: https://razorpay.com/docs/api/orders/
async function createRazorpayOrder(amountPaise: number, currency: string, notes: Record<string, string>) {
  const keyId = requireEnv('RAZORPAY_KEY_ID');
  const keySecret = requireEnv('RAZORPAY_KEY_SECRET');
  const basic = btoa(`${keyId}:${keySecret}`);

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency,
      payment_capture: 1,
      notes,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Razorpay order creation failed: ${res.status} ${detail}`);
  }
  return res.json();
}

function generateOrderNumber(): string {
  const r = Math.floor(100000 + Math.random() * 900000);
  return `KNOT-${r}`;
}

function generateTracking(): string {
  const r = Math.floor(100000000 + Math.random() * 900000000);
  return `KNOT-IN-${r}`;
}

serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'POST') return errorJson('Method not allowed', 405);

  try {
    const body = (await req.json()) as CreateOrderBody;
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return errorJson('Cart is empty', 400);
    }
    if (!body.customerEmail || !body.customerName) {
      return errorJson('Customer identity required', 400);
    }
    const currency = body.currency || 'INR';

    const supabase = adminClient();

    // 1. SERVER-SIDE subtotal — never trust the client. Re-read product prices.
    const { data: products, error: productErr } = await supabase
      .from('products')
      .select('id, in_stock, price')
      .in(
        'id',
        body.items.map((i) => i.id),
      );
    if (productErr) throw productErr;
    const stock = new Map((products ?? []).map((p: any) => [p.id, p]));

    let serverSubtotal = 0;
    for (const line of body.items) {
      const p = stock.get(line.id);
      if (!p) return errorJson(`Unknown product: ${line.id}`, 400);
      if (p.in_stock < line.quantity) return errorJson(`Insufficient stock: ${line.id}`, 409);
      serverSubtotal += safeNumber(p.price) * Math.max(1, Math.floor(line.quantity));
    }
    serverSubtotal = Math.round(serverSubtotal * 100) / 100;

    // 2. Apply voucher if present (use the SECURITY DEFINER function).
    let voucherDiscount = 0;
    let voucherLabel: string | null = null;
    if (body.voucherCode) {
      const { data: vch, error: vchErr } = await supabase.rpc('validate_voucher_secure', {
        p_code: body.voucherCode,
        p_subtotal: serverSubtotal,
      });
      if (vchErr) throw vchErr;
      if (vch && vch.length > 0) {
        voucherDiscount = safeNumber(vch[0].discount_amount);
        voucherLabel = vch[0].label;
      }
    }
    const subtotalAfterDiscount = Math.max(0, serverSubtotal - voucherDiscount);

    // 3. Shipping + tax — server-authoritative constants. (Mirror client; tweak as needed.)
    const FREE_SHIPPING_THRESHOLD = 150;
    const STANDARD_SHIPPING = 15;
    const TAX_RATE = 0.08;
    const freeShipping = subtotalAfterDiscount >= FREE_SHIPPING_THRESHOLD;
    const shippingCost = freeShipping ? 0 : STANDARD_SHIPPING;
    const taxAmount = Math.round(subtotalAfterDiscount * TAX_RATE * 100) / 100;
    const total = Math.round((subtotalAfterDiscount + shippingCost + taxAmount) * 100) / 100;

    // 4. Create the order row (status=pending). Razorpay order ID attached afterwards.
    const orderNumber = generateOrderNumber();
    const trackingNumber = generateTracking();
    const amountPaise = Math.round(total * 100);

    const { data: orderRow, error: insertErr } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        tracking_number: trackingNumber,
        customer_name: body.customerName,
        customer_email: body.customerEmail,
        customer_phone: body.customerPhone,
        shipping_address: {},
        delivery_method: 'standard',
        items: body.items.map((i) => ({
          id: i.id,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        subtotal: serverSubtotal,
        shipping: shippingCost,
        tax: taxAmount,
        total,
        status: 'pending',
        currency,
        voucher_code: body.voucherCode || null,
        voucher_discount: voucherDiscount,
      })
      .select('id')
      .single();
    if (insertErr) throw insertErr;

    // 5. Create order_items rows for downstream stock decrement.
    await supabase.from('order_items').insert(
      body.items.map((i) => ({
        order_id: orderRow.id,
        product_id: i.id,
        unit_price: safeNumber(stock.get(i.id)?.price, 0),
        quantity: i.quantity,
      })),
    );

    // 6. Create the Razorpay order referencing our internal order.
    const razorpayOrder = await createRazorpayOrder(amountPaise, currency, {
      order_reference: orderNumber,
      brand: 'KNOTKARI Luxury Crochet Atelier',
      craft: 'Handcrafted Heritage Karigari',
    });

    await supabase
      .from('orders')
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq('id', orderRow.id);

    return json({
      ok: true,
      order_id: orderRow.id,
      order_number: orderNumber,
      razorpay_order_id: razorpayOrder.id,
      amount_paise: amountPaise,
      currency,
      subtotal: serverSubtotal,
      voucher_code: body.voucherCode || null,
      voucher_label: voucherLabel,
      voucher_discount: voucherDiscount,
      shipping: shippingCost,
      tax: taxAmount,
      total,
    });
  } catch (e) {
    console.error('[razorpay-create-order]', e);
    return errorJson(e.message || 'internal-error', 500);
  }
});
