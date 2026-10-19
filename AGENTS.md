<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cloud Agent

- Install with `npm ci`. Start the app with `npm run dev` (http://localhost:3000).
- `npm test` runs Vitest. `npm run build` type-checks and builds. `npm run lint` currently fails on pre-existing issues in the entreprise screens.
- Local budget and entreprise tools work without Supabase. Leave `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` unset unless you have a real project: placeholder values turn on auth middleware and redirect every page to `/login`.
- Cloud sync uses those two variables (see `.env.example`) plus `supabase/migrations/001_budgets.sql`.
