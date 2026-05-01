# Deploy a producción (Vercel + Neon)

Runbook paso a paso para llevar Rivones de cero a producción. Asume que ya
tienes cuentas en Vercel, Neon, Clerk, Stripe, Resend y Name.com (o cualquier
registrar). Toda decisión sensible vive como variable de entorno en Vercel —
nada de secretos en el repo.

---

## 1. Comprar el dominio

1. En [Name.com](https://www.name.com) compra el dominio definitivo (p. ej. `tudominio.com`).
2. Por ahora **no apuntes el DNS**. Lo haremos al final, cuando los deploys
   estén verdes en URLs `*.vercel.app`.

A lo largo de este documento sustituye `tudominio.com` por el real.

---

## 2. Provisionar Neon (Postgres)

1. En [Neon](https://console.neon.tech) crea un proyecto nuevo.
2. Región: la más cercana a tus usuarios (CDMX → `aws-us-east-1` o `aws-us-east-2`).
3. Copia el **Pooled connection string** (el que termina en `-pooler.…neon.tech`)
   con el query param `?sslmode=require`. Ejemplo:
   ```
   postgresql://rivones_owner:****@ep-xxxxxxx-pooler.us-east-1.aws.neon.tech/rivones?sslmode=require
   ```
4. Guárdalo. Lo pegarás como `DATABASE_URL` en Vercel.

> El driver `pg` que usamos detecta `*.neon.tech` automáticamente y agrega TLS.
> El pool tiene `max: 1` cuando corre en serverless para no agotar conexiones.

Las migraciones corren al primer cold start (`runMigrations()` se invoca dentro
del handler de la Vercel Function la primera vez que arranca cada instancia).
No necesitas ejecutarlas a mano.

---

## 3. Configurar Clerk

1. En [Clerk](https://dashboard.clerk.com) crea **dos** instancias del mismo
   proyecto: una **Development** y otra **Production**.
2. Locale por defecto: `Spanish (Mexico)` (la app ya lo aplica vía
   `@clerk/localizations`).
3. Métodos de autenticación: email + Google + WhatsApp/SMS (a tu gusto).
4. Configura el **role en publicMetadata** para tu cuenta de admin:
   `{"role": "admin"}`. Clerk → Users → tu usuario → Public metadata.
5. Anota:
   - `CLERK_SECRET_KEY` (live → `sk_live_…`)
   - `VITE_CLERK_LIVE_PUBLISHABLE_KEY` (live → `pk_live_…`)
   - Las versiones `_test_` para preview deploys de Vercel.

---

## 4. Configurar Stripe

1. En el dashboard de Stripe activa el modo **Live** y obtén:
   - `STRIPE_SECRET_KEY` (`sk_live_…`)
   - `STRIPE_PUBLISHABLE_KEY` (`pk_live_…`)
2. Activa **Stripe Connect**:
   - Settings → Connect → Onboarding → tipo `Express`, país `MX`.
   - Capabilities: `card_payments`, `transfers`.
3. **Webhook** (lo crearemos en el paso 7, cuando el API ya tenga URL).
4. Para dev local: usa las llaves `_test_` y `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

---

## 5. Configurar Resend

1. En [Resend](https://resend.com) crea una API key con scope **Sending access**.
2. Hasta que verifiques el dominio puedes usar `onboarding@resend.dev` como
   `RESEND_FROM_EMAIL`. Después, agrega DNS records (DKIM, SPF) en Name.com.

---

## 6. Crear los proyectos en Vercel

Crea **dos proyectos separados** apuntando al mismo repo de GitHub:

### Proyecto A — `rivones-web` (frontend)

| Setting | Valor |
|---|---|
| Framework Preset | Vite |
| Root Directory | `artifacts/autospot` |
| Build Command | `pnpm install && pnpm build` (defaults del `vercel.json` local) |
| Output Directory | `dist` |
| Install Command | `pnpm install` |

**Environment Variables**:

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_…       (Preview)
VITE_CLERK_LIVE_PUBLISHABLE_KEY=pk_live_…  (Production)
VITE_PRODUCTION_HOST=www.tudominio.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_…
VITE_GOOGLE_MAPS_API_KEY=AIza…
VITE_API_BASE_URL=https://api.tudominio.com
```

### Proyecto B — `rivones-api` (backend)

| Setting | Valor |
|---|---|
| Framework Preset | Other |
| Root Directory | `artifacts/api-server` |
| Build Command | (vacío — Vercel transpila `api/index.ts` automáticamente) |
| Output Directory | (vacío) |
| Install Command | `cd ../.. && pnpm install --frozen-lockfile` |
| Node.js Version | 22.x |

**Environment Variables**:

```
DATABASE_URL=postgresql://…neon.tech/rivones?sslmode=require
CLERK_SECRET_KEY=sk_live_…
CLERK_PUBLISHABLE_KEY=pk_live_…
ADMIN_API_KEY=<una-clave-aleatoria-larga>
CORS_ALLOWED_DOMAIN=tudominio.com
PLATFORM_BASE_URL=https://www.tudominio.com
RATE_LIMIT_PER_MINUTE=240
RESEND_API_KEY=re_…
RESEND_FROM_EMAIL=Rivones <hola@tudominio.com>
STRIPE_SECRET_KEY=sk_live_…
STRIPE_WEBHOOK_SECRET=whsec_…   (lo llenamos en el paso 7)
REQUIRE_LICENSE_VERIFIED=1       (opcional: cuando estés listo a exigirlo)
AUTO_SEED=                       (deja vacío en prod)
```

> Los preview deploys (PRs) heredan las env vars marcadas como `Preview`. Usa
> llaves de TEST de Clerk y Stripe ahí para no contaminar datos de producción.

Después de la primera build, Vercel asigna URLs como
`rivones-web-xxxx.vercel.app` y `rivones-api-xxxx.vercel.app`. Pruébalas antes
de mover el DNS.

---

## 7. Configurar el webhook de Stripe

Ya con la URL del API en Vercel, ve al dashboard de Stripe:

1. Developers → Webhooks → **Add endpoint**.
2. Endpoint URL: `https://rivones-api-xxxx.vercel.app/api/stripe/webhook`
   (luego cambias por `https://api.tudominio.com/...`).
3. Eventos a suscribir:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated` (para Stripe Connect)
4. Copia el `whsec_…` que Stripe genera y pégalo en
   `rivones-api` → Environment Variables → `STRIPE_WEBHOOK_SECRET`.
5. Redeploy del proyecto `rivones-api` (Settings → Deployments → Redeploy).
6. Verifica con Stripe → tu webhook → "Send test webhook" → debe responder 200.

---

## 8. Conectar el dominio

1. **DNS en Name.com**:
   ```
   www.tudominio.com   CNAME   cname.vercel-dns.com.
   tudominio.com       ALIAS/A 76.76.21.21          (Vercel)
   api.tudominio.com   CNAME   cname.vercel-dns.com.
   ```
2. **En Vercel**:
   - `rivones-web` → Settings → Domains → Add `tudominio.com` y `www.tudominio.com`.
   - `rivones-api` → Settings → Domains → Add `api.tudominio.com`.
3. Actualiza:
   - `rivones-web` → `VITE_API_BASE_URL=https://api.tudominio.com` y `VITE_PRODUCTION_HOST=www.tudominio.com`
   - `rivones-api` → `CORS_ALLOWED_DOMAIN=tudominio.com` y `PLATFORM_BASE_URL=https://www.tudominio.com`
   - Stripe webhook endpoint → `https://api.tudominio.com/api/stripe/webhook`
4. Redeploy de ambos proyectos.

---

## 9. Smoke test antes de anunciar

Con tarjeta de prueba (en modo test, en un preview deploy):

1. Sign up → onboarding → KYC con licencia → admin aprueba en `/admin`.
2. Host hace Stripe Connect onboarding desde `/profile`.
3. Host publica un auto y bloquea días en `/host/calendar/:id`.
4. Renter cotiza → calendario muestra días bloqueados → paga con
   `4242 4242 4242 4242`.
5. `stripe trigger payment_intent.succeeded --override "metadata.bookingId=<id>" --override "metadata.type=rental_payment"` → la reserva pasa a `confirmed`.
6. Mensajería renter↔host.
7. Pickup con fotos → estado `active`.
8. Return sin daños → estado `completed` + depósito liberado.
9. Ambos publican reseña → visibles cuando los dos publican (o tras 14 días).

En producción (modo live), repítelo con una tarjeta real propia. Anuncia
solamente después de que los 9 pasos pasen.

---

## 10. Gaps conocidos antes de tráfico real

- **Object Storage**. La implementación actual usa el sidecar GCS de Replit
  (puerto `127.0.0.1:1106`) que no existe en Vercel. Mientras no migremos a
  Vercel Blob / Cloudflare R2 / S3, las features que dependen de subir
  imágenes (KYC, fotos de inspección, fotos de auto) no funcionarán en
  producción. Plan recomendado: Vercel Blob.
- **Seguro**. El toggle "Protección Plus" cobra 18%/día pero no hay póliza
  real; documentado en `/terminos`. Integrar HDI/Qualitas antes de tráfico
  público.
- **CFDI 4.0**. Falta facturación SAT (Facturama o Konvex).
- **OpenAPI sync**. El spec en `lib/api-spec/openapi.yaml` está desactualizado
  para los endpoints nuevos (mensajería, inspecciones, Stripe Connect, etc.).
  Re-correr `pnpm --filter @workspace/api-spec run codegen` después de
  agregarlos.
- **Sentry**. Variables `SENTRY_DSN` / `VITE_SENTRY_DSN` documentadas pero
  sin `@sentry/*` instalado todavía.

---

## Apéndice: rollback rápido

- Cualquier deploy roto en Vercel → Deployments → "Promote to production" del
  deploy verde anterior.
- Migraciones siempre son aditivas (`ADD COLUMN IF NOT EXISTS`, `CREATE TABLE
  IF NOT EXISTS`). Para rollback de schema cambia el código y haz drop manual
  por separado.
- Stripe deposit holds nunca se capturan automáticamente. Si algo se
  descontrola, libera vía `POST /api/stripe/release-deposit/:bookingId` con
  `x-admin-key`.
