import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TokenBucketRateLimiter, debounce, validateHoneypot } from '../utils/rateLimiter';

describe('TokenBucketRateLimiter', () => {
  let limiter;
  beforeEach(() => {
    limiter = new TokenBucketRateLimiter(3, 1); // capacity 3, 1 token/sec
  });

  it('allows consumption up to capacity without refill', () => {
    expect(limiter.consume(1).allowed).toBe(true);
    expect(limiter.consume(1).allowed).toBe(true);
    expect(limiter.consume(1).allowed).toBe(true);
    // 4th should trip (burst cooldown 3s)
    const blocked = limiter.consume(1);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBe(3);
  });

  it('refills tokens over time', () => {
    expect(limiter.consume(3).allowed).toBe(true); // drain bucket
    const blocked = limiter.consume(1);
    expect(blocked.allowed).toBe(false);
    // simulate ~1.1s of refill AND clear the burst cooldown
    limiter.cooldownExpiry = 0;
    limiter.lastRefill = Date.now() - 1100;
    const refilled = limiter.consume(1);
    expect(refilled.allowed).toBe(true);
  });

  it('exposes cooldown window', () => {
    limiter.consume(3);
    const blocked = limiter.consume(1);
    expect(blocked).toHaveProperty('retryAfterSec');
  });

  it('resets cleanly', () => {
    limiter.consume(3);
    limiter.reset();
    expect(limiter.consume(1).allowed).toBe(true);
  });
});

describe('validateHoneypot', () => {
  it('passes for empty value (human)', () => {
    expect(validateHoneypot('')).toBe(true);
    expect(validateHoneypot('   ')).toBe(true);
  });

  it('fails for non-empty value (bot trap)', () => {
    expect(validateHoneypot('spam-me')).toBe(false);
    expect(validateHoneypot('auto-filled')).toBe(false);
  });
});

describe('debounce', () => {
  it('invokes once after delay', async () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 30);
    debounced();
    debounced();
    await new Promise((r) => setTimeout(r, 60));
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
