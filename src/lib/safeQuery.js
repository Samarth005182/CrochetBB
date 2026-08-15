/**
 * Centralized Supabase query wrapper.
 * Eliminates silent catch-and-swallow patterns across the app.
 *
 * Usage:
 *   import { safeQuery } from '../lib/safeQuery';
 *   const result = await safeQuery(
 *     () => supabase.from('products').select('*'),
 *     { context: 'fetch products', fallback: FALLBACK_PRODUCTS }
 *   );
 *   if (result.error) { /* handle *\/ }
 *   return result.data;
 */

import { useToast } from '../context/ToastContext';

/**
 * Runs a Supabase query_fn (an async function returning { data, error })
 * with consistent error handling and optional fallback.
 *
 * @param {() => Promise<{data: any, error: any}>} queryFn
 * @param {object} opts
 * @param {string} opts.context        Short label for logs/toasts.
 * @param {any}    [opts.fallback]     Returned when error or empty result.
 * @param {boolean} [opts.silentToast] Skip showing error toast.
 * @param {(e: any, ctx: string) => void} [opts.onError]
 * @returns {Promise<{data: any, error: any, usedFallback: boolean}>}
 */
export async function safeQuery(queryFn, opts = {}) {
  const {
    context = 'supabase-query',
    fallback = null,
    silentToast = false,
    onError,
    allowEmpty = false,
  } = opts;

  try {
    const { data, error } = await queryFn();

    if (error) {
      console.warn(`[safeQuery:${context}]`, error.message || error);
      if (onError) onError(error, context);
      return { data: fallback, error, usedFallback: fallback !== null };
    }

    if (!allowEmpty && (data == null || (Array.isArray(data) && data.length === 0))) {
      console.info(`[safeQuery:${context}] empty result, using fallback`);
      return { data: fallback, error: null, usedFallback: fallback !== null };
    }

    return { data, error: null, usedFallback: false };
  } catch (err) {
    console.warn(`[safeQuery:${context}] threw:`, err);
    if (onError) onError(err, context);
    return { data: fallback, error: err, usedFallback: fallback !== null };
  }
}

/**
 * Hook-friendly variant that auto-surfaces a toast on error.
 * Must be called from within a ToastProvider tree.
 */
export function makeSafeQueryWithToast(addToast) {
  return async (queryFn, opts = {}) => {
    return safeQuery(queryFn, {
      ...opts,
      onError: (e, ctx) => {
        if (!opts.silentToast) {
          addToast(`Atelier link issue (${ctx}). Retrying with cached data.`, 'error');
        }
        if (opts.onError) opts.onError(e, ctx);
      },
    });
  };
}
