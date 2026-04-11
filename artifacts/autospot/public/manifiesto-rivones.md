# AUTOSPOT — Manifiesto Técnico y de Producto

## Plataforma Premium de Renta de Autos en México
### rentamerapido.autos

---

## RESUMEN EJECUTIVO

Rivones es una plataforma de renta de autos entre personas (peer-to-peer) diseñada y construida desde cero para el mercado mexicano. Inspirada en la experiencia de Airbnb y Turo, con una estética chrome/cyan premium y 100% en español mexicano. Incluye marketplace de autos, mapa interactivo, planificador de rutas, sistema de afiliados para negocios locales, pagos con Stripe, autenticación empresarial, correos transaccionales con dominio propio, y funcionalidad PWA instalable.

---

## MÉTRICAS DEL PROYECTO

| Concepto | Cantidad |
|---|---|
| Líneas de código | 21,539 |
| Archivos fuente (.tsx, .ts, .css) | 184 |
| Componentes React | 63 |
| Páginas / vistas | 21 |
| Rutas API (backend) | 13 |
| Tablas en base de datos | 12 |
| Archivos de esquema DB | 7 |
| Dependencias de producción | 17 |
| Dependencias de desarrollo | 71 |
| Secretos / claves configurados | 13 |
| Registros DNS configurados | 8 |
| Integraciones externas | 6 |
| Tests E2E verificados | 10 páginas |

---

## INFRAESTRUCTURA Y SEGURIDAD

### 13 Secretos y Claves Configurados

| # | Clave | Propósito |
|---|---|---|
| 1 | `CLERK_PUBLISHABLE_KEY` | Autenticación — clave pública (desarrollo) |
| 2 | `CLERK_SECRET_KEY` | Autenticación — clave privada (desarrollo) |
| 3 | `CLERK_LIVE_PUBLISHABLE_KEY` | Autenticación — clave pública (producción) |
| 4 | `CLERK_LIVE_SECRET_KEY` | Autenticación — clave privada (producción) |
| 5 | `VITE_CLERK_PUBLISHABLE_KEY` | Autenticación — frontend (desarrollo) |
| 6 | `VITE_CLERK_LIVE_PUBLISHABLE_KEY` | Autenticación — frontend (producción) |
| 7 | `GOOGLE_MAPS_API_KEY` | Google Maps — servidor |
| 8 | `VITE_GOOGLE_MAPS_API_KEY` | Google Maps — frontend |
| 9 | `RESEND_API_KEY` | Correos transaccionales |
| 10 | `SESSION_SECRET` | Encriptación de sesiones |
| 11 | `DEFAULT_OBJECT_STORAGE_BUCKET_ID` | Almacenamiento de imágenes |
| 12 | `PRIVATE_OBJECT_DIR` | Directorio privado de archivos |
| 13 | `PUBLIC_OBJECT_SEARCH_PATHS` | Rutas de búsqueda pública |

**Seguridad adicional:**
- Detección automática de hostname: en `rentamerapido.autos` usa claves LIVE, en cualquier otro dominio usa claves TEST
- Rate limiting en endpoints de email (60s por dirección)
- Deduplicación en memoria para evitar envíos duplicados
- Stripe usa `capture_method: "manual"` para depósitos (hold sin cobrar)

### 8 Registros DNS Configurados

**Clerk — Autenticación (5 CNAMEs):**

| # | Subdominio | Tipo | Propósito |
|---|---|---|---|
| 1 | `clerk.rentamerapido.autos` | CNAME | Portal de autenticación |
| 2 | `clk._domainkey.rentamerapido.autos` | CNAME | Firma DKIM #1 |
| 3 | `clk2._domainkey.rentamerapido.autos` | CNAME | Firma DKIM #2 |
| 4 | `accounts.rentamerapido.autos` | CNAME | Gestión de cuentas |
| 5 | `clkmail.rentamerapido.autos` | CNAME | Correos de Clerk |

**Resend — Correos Transaccionales (3 registros):**

| # | Tipo | Propósito |
|---|---|---|
| 6 | TXT (DKIM) | Firma digital de correos desde `hola@rentamerapido.autos` |
| 7 | MX | Enrutamiento de correos entrantes |
| 8 | TXT (SPF) | Autorización de servidores de envío |

---

## 6 INTEGRACIONES EXTERNAS

### 1. Stripe — Pagos y Depósitos
- Procesamiento de pagos con tarjeta
- Sistema de depósito en garantía (hold sin cobro inmediato)
- Intent de pago con `capture_method: "manual"`
- Flujo completo de checkout

### 2. Clerk — Autenticación Empresarial
- Registro e inicio de sesión con email/contraseña
- Verificación de email con OTP
- Switching automático de claves dev/live por hostname
- Onboarding personalizado post-registro
- Apariencia personalizada con tema chrome de Rivones

### 3. Google Maps Platform — Mapas y Rutas
- **Maps JavaScript API**: Mapa interactivo con estilo personalizado Rivones
- **Directions API**: Cálculo de rutas con duración, distancia y pasos
- **Places API**: Autocompletado de direcciones
- Estilo de mapa personalizado: carreteras rosa chrome, agua azul suave
- Restricción geográfica a México (strictBounds)
- Marcadores de precio flotantes estilo Airbnb

### 4. Resend — Correos Transaccionales
- Email de bienvenida automático al completar onboarding
- Enviado desde `hola@rentamerapido.autos`
- Dominio verificado con DKIM + SPF + MX
- HTML premium con diseño chrome + gradientes

### 5. Object Storage — Almacenamiento de Imágenes
- Almacenamiento S3-compatible para fotos de autos
- Upload directo desde el formulario de publicación
- Documentos de verificación (INE, licencia)

### 6. QR Code — Códigos de Descuento
- Generación dinámica de QR para descuentos de afiliados
- Formato: `AUTOSPOT-[NOMBRE][DESCUENTO%]`
- Compartible por WhatsApp

---

## 21 PÁGINAS DE LA APLICACIÓN

### Páginas principales
| Ruta | Nombre | Descripción |
|---|---|---|
| `/` | Splash | Pantalla de carga premium con logo animado |
| `/explore` | Explorar | Feed principal con filtros por categoría y ciudad |
| `/map` | Mapa | Vista de mapa con marcadores de precio interactivos |
| `/car/:id` | Detalle de auto | Galería, especificaciones, precio, reseñas, anfitrión |
| `/booking/:carId` | Reservar | Checkout completo con datos, seguro y depósito Stripe |
| `/upload` | Publicar auto | Formulario multi-paso para anfitriones |
| `/notifications` | Avisos | Centro de notificaciones |
| `/profile` | Perfil | Dashboard con viajes, guardados y configuración |
| `/planear-ruta` | Planear ruta | Calculadora de rutas con costos de gasolina y casetas |

### Guía Rivones (Sistema de afiliados)
| Ruta | Nombre | Descripción |
|---|---|---|
| `/guia` | Guía Rivones | Directorio de negocios afiliados con descuentos |
| `/guia/registro` | Registro de negocio | Formulario de alta para negocios |

### Autenticación
| Ruta | Nombre | Descripción |
|---|---|---|
| `/sign-in` | Iniciar sesión | Login con Clerk |
| `/sign-up` | Registrarse | Registro con Clerk |
| `/onboarding` | Onboarding | Bienvenida personalizada post-registro |

### Administración
| Ruta | Nombre | Descripción |
|---|---|---|
| `/admin` | Panel admin | Dashboard con estadísticas, moderación de autos y afiliados |

### Páginas legales
| Ruta | Nombre |
|---|---|
| `/terminos` | Términos y condiciones |
| `/privacidad` | Aviso de privacidad |
| `/cancelaciones` | Política de cancelación |
| `/soporte` | Centro de ayuda |
| `/eliminar-cuenta` | Eliminar cuenta (GDPR) |

---

## 12 TABLAS EN BASE DE DATOS (PostgreSQL)

| Tabla | Campos clave | Propósito |
|---|---|---|
| `cars` | marca, modelo, año, precio, ubicación (lat/lng), categoría, specs (JSON) | Catálogo de autos |
| `bookings` | usuario, auto, fechas, precio total, estado | Reservaciones |
| `users` | clerk_id, nombre, foto, teléfono, rol | Perfiles extendidos |
| `partners` | negocio, categoría, descuento, código, ubicación, estado | Afiliados de la Guía |
| `reviews` | auto, usuario, calificación, comentario | Reseñas y calificaciones |
| `notifications` | usuario, tipo, mensaje, leído | Sistema de avisos |
| `documents` | usuario, tipo (INE/licencia), URL, verificado | Documentos de verificación |
| + 5 tablas auxiliares | relaciones, índices, configuración | Soporte operativo |

---

## 13 ENDPOINTS API (Backend Express)

| Endpoint | Método(s) | Propósito |
|---|---|---|
| `/api/cars` | GET, POST | Listar y crear autos |
| `/api/cars/:id` | GET, PATCH | Detalle y actualización de auto |
| `/api/bookings` | GET, POST | Crear y listar reservaciones |
| `/api/users` | GET, POST, PATCH | Gestión de perfiles |
| `/api/notifications` | GET, PATCH | Avisos y marcar como leído |
| `/api/reviews` | GET, POST | Reseñas de autos |
| `/api/partners` | GET, POST | Alta y listado de afiliados |
| `/api/partners/:id/approve` | PATCH | Aprobación de afiliado (admin) |
| `/api/partners/:id/featured` | PATCH | Destacar afiliado (admin) |
| `/api/partners/:id/ad-payment` | PATCH | Registro de pago de afiliado |
| `/api/stripe` | POST | Intents de pago y depósitos |
| `/api/storage` | POST | Upload de imágenes |
| `/api/email/welcome` | POST | Correo de bienvenida |
| `/api/admin` | GET | Estadísticas del dashboard |

---

## SISTEMA DE AFILIADOS — GUÍA AUTOSPOT

### Modelo de negocio
- **Cuota mensual**: $20 USD/mes por negocio afiliado
- **Comisión por conversión**: 5% por cada consumo con código de descuento
- **Categorías**: Restaurantes, Hoteles, Gasolineras, Atracciones, Talleres

### Flujo completo
1. Negocio se registra en `/guia/registro` con datos, ubicación (Google Maps picker) y descuento propuesto
2. Registro entra como "pendiente" en el panel admin
3. Admin aprueba/rechaza desde `/admin`
4. Se genera código automático: `AUTOSPOT-[NOMBRE][%]`
5. Usuarios ven negocios en `/guia` con descuentos del 5% al 50%
6. Al tocar "Ver mi descuento" aparece QR + código
7. Usuario presenta QR en el establecimiento
8. Compartible por WhatsApp

---

## PWA — APLICACIÓN INSTALABLE

### Funcionalidades
- **Service Worker** con cache de assets estáticos e imágenes
- **Web App Manifest** completo con shortcuts
- **Banner de instalación** inteligente:
  - Detecta iOS vs Android automáticamente
  - En Android: usa el prompt nativo de Chrome
  - En iOS: muestra instrucciones paso a paso (Compartir → Agregar a pantalla de inicio)
  - Se muestra después de 5 segundos de uso
  - "Ahora no" lo oculta por 7 días
- **Meta tags iOS**: `apple-mobile-web-app-capable`, status bar styling
- **Modo standalone**: se abre como app nativa sin barra de navegador
- **Shortcuts**: Explorar autos, Planear ruta, Guía Rivones

---

## 63 COMPONENTES DE INTERFAZ

### Layout y navegación
- BottomNav con 5 tabs + indicador activo
- JoystickHub — botón flotante central con animación "crystal shine"
- MoreDrawer — menú overlay con tarjetas de cristal (glassmorphism)

### Tarjetas y contenido
- CarCard con layouts horizontal/vertical, badges (Nuevo, Oferta, Exclusivo, Top Anfitrión, Más rentado), favoritos con feedback
- CarCardSkeleton para estados de carga
- DepositHoldForm para checkout con Stripe

### Sistema de diseño
- Paleta chrome/cyan premium (`#F24263` → `#C8193A`)
- Tipografía Inter con 5 pesos
- Glassmorphism con `backdrop-blur` hasta 60px
- Sombras "elevate-1" y "elevate-2"
- Border radius consistente de 14px
- Modo oscuro completo ("deep warm charcoal")
- Animaciones con cubic-bezier personalizados

### Componentes atómicos (Shadcn/Radix)
Accordion, Alert, AlertDialog, Avatar, Badge, Breadcrumb, Button, Card, Carousel, Chart, Checkbox, Dialog, Drawer, Empty, Form, Input, InputOTP, Label, Pagination, Popover, Progress, RadioGroup, Select, Sheet, Slider, Spinner, Switch, Table, Tabs, Textarea, Toast, Toaster, Tooltip

### Íconos personalizados
IconFuel, IconGauge, IconTransmission, IconCar, IconHeart, IconStar, IconMap, IconRoute, IconPlus, IconMinus, IconX, IconCheck, IconCamera, IconUpload, IconFilter, y más

---

## MAPA INTERACTIVO

- Estilo de mapa personalizado Rivones (no genérico de Google)
- Carreteras en rosa chrome para branding consistente
- Agua en azul suave
- Restricción geográfica a México (no se puede salir del país)
- Zoom mínimo nivel 5
- Filtros de ciudad: CDMX, Guadalajara, Monterrey, Cancún, Puebla, Oaxaca
- Marcadores de precio flotantes tipo Airbnb (blanco → chrome al seleccionar)
- Controles de zoom +/- personalizados
- Contador de autos disponibles en tiempo real
- Barra de búsqueda por ciudad o marca

---

## PLANIFICADOR DE RUTAS

- Origen y destino con autocompletado de Google Places
- Hasta 3 paradas intermedias
- Cálculo real con Google Directions API
- Duración y distancia exactas
- Estimado de gasolina (basado en consumo promedio mexicano)
- Estimado de casetas
- Costo total del viaje
- Instrucciones paso a paso expandibles
- Polyline chrome sobre el mapa
- 6 rutas populares pre-configuradas:
  - Ciudad de México → Acapulco (~4h, 380 km)
  - Ciudad de México → Valle de Bravo (~2h, 155 km)
  - Cancún → Tulum (~2h, 130 km)
  - Guadalajara → Puerto Vallarta (~4.5h, 330 km)
  - Monterrey → Santiago (~45min, 35 km)
  - Mérida → Chichén Itzá (~1.5h, 120 km)

---

## DOMINIO Y CORREOS

- **Dominio principal**: `rentamerapido.autos`
- **Remitente de correos**: `hola@rentamerapido.autos`
- **Email de bienvenida**: HTML premium con gradientes chrome, enviado automáticamente al completar onboarding
- **Autenticación de email**: DKIM firmado + SPF autorizado + MX configurado
- **Deliverability**: Configuración anti-spam completa para máxima entrega a bandeja de entrada

---

## ROLES DE USUARIO

| Rol | Funcionalidades |
|---|---|
| **Rentador** | Explorar, buscar, reservar, favoritos, planear rutas, descuentos de la Guía |
| **Anfitrión** | Todo lo anterior + publicar autos, gestionar reservaciones, ver estadísticas |
| **Admin** | Todo lo anterior + dashboard, moderación de autos, gestión de afiliados |

---

## STACK TECNOLÓGICO

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Estilos | Tailwind CSS 4 + Radix UI |
| Backend | Express.js + TypeScript |
| Base de datos | PostgreSQL + Drizzle ORM |
| Autenticación | Clerk (OpenID Connect) |
| Pagos | Stripe (Payment Intents) |
| Mapas | Google Maps Platform |
| Correos | Resend (dominio verificado) |
| Almacenamiento | Object Storage S3-compatible |
| QR Codes | qrcode.react |
| Routing | Wouter (client-side) |
| Animaciones | Framer Motion + CSS Keyframes |
| PWA | Service Worker + Web App Manifest |
| Monorepo | pnpm Workspaces |
| Hosting | Replit Deployments |

---

## TESTING Y CALIDAD

- 10 páginas verificadas con tests end-to-end automatizados
- Páginas testeadas: Explorar, Detalle de auto, Notificaciones, Perfil, Guía, Sign-in, Sign-up, Onboarding, Mapa, Planear ruta
- 18 imágenes de autos verificadas cargando correctamente
- Cálculos de ruta verificados contra Google Directions API real
- Rate limiting y deduplicación de emails verificados

---

*Documento generado para presentación de producto.*
*Rivones — rentamerapido.autos*
