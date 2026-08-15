/**
 * Client-Side Rate Limiter, Anti-Bot & DDoS Protection Engine
 * Luxe Craft Atelier Resilience Layer
 */

class TokenBucketRateLimiter {
  constructor(bucketSize = 10, refillRatePerSec = 2) {
    this.capacity = bucketSize;
    this.tokens = bucketSize;
    this.refillRate = refillRatePerSec;
    this.lastRefill = Date.now();
    this.cooldownExpiry = 0;
  }

  refill() {
    const now = Date.now();
    const elapsedTime = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsedTime * this.refillRate);
    this.lastRefill = now;
  }

  /**
   * Try to consume a token. Returns { allowed: boolean, remainingTokens: number, retryAfterSec?: number }
   */
  consume(cost = 1) {
    const now = Date.now();
    if (now < this.cooldownExpiry) {
      return {
        allowed: false,
        remainingTokens: 0,
        retryAfterSec: Math.ceil((this.cooldownExpiry - now) / 1000),
        reason: "Rate limit cooldown active"
      };
    }

    this.refill();

    if (this.tokens >= cost) {
      this.tokens -= cost;
      return { allowed: true, remainingTokens: Math.floor(this.tokens) };
    } else {
      // Trigger temporary 3s cooldown to quell burst attacks
      this.cooldownExpiry = now + 3000;
      return {
        allowed: false,
        remainingTokens: 0,
        retryAfterSec: 3,
        reason: "Burst request threshold exceeded"
      };
    }
  }

  reset() {
    this.tokens = this.capacity;
    this.lastRefill = Date.now();
    this.cooldownExpiry = 0;
  }
}

// Global action limiters
export const searchLimiter = new TokenBucketRateLimiter(15, 5);
export const authLimiter = new TokenBucketRateLimiter(5, 1);
export const promoLimiter = new TokenBucketRateLimiter(6, 1);
export const checkoutLimiter = new TokenBucketRateLimiter(4, 0.5);

/**
 * Debounce helper to prevent rapid-fire keystroke events
 */
export function debounce(func, delayMs = 300) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delayMs);
  };
}

/**
 * Anti-Bot Honeypot validator
 * Bots automatically fill all input elements including hidden honeypots.
 */
export function validateHoneypot(honeypotValue) {
  if (honeypotValue && honeypotValue.trim().length > 0) {
    console.warn("[Security Guard] Bot activity detected via honeypot trap.");
    return false; // Trapped bot
  }
  return true; // Human user
}

/**
 * Lightweight Proof of Work (PoW) Challenge Generator
 * Computes a mini mathematical puzzle in browser to ensure human/legitimate browser execution during high-traffic drops.
 */
export async function solveClientProofOfWork(difficulty = 2) {
  const seed = "luxecraft_" + Math.random().toString(36).substring(2) + "_" + Date.now();
  const targetPrefix = "0".repeat(difficulty);
  
  let nonce = 0;
  const startTime = performance.now();
  
  while (true) {
    const input = `${seed}:${nonce}`;
    // Simple fast hashing simulation
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) - hash) + input.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    
    if (hex.startsWith(targetPrefix) || nonce > 50000) {
      const elapsedMs = performance.now() - startTime;
      return {
        seed,
        nonce,
        elapsedMs,
        token: `pow_valid_${btoa(seed + ':' + nonce)}`
      };
    }
    nonce++;
  }
}

/**
 * Circuit Breaker Pattern for API / Service degradation handling
 */
export class ServiceCircuitBreaker {
  constructor(failureThreshold = 3, resetTimeoutMs = 15000) {
    this.state = "CLOSED"; // "CLOSED" (normal), "OPEN" (tripped/failing), "HALF-OPEN"
    this.failureCount = 0;
    this.failureThreshold = failureThreshold;
    this.resetTimeoutMs = resetTimeoutMs;
    this.nextAttempt = 0;
  }

  recordSuccess() {
    this.failureCount = 0;
    this.state = "CLOSED";
  }

  recordFailure() {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
      this.nextAttempt = Date.now() + this.resetTimeoutMs;
      console.warn("[Circuit Breaker] High traffic / upstream errors. Circuit tripped to OPEN.");
    }
  }

  canAttempt() {
    if (this.state === "CLOSED") return true;
    if (this.state === "OPEN" && Date.now() > this.nextAttempt) {
      this.state = "HALF-OPEN";
      return true;
    }
    return false;
  }
}

export const apiCircuitBreaker = new ServiceCircuitBreaker(3, 10000);
