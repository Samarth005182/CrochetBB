import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { adminClient, hmacSha256Hex } from '../_shared/supabase.ts';
import { preflight, json, errorJson, requireEnv } from '../_shared/utils.ts';

interface PaytmWebhookPayload {
  ORDERID?: string;
  orderId?: string;
  MID?: string;
  TXNID?: string;
  txnId?: string;
  TXNAMOUNT?: string | number;
  STATUS?: string;
  status?: string;
  RESPCODE?: string;
  RESPMSG?: string;
  CHECKSUMHASH?: string;
  signature?: string;
  [key: string]: any;
}

serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'POST') return errorJson('Method not allowed', 405);

  let body: PaytmWebhookPayload;
  const contentType = req.headers.get('content-type') || '';

  try {
    if (contentType.includes('application/json')) {
      body = await req.json();
    } else {
      const formText = await req.text();
      const params = new URLSearchParams(formText);
      body = {};
      for (const [key, val] of params.entries()) {
        body[key] = val;
      }
    }
  } catch (err) {
    return errorJson('Malformed payload', 400);
  }

  const orderNumber = body.ORDERID || body.orderId;
  const paymentId = body.TXNID || body.txnId || `PTM_${Date.now()}`;
  const status = (body.STATUS || body.status || '').toUpperCase();
  const respCode = body.RESPCODE || body.responseCode;

  if (!orderNumber) {
    return errorJson('Missing ORDERID in payload', 400);
  }

  // 1. Verify transaction status
  const isSuccessful = status === 'TXN_SUCCESS' || respCode === '01';
  if (!isSuccessful) {
    return json({ ok: true, ignored: true, reason: 'transaction-not-successful', status });
  }

  try {
    const supabase = adminClient();

    // Lock the matching internal order row.
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, order_number, total, status, customer_email, customer_name')
      .or(`order_number.eq.${orderNumber},id.eq.${orderNumber}`)
      .maybeSingle();

    if (error) throw error;
    if (!order) {
      console.warn('[paytm-webhook] no order row for', orderNumber);
      return errorJson('Order not found for Paytm order id', 404);
    }

    // Idempotent check: if already marked paid, just ack.
    if (order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered') {
      return json({ ok: true, idempotent: true, status: order.status });
    }

    // 2. Mark paid + persist Paytm references.
    const { error: updateErr } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        payment_provider: 'paytm',
        payment_id: paymentId,
        paid_at: new Date().toISOString(),
      })
      .eq('id', order.id);
    if (updateErr) throw updateErr;

    // 3. Atomically decrement stock via SECURITY DEFINER function.
    const { error: stockErr } = await supabase.rpc('decrement_stock_for_order', {
      p_order_uuid: order.id,
    });
    if (stockErr) {
      console.error('[paytm-webhook] stock decrement failed:', stockErr);
      await supabase.from('orders').update({ metadata: { stock_error: stockErr.message } }).eq('id', order.id);
    }

    // 4. Increment voucher usage if a voucher was applied.
    const { data: orderWithVoucher } = await supabase
      .from('orders')
      .select('voucher_code')
      .eq('id', order.id)
      .maybeSingle();
    if (orderWithVoucher?.voucher_code) {
      await supabase.rpc('increment_voucher_usage', { p_code: orderWithVoucher.voucher_code }).then(({ error: vErr }) => {
        if (vErr) console.warn('[paytm-webhook] voucher usage increment failed', vErr);
      });
    }

    // 5. Fire a transactional confirmation email.
    try {
      const emailFnUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-order-email`;
      await fetch(emailFnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({ order_id: order.id }),
      });
    } catch (e) {
      console.warn('[paytm-webhook] email dispatch failed', e);
    }

    return json({ ok: true, order_id: order.id, status: 'paid', payment_id: paymentId });
  } catch (e) {
    console.error('[paytm-webhook]', e);
    return errorJson(e.message || 'internal-error', 500);
  }
});
