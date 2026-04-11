# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── autospot/           # AutoSpot car marketplace frontend (React + Vite)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## Rivones App

A premium mobile-first **car rental** platform (Turo for Mexico) in Spanish for the Mexican market. Chrome/silver/cyan premium dark navy theme. NOT a car sales app. Brand: **Rivones**. Domain: `rentamerapido.autos`.

### Brand Identity
- Logo: Chrome metallic "R" with "RIVONES" text on dark navy background
- Primary color: Cyan (#00b8d9 / #00d4ff)
- Background: Deep navy (#0f1629)
- Chrome/silver accents throughout
- Favicon: Dark navy rounded square with chrome "R"
- Logo files: `/rivones-logo.png` (original), `/rivones-logo-nobg.png` (transparent)

### Features
- Splash screen with animated Rivones chrome logo, cyan accent line, and "Renta autos en todo México" tagline
- Explore page with search, category filters (Lujo/SUV/Deportivo/etc), city pills, featured section
- Map view with Google Maps integration + price pin markers
- Car detail pages with image gallery, rental pricing (/día), booking calendar + price calculator, host info
- Booking page: multi-field form, insurance add-on, delivery option, price breakdown, terms acceptance
- Booking confirmation with success/pending status
- Upload page ("Publica tu auto") — 4-step form: vehicle info, pricing, features/photos, summary + publish
- Notifications: rental-focused (booking requests, confirmations, availability alerts, reviews)
- User profile: "Mis viajes" trips tab + license upload CTA + favorites + account settings
- Admin operations center: 7 tabs (Resumen, Autos, Reservas, Avisos, Reseñas, Socios, Exportar) with full CRUD
- Creator mode: toggles host camera button in bottom nav
- 2 seeded example rental cars in CDMX/GDL with MXN/día pricing

### Pages
- `/` — Splash screen (auto-redirects to /explore)
- `/explore` — Home/Explore with filters and featured cars
- `/map` — Map-based browsing with price pins
- `/car/:id` — Car detail page
- `/upload` — Seller car upload form
- `/notifications` — Notification center
- `/profile` — User profile (Guardados + Cuenta tabs)
- `/user` — Clerk UserProfile (security, passkeys, account management)
- `/admin` — Admin operations center (password: "autos", 7 tabs with full CRUD)
- `/guia` — Guía Rivones: affiliate travel guide with partner businesses, QR discounts, route planner CTA
- `/guia/registro` — Partner business registration form (4 steps: business info, GPS location with map, discount/pricing, owner info)

### DB Schema
- `cars` table — all car listings with specs, seller info, location, images
- `notifications` table — user notifications
- `bookings` table — rental bookings with dates, amounts, status
- `reviews` table — car reviews
- `documents` table — user documents (license uploads)
- `partners` table — Guía affiliate businesses with approval workflow, GPS location, discount info, $20 USD ad fee, 5% conversion fee

### Guía Rivones System
- Businesses register via /guia/registro with GPS location (browser geolocation + Google Maps picker)
- Submissions go to "pending" status for admin review
- Admin approves/rejects from /admin → "Socios" tab
- Approved partners show on /guia with QR discount codes
- Business model: $20 USD/month advertising fee + 5% fee per conversion
- API security: admin endpoints require `x-admin-key: autos` header; public endpoints only show approved partners without owner PII

### Seed Data
Run `pnpm --filter @workspace/scripts run seed-autospot` to reset and re-seed the database with 10 demo cars and 5 notifications.

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers
  - `health.ts` — GET /healthz
  - `cars.ts` — CRUD + favorites + stats + featured + nearby
  - `users.ts` — profile, favorites, recent
  - `notifications.ts` — list + mark read
  - `admin.ts` — stats, car management, featured/status control
- Depends on: `@workspace/db`, `@workspace/api-zod`

### `artifacts/autospot` (`@workspace/autospot`)

React + Vite frontend for Rivones car rental marketplace.

- Mobile-first, dark luxury design
- Uses `@workspace/api-client-react` hooks for all API calls
- Framer Motion animations, wouter routing
- shadcn/ui component library

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/schema/cars.ts` — car listings table
- `src/schema/notifications.ts` — notifications table

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`
