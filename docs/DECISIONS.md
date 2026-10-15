# Decisions — La Suma

## Session log

### 2026-10-15
- **Decided:** F0 repo cleanup. Renamed `docs_week10/` to `docs/`. Kept the newer packet (`PACKET (2).md`) as `docs/PACKET.md` and removed the older copy. Fixed the mockup image link from `mockup.png` to `mockup.jpg`.
- **Decided:** F1 scaffold. Next.js 16.4 (App Router, TypeScript, Tailwind 4, ESLint) at the repo root with a `src/` folder. Home page shows "La Suma" and "Datos inventados · versión de prueba". Page language set to `es-MX`. `.gitignore` ignores `.env*` and `.env*.local`, so no secrets get committed. `npm run build` and `npm run lint` pass.
- **Note:** `npm audit` reports 5 high findings, all in ESLint dev tooling (`eslint-config-next`), not in the deployed app. Left as is; the suggested fix is a breaking downgrade.
- **Deploy #1:** live at https://la-suma-jet.vercel.app
- **Decided:** F2 Google auth and database. SQL lives in `supabase/schema.sql` (tables `commitments` and `limits` from PACKET section 10, RLS on, one policy per action limited to `user_id = auth.uid()`, and `user_id` defaults to `auth.uid()`). Only `next_due_date`, `payments_left` and `label` may be null in `commitments`, following the packet; lender, amount and frequency are required because the calendar cannot add a payment without them. Every `limits` field is nullable, so no default limit exists.
- **Decided:** Auth uses `@supabase/ssr` with Google sign-in. `src/proxy.ts` (Next 16's name for middleware) refreshes the session and sends signed-out visitors to `/`; signed-in visitors on `/` go to `/calendario`. Env vars: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (see `.env.example`). Without them the landing page says sign-in is not configured yet.
- **Next:** Rafael runs the SQL, sets up Google sign-in, adds the Vercel env vars and redeploys, then checks two Google accounts. After that, F3 (manual add with validation).
- **Tomorrow's first move:** confirm sign-in works on the live URL, then build the F3 form with Zod.
