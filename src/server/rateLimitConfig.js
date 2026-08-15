/**
 * Production DDoS Mitigation & High-Traffic Surge Configuration Reference
 * Luxe Craft Atelier Security Specs
 */

export const PRODUCTION_DDOS_ARCHITECTURE = {
  // 1. Cloudflare / Edge CDN Protection Rules
  edgeRules: {
    rateLimitingRule: {
      description: "Mitigate L7 HTTP Flood attacks on checkout and login endpoints",
      match: "http.request.uri.path in {\"/api/checkout\" \"/api/auth/login\" \"/api/promo/validate\"}",
      action: "challenge", // Managed Challenge (Cloudflare Turnstile)
      threshold: {
        requests: 20,
        periodSeconds: 10
      }
    },
    botManagement: {
      enableAntiBotProtection: true,
      blockKnownScrapers: true,
      challengeVerifiedAutomations: false
    },
    cachingStrategy: {
      staticAssets: "public, max-age=31536000, immutable",
      productCatalogApi: "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
    }
  },

  // 2. Nginx Reverse Proxy Rate Limiting Config Snippet
  nginxConfigSnippet: `
# Define rate limiting zones (Token bucket in shared memory)
limit_req_zone $binary_remote_addr zone=api_general:10m rate=15r/s;
limit_req_zone $binary_remote_addr zone=checkout_zone:10m rate=2r/s;
limit_req_zone $binary_remote_addr zone=auth_zone:10m rate=3r/s;

# Connection limiting per IP
limit_conn_zone $binary_remote_addr zone=addr_limit:10m;

server {
    listen 443 ssl http2;
    server_name luxecraft.atelier;

    # Limit concurrent connections per IP to 30
    limit_conn addr_limit 30;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header Content-Security-Policy "default-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com https://lh3.googleusercontent.com; img-src 'self' data: https: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self' 'unsafe-inline' 'unsafe-eval';" always;

    # Protected checkout API endpoint
    location /api/checkout {
        limit_req zone=checkout_zone burst=5 nodelay;
        proxy_pass http://upstream_backend;
    }

    # Protected auth API endpoint
    location /api/auth {
        limit_req zone=auth_zone burst=3 nodelay;
        proxy_pass http://upstream_backend;
    }
}
`,

  // 3. Node.js / Express Security & Rate Limiting Middleware Sample
  expressMiddlewareConfig: `
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

const redisClient = new Redis(process.env.REDIS_URL);

// General API rate limiter: 100 requests per 15 minutes per IP
const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
  message: { status: 429, error: "Too many requests. Please try again in a moment." }
});

// Strict checkout limiter: 5 attempts per 5 minutes per IP
const checkoutLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 429, error: "Checkout rate limit reached. Please wait 5 minutes before retrying." }
});
`
};
