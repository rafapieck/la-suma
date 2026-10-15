# Decisions — La Suma

## Session log

### 2026-10-15
- **Decided:** F0 repo cleanup. Renamed `docs_week10/` to `docs/`. Kept the newer packet (`PACKET (2).md`) as `docs/PACKET.md` and removed the older copy. Fixed the mockup image link from `mockup.png` to `mockup.jpg`.
- **Decided:** F1 scaffold. Next.js 16.4 (App Router, TypeScript, Tailwind 4, ESLint) at the repo root with a `src/` folder. Home page shows "La Suma" and "Datos inventados · versión de prueba". Page language set to `es-MX`. `.gitignore` ignores `.env*` and `.env*.local`, so no secrets get committed. `npm run build` and `npm run lint` pass.
- **Note:** `npm audit` reports 5 high findings, all in ESLint dev tooling (`eslint-config-next`), not in the deployed app. Left as is; the suggested fix is a breaking downgrade.
- **Next:** Rafael imports the repo in Vercel (deploy #1). Then F2, Google auth and RLS tables in Supabase.
- **Tomorrow's first move:** confirm the Vercel URL shows the home page, then write the F2 SQL.
