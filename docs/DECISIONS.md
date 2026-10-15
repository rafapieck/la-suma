# Decisions — La Suma

## Session log

### 2026-10-15
- **Decided:** F0 repo cleanup. Renamed `docs_week10/` to `docs/`. Kept the newer packet (`PACKET (2).md`) as `docs/PACKET.md` and removed the older copy. Fixed the mockup image link from `mockup.png` to `mockup.jpg`.
- **Decided:** F1 scaffold. Next.js 16.4 (App Router, TypeScript, Tailwind 4, ESLint) at the repo root with a `src/` folder. Home page shows "La Suma" and "Datos inventados · versión de prueba". Page language set to `es-MX`. `.gitignore` ignores `.env*` and `.env*.local`, so no secrets get committed. `npm run build` and `npm run lint` pass.
- **Note:** `npm audit` reports 5 high findings, all in ESLint dev tooling (`eslint-config-next`), not in the deployed app. Left as is; the suggested fix is a breaking downgrade.
- **Deploy #1:** live at https://la-suma-jet.vercel.app
- **Decided:** F2 Google auth and database. SQL lives in `supabase/schema.sql` (tables `commitments` and `limits` from PACKET section 10, RLS on, one policy per action limited to `user_id = auth.uid()`, and `user_id` defaults to `auth.uid()`). Only `next_due_date`, `payments_left` and `label` may be null in `commitments`, following the packet; lender, amount and frequency are required because the calendar cannot add a payment without them. Every `limits` field is nullable, so no default limit exists.
- **Decided:** Auth uses `@supabase/ssr` with Google sign-in. `src/proxy.ts` (Next 16's name for middleware) refreshes the session and sends signed-out visitors to `/`; signed-in visitors on `/` go to `/calendario`. Env vars: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (see `.env.example`). Without them the landing page says sign-in is not configured yet.
- **F2 verified (by Rafael on the live URL):** Google sign-in works, and the two-account RLS test passed (each account only sees its own rows; test rows deleted).
- **Fixes made outside the code:** added `https://la-suma-jet.vercel.app/**` to Supabase Redirect URLs, and replaced the Google client secret in Supabase (the old one caused "Unable to exchange external code").
- **Env:** `GEMINI_API_KEY` is already set in Vercel as a Secret (for F5).
- **Decided:** F3 manual add. Form at `/calendario/agregar` with lender, label (optional), amount, frequency, next due date or "No sé", payments left or "No sé". A server action validates with Zod (`src/lib/commitments/schema.ts`) and saves with `source = 'manual'`, `confirmed = true`. Rules: lender 1–60 chars, label ≤ 80, amount > 0 with at most 2 decimals, payments left a whole number ≥ 1. "No sé" saves null. Unknown form fields are dropped, so a user cannot set `user_id` or `source` themselves. Errors show in Spanish under each field and the typed values stay.
- **Decided:** amount stays required (no reply to the F2 question, so the default holds).
- **Decided:** added Vitest now (`npm test`) for the F3 schema tests; bumped `@types/node` to 22 so Vitest 5 installs.
- **Decided:** `/calendario` shows a plain list of saved payments until F4 replaces it with the quincena calendar.
- **F3 verified (by Rafael on the live URL):** a payment with "No sé" for date and payments left saves and shows "No sé"; a negative amount is rejected with "El monto debe ser mayor que 0".
- **Bug (open, fix in the test pass):** when frequency is left on "Elige una opción", the form shows "Revisa los campos marcados" but the frequency field is not marked in red.
- **Decided:** F4 calendar. `buildCalendar(commitments, today)` in `src/lib/calendar/build-calendar.ts` is pure and uses "YYYY-MM-DD" strings in UTC. Window = the quincena containing today plus the next 5 (Q1 = 1–15, Q2 = 16–end of month). Today is taken in Mexico City time. Totals are summed in cents.
- **Decided (date rules):** semanal = every 7 days. mensual = same day each month, clamped to short months (31 → Nov 30), then back to 31 when the month allows. quincenal = once per quincena on the same position (5 → 5 and 20); a month-end date stays on the 15th and the last day.
- **Decided (incomplete rules):** no date → not added to any total, counted as missing info in every quincena. Date but no payments left → assumed to keep going through the window and flagged in each quincena where it adds a payment. Payments due before the window still use up `payments_left`.
- **Decided (UI):** card like the mockup with label, total and bar per quincena (bar relative to the largest total). The banner "Este total puede estar incompleto: solo incluye lo que tú agregaste" always shows, since it is always true. A yellow chip "Falta información de N pago(s)" shows on affected rows. Below: "+ Agregar a mano", a list of payments missing data, and the full list of payments. Photo and preview buttons come with F5 and F6.
- **Next:** F5, add with photo (Gemini). Then deploy #2.
- **Tomorrow's first move:** on the live URL, add a weekly payment and a day-31 monthly payment and compare totals against the calendar. Then check the current Gemini Flash model name in the docs.
