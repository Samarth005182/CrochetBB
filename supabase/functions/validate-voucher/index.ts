import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { adminClient } from '../_shared/supabase.ts';
import { preflight, json, errorJson } from '../_shared/utils.ts';

interface ValidateBody {
  code: string;
  subtotal: number;
}

serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'POST') return errorJson('Method not allowed', 405);

  try {
    const body = (await req.json()) as ValidateBody;
    if (!body.code) return errorJson('Voucher code required', 400);
    if (!Number.isFinite(body.subtotal) || body.subtotal < 0) {
      return errorJson('Valid subtotal required', 400);
    }

    const supabase = adminClient();
    const { data, error } = await supabase.rpc('validate_voucher_secure', {
      p_code: body.code,
      p_subtotal: body.subtotal,
    });
    if (error) throw error;

    if (!data || data.length === 0) {
      return json({ ok: false, valid: false, reason: 'not-found-or-inactive' });
    }
    const v = data[0];
    return json({
      ok: true,
      valid: true,
      code: v.code,
      label: v.label,
      discount_pct: v.discount_pct,
      discount_amount: v.discount_amount,
      max_uses: v.max_uses,
      used_count: v.used_count,
    });
  } catch (e) {
    console.error('[validate-voucher]', e);
    return errorJson(e.message || 'internal-error', 500);
  }
});
