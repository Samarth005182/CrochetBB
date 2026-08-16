// Admin Supabase client — uses SUPABASE_SERVICE_ROLE_KEY so it bypasses RLS.
// NEVER ship the service role key to the browser.

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { requireEnv } from './utils.ts';

export function adminClient(): SupabaseClient {
  return createClient(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

// Cheap per-request rate limiter using the `rate_limit_counters` table.
// Edge Functions have no native counters, but we can use a Postgres upsert.
export async function rateLimit(client: SupabaseClient, bucketKey: string, max: number): Promise<boolean> {
  const minute = new Date();
  minute.setSeconds(0, 0);

  // Atomic increment + read inside one call:
  const { data, error } = await client.rpc('increment_rate_limit_counter', {
    p_bucket: bucketKey,
    p_minute: minute.toISOString(),
  });
  if (error) return true; // Fail-open: missing function shouldn't block legitimate traffic.
  return (data ?? 0) <= max;
}

// Helper: SHA256 HMAC signature for webhook / transaction verification.
export async function hmacSha256Hex(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function safeNumber(n: unknown, fallback = NaN): number {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}
