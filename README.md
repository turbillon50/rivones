# Rivones

Premium car rental marketplace for Mexico — Turo-style.

Built with React + Vite (frontend), Express 5 (API, deployable as Vercel
Function), Neon Postgres + Drizzle ORM, Clerk auth, Stripe + Stripe Connect
for host payouts, Resend for transactional email, Google Maps, Framer Motion.

For deploy step-by-step see **[DEPLOY.md](./DEPLOY.md)**.

## Brand
- **Domain**: configurable via env (`CORS_ALLOWED_DOMAIN`, `PLATFORM_BASE_URL`, `VITE_PRODUCTION_HOST`)
- **Colors**: Deep navy (#0f1629), Cyan (#00d4ff), Chrome silver
- **Language**: Spanish (Mexico market)

## Stack
- pnpm monorepo, TypeScript 5.9, Node 24
- React 19 + Vite 7 + Tailwind 4 + shadcn/ui + Framer Motion
- Express 5 + Drizzle ORM + PostgreSQL
- Clerk (auth) · Stripe + Stripe Connect (payments + host payouts) · Resend (email)
- OpenAPI 3.1 → Orval-generated React Query client + Zod schemas
- PWA (manifest + service worker)

## Architecture

```
artifacts/
  api-server/      Express 5 API (Clerk JWT auth, Stripe webhook, helmet, rate-limit)
  autospot/        React + Vite frontend
  mockup-sandbox/  Static design playground
lib/
  api-spec/        OpenAPI source + Orval config
  api-client-react/ Generated React Query hooks (do not edit)
  api-zod/         Generated Zod schemas (do not edit)
  db/              Drizzle schema + Postgres client
  object-storage-web/ Presigned-URL upload helpers
scripts/           Seed + migration scripts
```

## Local setup

1. **Install deps** (Node 24 + pnpm 9):
   ```bash
   pnpm install
   ```
2. **Copy env**: `cp .env.example .env` and fill in:
   - `DATABASE_URL` (a Postgres 14+ URL)
   - `CLERK_SECRET_KEY` + `VITE_CLERK_PUBLISHABLE_KEY` from a Clerk app
   - `STRIPE_SECRET_KEY` + `VITE_STRIPE_PUBLISHABLE_KEY` from Stripe (test mode)
   - `STRIPE_WEBHOOK_SECRET` (run `stripe listen --forward-to localhost:3000/api/stripe/webhook` to get one)
   - `RESEND_API_KEY` (optional — email is silently skipped without it)
   - `ADMIN_API_KEY` (any string; required to access /admin)
3. **Provision DB schema + seed data**:
   ```bash
   pnpm --filter @workspace/db run push
   pnpm --filter @workspace/scripts run seed-autospot
   ```
4. **Run dev**:
   ```bash
   # API on :3000
   pnpm --filter @workspace/api-server run dev
   # Frontend on :5173
   pnpm --filter @workspace/autospot run dev
   ```

The frontend proxies `/api/*` to the API server.

## Pages

| Route | Description |
|---|---|
| `/explore` | Search + filter rentals |
| `/map` | Map browse with price pins |
| `/car/:id` | Car detail with availability calendar + reviews |
| `/booking/:carId` | Quote → pay (Stripe Elements) → confirm |
| `/booking/:id/chat` | Renter ↔ host messaging |
| `/booking/:id/pickup`, `/return` | Trip lifecycle inspections |
| `/booking/:id/review` | Bidirectional review submission |
| `/host/calendar/:carId` | Host blocks vacation days |
| `/upload` | Publish a car (KYC-gated) |
| `/kyc` | License + INE upload |
| `/profile` | Trips, hosted bookings, Stripe Connect, account |
| `/admin` | Operations dashboard (admin role gated) |
| `/guia` | Affiliate partner directory |
| `/terminos`, `/privacidad`, `/cancelaciones`, `/soporte` | Legal |

## Codegen

The OpenAPI spec lives in `lib/api-spec/openapi.yaml`. Regenerate the React
Query hooks and Zod schemas after changes with:

```bash
pnpm --filter @workspace/api-spec run codegen
```

## Commands

```bash
pnpm run typecheck   # tsc --build (libs) + per-package typecheck
pnpm run build       # typecheck + recursive build
pnpm test            # vitest in api-server (where present)
```

## Security model

- **Auth**: every mutating API call requires a Clerk JWT (`requireAuth`).
- **Admin**: `requireAdmin` accepts either a Clerk user with `publicMetadata.role = "admin"` OR `x-admin-key: $ADMIN_API_KEY`. Legacy literal `"autos"` only works when `ADMIN_API_KEY` is unset (logs a warning).
- **Storage**: uploads (`/api/storage/uploads/request-url`) require auth, validate MIME (jpg/png/webp/heic/pdf), and cap at 8 MB. Private objects are ACL-gated via `canAccessObjectEntity`.
- **Rate limit**: 240 req/min per IP on `/api/*` (configurable). Booking creation is further capped at 6/min/IP.
- **Helmet** + **CORS allow-list** (`*.rentamerapido.autos`, `*.vercel.app`, configurable extras).
- **Stripe webhook** signature verified with `STRIPE_WEBHOOK_SECRET` before any DB writes.

## Payment flow

1. Renter requests a quote (`POST /api/bookings/quote`) — checks availability + computes price from server-side source of truth.
2. Renter confirms → `POST /api/bookings` creates a row with `status: pending` and `rentalPaymentStatus: pending`.
3. Frontend creates a payment intent (`POST /api/stripe/create-payment-intent`). When the host has Stripe Connect enabled, `transfer_data.destination` is set so funds split automatically.
4. Renter pays in Stripe Elements → Stripe sends `payment_intent.succeeded` → webhook flips booking to `confirmed` and emails both parties.
5. Optional: deposit hold (`/create-deposit-hold`) is a separate `capture_method=manual` PI; release on completion or capture for damages.
6. Trip lifecycle: pickup inspection → `status=active`. Return inspection → `status=completed` and either auto-release the deposit or capture for damages.

## Mexico-specific

- Aviso de Privacidad LFPDPPP at `/privacidad` with ARCO rights.
- Términos at `/terminos` (edad 21+, licencia vigente, prohibiciones uber/fuera de país, cobertura).
- Política de cancelaciones (flexible / moderada / estricta) at `/cancelaciones`.
- All pricing in MXN; Stripe charges in centavos.
- KYC: license for renters, INE/passport for hosts. Stored in object storage with ACL.
- Cookie banner blocks analytics by default per LFPDPPP.

## Deployment

Both artifacts deploy to **Vercel** as separate projects:

- **autospot** (frontend) — Root `artifacts/autospot`, Vite SPA output.
- **api-server** (backend) — Root `artifacts/api-server`, exposed as a single
  Vercel Function (`api/index.ts` re-exports the Express `app`). Migrations
  run lazily on cold start.

Database is **Neon** Postgres (use the pooled connection string).

The full step-by-step is in **[DEPLOY.md](./DEPLOY.md)**.

## Known gaps to close before public launch

- [ ] Insurance integration (HDI/Qualitas/AXA). Today the renter's Plus toggle is collected but the underlying coverage is the host's policy.
- [ ] CFDI 4.0 invoicing (Facturama or Konvex).
- [ ] SMS notifications (Twilio).
- [ ] Background screening for hosts.
- [ ] Native iOS/Android apps.
