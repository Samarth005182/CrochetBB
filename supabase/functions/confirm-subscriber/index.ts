// Fans out a subscriber's confirmation token to flip status=pending -> confirmed.
// Called from /newsletter/confirm?token=... route via Edge Function
// (status update must happen server-side; subscribers table is RLS-write-only
// by anon for inserts, not updates).

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { adminClient } from '../_shared/supabase.ts';
import { preflight, json, errorJson } from '../_shared/utils.ts';

interface ConfirmBody {
  token: string;
}

serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'POST') return errorJson('Method not allowed', 405);

  try {
    const { token } = (await req.json()) as ConfirmBody;
    if (!token || token.length < 16) return errorJson('Token required', 400);

    const supabase = adminClient();
    const { data: sub, error } = await supabase
      .from('subscribers')
      .select('email, status')
      .eq('confirm_token', token)
      .maybeSingle();
    if (error) throw error;
    if (!sub) return errorJson('Invalid or expired confirmation link', 404);

    if (sub.status === 'confirmed') return json({ ok: true, already: true, email: sub.email });

    const { error: updErr } = await supabase
      .from('subscribers')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString(), confirm_token: null })
      .eq('confirm_token', token);
    if (updErr) throw updErr;

    return json({ ok: true, confirmed: true, email: sub.email });
  } catch (e) {
    console.error('[confirm-subscriber]', e);
    return errorJson(e.message || 'internal-error', 500);
  }
});
