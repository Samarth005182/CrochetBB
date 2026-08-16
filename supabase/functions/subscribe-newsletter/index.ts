import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { adminClient } from '../_shared/supabase.ts';
import { preflight, json, errorJson, requireEnv } from '../_shared/utils.ts';

interface SubscribeBody {
  email: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

function randomToken(): string {
  return crypto.randomUUID().replace(/-/g, '') + Math.random().toString(36).slice(2);
}

async function sendConfirmationEmail(email: string, confirmToken: string) {
  const apiKey = requireEnv('RESEND_API_KEY');
  const from = requireEnv('RESEND_FROM_ADDRESS');
  const siteBaseUrl = Deno.env.get('SITE_BASE_URL') || 'https://luxecraft.example';

  const confirmUrl = `${siteBaseUrl}/newsletter/confirm?token=${confirmToken}`;
  const html = `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#08122a;color:#d9e2ff;padding:40px 0">
<div style="max-width:480px;margin:0 auto;background:#0a192f;border-radius:12px;padding:32px;border:1px solid #1a2440">
  <h1 style="font-family:Georgia,serif;color:#b9c7e4;margin:0 0 12px">Confirm Your Atelier Membership</h1>
  <p style="line-height:1.6;color:#c8c6c3">Almost woven in. Confirm your subscription to The Karigari Gazette to receive private drops, artisan journal entries, and a 15% welcome privilege.</p>
  <p style="margin:24px 0;text-align:center">
    <a href="${confirmUrl}" style="background:#b9c7e4;color:#08122a;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;letter-spacing:.05em">Confirm Subscription</a>
  </p>
  <p style="font-size:11px;color:#7a8aa8">If you didn't subscribe, you can safely ignore this email.</p>
</div>
</body></html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'Confirm your KNOTKARI Atelier subscription',
      html,
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Resend confirmation send failed: ${res.status} ${detail}`);
  }
}

serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'POST') return errorJson('Method not allowed', 405);

  try {
    const body = (await req.json()) as SubscribeBody;
    if (!body.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email)) {
      return errorJson('Valid email required', 400);
    }
    const email = body.email.toLowerCase().trim();

    const supabase = adminClient();
    const confirmToken = randomToken();

    // Upsert with status=pending ensures double opt-in even if they re-subscribe
    const { error } = await supabase
      .from('subscribers')
      .upsert(
        {
          email,
          status: 'pending',
          confirm_token: confirmToken,
          source: body.source || 'footer',
          metadata: body.metadata || {},
          subscribed_at: new Date().toISOString(),
          confirmed_at: null,
        },
        { onConflict: 'email' },
      );
    if (error) throw error;

    // Fire-and-forget confirmation email. If Resend is not configured (dev),
    // fail soft so the subscription still records.
    try {
      await sendConfirmationEmail(email, confirmToken);
      return json({ ok: true, double_opt_in: true });
    } catch (e) {
      console.warn('[subscribe-newsletter] confirmation email failed', e);
      return json({ ok: true, double_opt_in: false, note: 'Confirmation email unavailable' });
    }
  } catch (e) {
    console.error('[subscribe-newsletter]', e);
    return errorJson(e.message || 'internal-error', 500);
  }
});
