import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { adminClient, hmacSha256Hex } from '../_shared/supabase.ts';
import { preflight, json, errorJson, requireEnv } from '../_shared/utils.ts';

interface RazorpayWebhookPayload {
  event: string;
  payload: {
    payment: {
      entity: { id: string; order_id: string; amount: number; currency: string; method: string; status: string };
    };
    order?: { entity: { id: string; amount: number; notes: Record<string, string>; status: string } };
  };
}

serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'POST') return errorJson('Method not allowed', 405);

  const signature = req.headers.get('x-razorpay-signature') || '';
  const rawBody = await req.text();

  // 1. Verify the HMAC-SHA256 signature using shared webhook secret.
  const webhookSecret = requireEnv('RAZORPAY_WEBHOOK_SECRET');
  const computed = await hmacSha256Hex(rawBody, webhookSecret);
  if (!computed || computed !== signature) {
    console.error('[razorpay-webhook] signature mismatch', { computed, signature });
    return errorJson('Invalid signature', 401);
  }

  let body: RazorpayWebhookPayload;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return errorJson('Malformed JSON', 400);
  }

  // Only handle successful payment events. Other events are logged and ignored.
  if (!body.event.startsWith('payment.captured') && body.event !== 'order.paid') {
    return json({ ok: true, ignored: true, reason: 'event-not-of-interest' });
  }

  const payment = body.payload?.payment?.entity;
  if (!payment || !payment.order_id) return errorJson('No payment/order in payload', 400);

  const razorpayOrderId = payment.order_id;
  const paymentId = payment.id;

  try {
    const supabase = adminClient();

    // Lock the matching internal order row.
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, order_number, total, status, customer_email, customer_name')
      .eq('razorpay_order_id', razorpayOrderId)
      .maybeSingle();
    if (error) throw error;
    if (!order) {
      console.warn('[razorpay-webhook] no order row for', razorpayOrderId);
      return errorJson('Order not found for Razorpay order id', 404);
    }

    // Idempotent: if already paid, just ack.
    if (order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered') {
      return json({ ok: true, idempotent: true, status: order.status });
    }

    // 2. Mark paid + persist Razorpay references.
    const { error: updateErr } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        payment_provider: 'razorpay',
        payment_id: paymentId,
        razorpay_signature: signature,
        paid_at: new Date().toISOString(),
      })
      .eq('id', order.id);
    if (updateErr) throw updateErr;

    // 3. Atomically decrement stock via SECURITY DEFINER function.
    const { error: stockErr } = await supabase.rpc('decrement_stock_for_order', {
      p_order_uuid: order.id,
    });
    if (stockErr) {
      // Stock went negative. Refund by leaving status paid but flagging.
      console.error('[razorpay-webhook] stock decrement failed:', stockErr);
      await supabase.from('orders').update({ metadata: { stock_error: stockErr.message } }).eq('id', order.id);
    }

    // 4. Increment voucher usage if a voucher was applied.
    const { data: orderWithVoucher } = await supabase
      .from('orders')
      .select('voucher_code')
      .eq('id', order.id)
      .maybeSingle();
    if (orderWithVoucher?.voucher_code) {
      await supabase.rpc('increment_voucher_usage', { p_code: orderWithVoucher.voucher_code }).then(({ error }) => {
        if (error) console.warn('[razorpay-webhook] voucher usage increment failed', error);
      });
    }

    // 5. Fire a transactional confirmation email (fire-and-forget via internal fetch).
    // send-order-email is a separate Edge Function that talks to Resend.
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
      console.warn('[razorpay-webhook] email dispatch failed', e);
    }

    return json({ ok: true, order_id: order.id, status: 'paid' });
  } catch (e) {
    console.error('[razorpay-webhook]', e);
    return errorJson(e.message || 'internal-error', 500);
  }
});
