import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { adminClient } from '../_shared/supabase.ts';
import { preflight, json, errorJson, requireEnv } from '../_shared/utils.ts';

interface EmailRequest {
  order_id: string;
}

async function sendEmailViaResend(to: string, subject: string, html: string): Promise<void> {
  const apiKey = requireEnv('RESEND_API_KEY');
  const from = requireEnv('RESEND_FROM_ADDRESS');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Resend send failed: ${res.status} ${detail}`);
  }
}

serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'POST') return errorJson('Method not allowed', 405);

  try {
    const { order_id } = (await req.json()) as EmailRequest;
    if (!order_id) return errorJson('order_id required', 400);

    const supabase = adminClient();
    const { data: order, error } = await supabase
      .from('orders')
      .select(
        'id, order_number, tracking_number, total, currency, customer_name, customer_email, items, subtotal, shipping, tax, voucher_code, voucher_discount',
      )
      .eq('id', order_id)
      .maybeSingle();
    if (error) throw error;
    if (!order) return errorJson('Order not found', 404);
    if (!order.customer_email) return errorJson('Order lacks customer email; skipping send', 400);

    const itemsHtml = (order.items ?? [])
      .map(
        (i: any) =>
          `<tr><td style="padding:6px 0">${i.quantity}x ${
            (i as any).name || (i as any).id
          }</td><td style="text-align:right">${(i.unitPrice * i.quantity).toFixed(2)} ${order.currency}</td></tr>`,
      )
      .join('');

    const html = `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#08122a;color:#d9e2ff;padding:40px 0">
      <div style="max-width:560px;margin:0 auto;background:#0a192f;border:1px solid #1a2440;border-radius:12px;overflow:hidden">
        <div style="padding:24px 32px;background:#0a192f;border-bottom:1px solid #1a2440">
          <h1 style="font-family:Georgia,serif;color:#b9c7e4;margin:0;font-size:24px">KNOTKARI Atelier</h1>
          <p style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#7a8aa8;margin:6px 0 0">Slow-Fashion Karigari Commission</p>
        </div>
        <div style="padding:32px">
          <p style="font-size:16px;line-height:1.6">Dear ${order.customer_name || 'Patron'},</p>
          <p style="font-size:14px;line-height:1.6;color:#c8c6c3">
            Your commission has been received with reverence. Master Karigar Rajeshwari will personally
            begin the slow hand-crochet process. Expect dispatch notification within 7–10 business days.
          </p>
          <table style="width:100%;margin:24px 0;border-collapse:collapse">
            <tr><td style="padding:6px 0;color:#7a8aa8">Order #</td><td style="text-align:right;font-family:monospace">${order.order_number}</td></tr>
            <tr><td style="padding:6px 0;color:#7a8aa8">Tracking</td><td style="text-align:right;font-family:monospace">${order.tracking_number}</td></tr>
            <tr><td style="padding:6px 0;color:#7a8aa8" colspan="2" style="border-top:1px solid #1a2440"></td></tr>
            ${itemsHtml}
            <tr><td style="padding:12px 0 4px;color:#7a8aa8">Subtotal</td><td style="text-align:right">${order.subtotal} ${order.currency}</td></tr>
            ${order.voucher_code ? `<tr><td style="padding:4px 0;color:#7a8aa8">Voucher ${order.voucher_code}</td><td style="text-align:right">–${order.voucher_discount} ${order.currency}</td></tr>` : ''}
            <tr><td style="padding:4px 0;color:#7a8aa8">Shipping</td><td style="text-align:right">${order.shipping} ${order.currency}</td></tr>
            <tr><td style="padding:4px 0;color:#7a8aa8">Tax</td><td style="text-align:right">${order.tax} ${order.currency}</td></tr>
            <tr><td style="padding-top:14px;color:#b9c7e4;font-weight:bold">Total</td><td style="text-align:right;color:#b9c7e4;font-weight:bold;font-size:18px">${order.total} ${order.currency}</td></tr>
          </table>
          <p style="font-size:11px;color:#7a8aa8;border-top:1px solid #1a2440;padding-top:18px;margin-top:24px">
            © ${new Date().getFullYear()} KNOTKARI Atelier. With patience, we craft.
          </p>
        </div>
      </div>
    </body></html>`;

    await sendEmailViaResend(
      order.customer_email,
      `Order Confirmed · ${order.order_number} · KNOTKARI Atelier`,
      html,
    );
    return json({ ok: true, sent_to: order.customer_email });
  } catch (e) {
    console.error('[send-order-email]', e);
    return errorJson(e.message || 'internal-error', 500);
  }
});
