# Luxe Craft Atelier — Developer Notes

## Available Scripts (after Phase 0 tooling)

| Command                 | Description                                  |
| ----------------------- | -------------------------------------------- |
| `npm run dev`           | Vite dev server (port 3000)                  |
| `npm run build`         | Production build                             |
| `npm run preview`       | Preview built bundle                         |
| `npm run lint`          | ESLint (flat config)                         |
| `npm run lint:fix`      | ESLint with auto-fix                         |
| `npm run format`        | Prettier write all sources                   |
| `npm run typecheck`     | TypeScript check on opt-in TS files          |
| `npm test`              | Vitest watch mode                            |
| `npm run test:run`      | Vitest single run                            |
| `npm run test:coverage`  | Vitest coverage report                       |
| `npm run prepare`       | Install husky git hooks                      |

## Code Style

- ESLint flat config (`eslint.config.js`) + Prettier (`.prettierrc`).
- Prettier and ESLint are wired together via `eslint-config-prettier`.
- `lint-staged` + `husky` run ESLint+Prettier on staged files at commit.
- TypeScript is opt-in (`allowJs: true, checkJs: false`). Migrate files
  to `.ts/.tsx` as you touch them; `npm run typecheck` verifies them.

## Testing

- Vitest + @testing-library/react + jsdom.
- Setup file: `src/test/setup.js` (cleans localStorage between tests).
- Add tests next to code or under `src/test/<name>.test.js`.

## Supabase Migrations

- Source schema: `supabase/schema.sql` (v1).
- Production schema: `supabase/schema_v2.sql` (stock, vouchers, reviews,
  subscribers, addresses, order_status enum, hardened RLS).
- Edge Functions live under `supabase/functions/<name>/`.
- Apply with the Supabase MCP `execute_sql` tool, or run:
  ```bash
  supabase db execute --file supabase/schema_v2.sql
  supabase functions deploy razorpay-create-order --no-verify-jwt
  ```
