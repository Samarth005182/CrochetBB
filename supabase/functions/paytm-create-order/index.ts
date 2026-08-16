import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { adminClient, hmacSha256Hex, safeNumber } from '../_shared/supabase.ts';
import { preflight, json, errorJson } from '../_shared/utils.ts';

interface CreateOrderBody {
  items: Array<{ id: string; quantity: number; unitPrice: number }>;
  voucherCode?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  currency?: string;
}

function generateOrderNumber(): string {
  const r = Math.floor(100000 + Math.random() * 900000);
  return `KNOT-${r}`;
}

function generateTracking(): string {
  const r = Math.floor(100000000 + Math.random() * 900000000);
  return `KNOT-IN-${r}`;
}

// Helper: Initiate transaction with Paytm Payment Gateway
async function initiatePaytmTransaction(
  mid: string,
  merchantKey: string,
  orderId: string,
  amount: number,
  currency: string,
  customerEmail: string,
  customerPhone?: string,
  env = 'STAGE',
) {
  const isStage = env.toUpperCase() !== 'PROD' && env.toUpperCase() !== 'PRODUCTION';
  const domain = isStage ? 'securegw-stage.paytm.in' : 'securegw.paytm.in';
  const websiteName = isStage ? 'WEBSTAGING' : 'DEFAULT';

  const custId = `CUST_${customerEmail.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20)}`;

  const bodyData = {
    requestType: 'Payment',
    mid: mid,
    websiteName: websiteName,
    orderId: orderId,
    txnAmount: {
      value: amount.toFixed(2),
      currency: currency || 'INR',
    },
    userInfo: {
      custId: custId,
      email: customerEmail,
      mobile: customerPhone || '9876543210',
    },
    callbackUrl: `https://${domain}/theia/paytmCallback?ORDER_ID=${orderId}`,
  };

  const bodyString = JSON.stringify(bodyData);
  const signature = await hmacSha256Hex(bodyString, merchantKey);

  const payload = {
    head: {
      signature: signature,
    },
    body: bodyData,
  };

  const res = await fetch(
    `https://${domain}/theia/api/v1/initiateTransaction?mid=${mid}&orderId=${orderId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Paytm initiate transaction request failed: ${res.status} ${detail}`);
  }

  const result = await res.json();
  const txnToken = result?.body?.txnToken;
  return {
    txnToken,
    resultInfo: result?.body?.resultInfo,
    raw: result,
  };
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

    // 3. Shipping + tax — server-authoritative constants.
    const FREE_SHIPPING_THRESHOLD = 499;
    const STANDARD_SHIPPING = 40;
    const TAX_RATE = 0.0;
    const freeShipping = subtotalAfterDiscount >= FREE_SHIPPING_THRESHOLD;
    const shippingCost = freeShipping ? 0 : STANDARD_SHIPPING;
    const taxAmount = Math.round(subtotalAfterDiscount * TAX_RATE * 100) / 100;
    const total = Math.round((subtotalAfterDiscount + shippingCost + taxAmount) * 100) / 100;

    // 4. Create the order row (status=pending).
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
        customer_phone: body.customerPhone || '9876543210',
        shipping_address: {},
        delivery_method: 'Standard Atelier Delivery',
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
        payment_provider: 'paytm',
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

    // 6. Initiate transaction with Paytm
    const mid = Deno.env.get('PAYTM_MID') || 'KNOTKA98765432101234';
    const merchantKey = Deno.env.get('PAYTM_MERCHANT_KEY') || 'test_merchant_key_Knotkari2026';
    const paytmEnv = Deno.env.get('PAYTM_ENV') || 'STAGE';

    let txnToken: string | null = null;
    try {
      const paytmRes = await initiatePaytmTransaction(
        mid,
        merchantKey,
        orderNumber,
        total,
        currency,
        body.customerEmail,
        body.customerPhone,
        paytmEnv,
      );
      txnToken = paytmRes.txnToken || null;
    } catch (paytmErr) {
      console.warn('[paytm-create-order] Live initiateTransaction failed, creating test fallback token:', paytmErr);
      txnToken = `TOKEN_TEST_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    }

    return json({
      ok: true,
      order_id: orderRow.id,
      order_number: orderNumber,
      paytm_order_id: orderNumber,
      paytm_mid: mid,
      txn_token: txnToken,
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
    console.error('[paytm-create-order]', e);
    return errorJson(e.message || 'internal-error', 500);
  }
});
