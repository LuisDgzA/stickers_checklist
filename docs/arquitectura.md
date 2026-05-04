# Arquitectura del Sistema — Album Checklist

> Versión: 1.0
> Fecha: 2026-04-26
> Stack: Next.js 14 App Router + TypeScript + Tailwind CSS v4 + Supabase

---

## 1. Descripción General del Sistema

Album Checklist es una aplicación web progresiva para coleccionistas de estampas de álbumes de fútbol. Permite a los usuarios registrar su progreso en completar el álbum (qué estampas tienen, cuántas copias), y facilita el intercambio con otros coleccionistas mediante un sistema de enlaces compartidos con análisis de coincidencias.

El sistema está diseñado para ser multi-colección desde su base: aunque comienza con el Mundial de Fútbol 2026, la arquitectura soporta agregar nuevas colecciones (Copa América, UEFA Euro, etc.) sin cambios de código.

---

## 2. Stack Tecnológico

### Next.js 16 (App Router)
- **Por qué**: Server Components para carga de datos inicial sin waterfalls. Route Handlers para endpoints de auth. El App Router permite colocar páginas, layouts y API routes en una estructura intuitiva.
- **Versión**: 16.2.4 con React 19.
- **Patrones usados**: Server Components para fetch inicial, Client Components (`'use client'`) para interactividad, React Hooks para estado local.

### TypeScript (strict)
- **Por qué**: Tipado completo de la base de datos (`Database` interface), contratos entre componentes, y autocompletado en las queries de Supabase.
- **Configuración**: `strict: true` en `tsconfig.json`. Tipos generados manualmente en `types/database.ts`.

### Tailwind CSS v4
- **Por qué**: Utilidades CSS atómicas que permiten desarrollar UI sin salir del JSX. La v4 usa un nuevo sistema basado en `@import "tailwindcss/preflight"` y `@import "tailwindcss/utilities"` en lugar de directivas `@tailwind`.
- **Diferencia con v3**: No hay `tailwind.config.js` por defecto. Las clases personalizadas se definen en `@layer utilities` en el CSS global.

### Supabase
- **Por qué**: BaaS (Backend as a Service) que provee PostgreSQL con RLS (Row Level Security), autenticación OAuth y API REST/Realtime en una sola plataforma.
- **Auth**: Google OAuth 2.0 gestionado por Supabase. El servidor maneja el intercambio de código (`/auth/callback`).
- **SDK**: `@supabase/supabase-js` + `@supabase/ssr` para manejo correcto de cookies en Next.js App Router.
- **Cliente**: Se crean dos clientes separados: uno para Server Components (`lib/supabase/server.ts`) y otro para Client Components (`lib/supabase/client.ts`).

### react-qr-code
- **Por qué**: Librería ligera para generar QR codes en SVG en el cliente. Se usa en `ShareModal` para mostrar el QR del enlace de intercambio.

---

## 3. Diagrama de Flujo del Sistema

```
Usuario → Browser
           │
           ▼
    Next.js Middleware (middleware.ts)
    ┌─────────────────────────────────┐
    │ - Verifica sesión Supabase      │
    │ - Protege rutas /album/*        │
    │ - Redirige a /login si no auth  │
    └─────────────────────────────────┘
           │
           ▼
    App Router Pages (Server Components)
    ┌─────────────────────────────────────────────────────┐
    │ /                     → page.tsx (Home)             │
    │ /login                → login/page.tsx              │
    │ /album/[slug]         → AlbumPage (Server)          │
    │                         └→ AlbumClient (Client)    │
    │ /share/[token]        → SharePage (Server)          │
    │                         └→ MatchClient (Client)    │
    │ /auth/google          → Route Handler (POST)        │
    │ /auth/callback        → Route Handler (GET)         │
    │ /auth/signout         → Route Handler (POST)        │
    └─────────────────────────────────────────────────────┘
           │
           ▼
    Supabase Client
    ┌──────────────────────────────────────────┐
    │ Auth: signInWithOAuth, getUser, signOut  │
    │ DB:   collections, groups, countries,    │
    │       sections, stickers, user_stickers, │
    │       share_links, profiles              │
    └──────────────────────────────────────────┘
           │
           ▼
    PostgreSQL (Supabase)
    ┌─────────────────────────────────────────────────┐
    │ RLS Policies:                                   │
    │ - Catálogo: SELECT público (auth requerida)     │
    │ - user_stickers: CRUD solo propio user_id       │
    │ - share_links: SELECT por token activo          │
    │ - profiles: CRUD solo propio id                 │
    └─────────────────────────────────────────────────┘
```

---

## 4. Modelo de Datos Multi-Colección

La arquitectura de la base de datos está diseñada para soportar múltiples colecciones independientes:

```
collections (1)
  ├── groups (N)          ← Grupo A, Grupo B, ..., Grupo L
  ├── sections (N)        ← FWC Especiales, Portadas, etc.
  └── countries (N)       ← México, Argentina, Brasil...
        └── [pertenece a group]

stickers (N)
  ├── collection_id       ← FK a collections
  ├── country_id?         ← FK a countries (puede ser null)
  └── section_id?         ← FK a sections (puede ser null)

user_stickers (N)
  ├── user_id             ← FK a profiles
  ├── collection_id       ← FK a collections
  ├── sticker_id          ← FK a stickers
  └── quantity            ← 0 a 1000

share_links (N)
  ├── user_id             ← FK a profiles
  ├── collection_id       ← FK a collections
  └── token               ← UUID parcial de 16 chars
```

**Principios del modelo:**
- Una estampa pertenece a exactamente una colección.
- Una estampa puede pertenecer a un país, a una sección, o a ninguno.
- El progreso del usuario se almacena en `user_stickers` con `quantity` ≥ 0.
- Un `quantity = 0` significa "no tengo"; `quantity = 1` es "tengo una"; `quantity > 1` es "tengo duplicados".
- El constraint `UNIQUE(user_id, sticker_id)` garantiza un solo registro por estampa por usuario, usando upsert.

---

## 5. Sistema de Filtros

Los filtros operan en el cliente (sin llamadas adicionales al servidor) sobre el estado de React:

```
stickersWithQuantity (estado en AlbumClient)
         │
         ▼
  countryStickersMap (Map<countryId, StickerWithQuantity[]>)
         │
         ▼
  visibleCountries (según selectedGroupId + searchQuery)
         │
         ▼
  CountryCard (por cada país visible)
         │
         ├── filterStickers(stickers, filter)
         │     'all'      → todos
         │     'missing'  → quantity === 0
         │     'complete' → quantity >= 1
         │     'repeated' → quantity > 1
         │
         └── searchStickers(stickers, searchQuery)
               → filtra por code o name del sticker
```

**Combinación de filtros:**
Los filtros de grupo (GroupNav), búsqueda (searchQuery) y estado (FilterBar) se aplican en cascada. Los países cuyas estampas queden completamente vacías tras aplicar el filtro de estado son omitidos del render.

---

## 6. Sistema de Compartir e Intercambio

El flujo de intercambio opera en dos fases:

### Fase 1: Generación del enlace (dueño)
```
handleShare() [AlbumClient]
  → getOrCreateShareLink(userId, collectionId) [lib/share.ts]
      → SELECT share_links WHERE user_id AND collection_id AND is_active
      → Si existe: retorna el existente
      → Si no: INSERT con token = crypto.randomUUID().slice(0, 16)
  → getShareUrl(token)
      → "${NEXT_PUBLIC_APP_URL}/share/${token}"
  → Abre ShareModal con QR + URL
```

### Fase 2: Visualización del intercambio (visitante)
```
GET /share/[token] [Server Component]
  → getShareLinkByToken(token)
  → Verificar: token válido + is_active + distinto usuario
  → getUserStickersForMatch(ownerId, collectionId)
  → getUserStickersForMatch(visitorId, collectionId)
  → calcMatchResult(ownerStickers, visitorStickers)
      ownerCanGive:   owner.qty > 1 AND visitor.qty === 0
      visitorCanGive: visitor.qty > 1 AND owner.qty === 0
      possibleExchanges: min(ownerCanGive.length, visitorCanGive.length)
  → Renderiza MatchClient con resultados
```

**Seguridad del intercambio:**
- La política `user_stickers_select_for_match` permite leer las estampas de otro usuario solo si existe un `share_link` activo para ese usuario y colección.
- Esta política usa un subquery en la RLS, sin exponer endpoints adicionales.

---

## 7. Generación de QR

El QR se genera completamente en el cliente usando `react-qr-code`:

```tsx
// components/share/ShareModal.tsx
import QRCode from 'react-qr-code'

<QRCode value={shareUrl} size={180} />
```

- El componente renderiza un `<svg>` con el QR.
- El QR tiene fondo blanco (`bg-white p-4`) para ser legible.
- No requiere backend ni servicios externos.
- El `shareUrl` es la URL completa (`https://app.com/share/token`), de forma que al escanear el QR se abre directamente la página de intercambio.

---

## 8. Arquitectura Client/Server en Next.js App Router

El proyecto separa responsabilidades entre Server y Client Components:

| Archivo | Tipo | Responsabilidad |
|---|---|---|
| `app/page.tsx` | Server | Fetch de colecciones + check de auth |
| `app/login/page.tsx` | Server | Check de auth, redirige si ya autenticado |
| `app/album/[slug]/page.tsx` | Server | Fetch de toda la data del álbum |
| `app/album/[slug]/AlbumClient.tsx` | Client | Estado interactivo, filtros, updates |
| `app/share/[token]/page.tsx` | Server | Validación de token + cálculo de match |
| `app/share/[token]/MatchClient.tsx` | Client | Renderizado interactivo del match |
| `components/album/StickerCard.tsx` | Client | Clicks individuales |
| `components/album/CountryCard.tsx` | Client | Expand/collapse, filtros locales |
| `components/share/ShareModal.tsx` | Client | QR + clipboard |
| `components/ui/Modal.tsx` | Client | Keyboard listener |

**Regla general:** Los datos se cargan en el servidor (evita waterfalls y mejora SEO/LCP). La interactividad (useState, onClick, useEffect) vive en Client Components.

---

## 9. Manejo de Cookies y Sesiones (Supabase SSR)

El paquete `@supabase/ssr` adapta el SDK de Supabase para funcionar correctamente con el sistema de cookies de Next.js:

- **Server Components**: `lib/supabase/server.ts` usa `cookies()` de `next/headers` para leer y escribir cookies.
- **Client Components**: `lib/supabase/client.ts` usa `createBrowserClient` que gestiona cookies del browser automáticamente.
- **Middleware**: `lib/supabase/middleware.ts` usa `createServerClient` con las cookies del `NextRequest`, propagando cambios al `NextResponse`.

Este patrón garantiza que la sesión se refresca correctamente en cada request del servidor.

---

## 10. Consideraciones Futuras

### Despliegue en Cloudflare Pages
Si en el futuro se migra de Vercel a Cloudflare Pages, tener en cuenta:
- Next.js en Cloudflare requiere el runtime `edge` o el adaptador `@cloudflare/next-on-pages`.
- Las cookies de Supabase SSR son compatibles con el edge runtime.
- Las variables de entorno se configuran en el Dashboard de Cloudflare Workers/Pages.
- El `NEXT_PUBLIC_APP_URL` debe apuntar al dominio de Cloudflare Pages.
- Cloudflare ofrece mejor latencia global que Vercel para usuarios de América Latina.

### Realtime
Supabase Realtime puede agregarse para sincronizar cambios de `user_stickers` entre múltiples dispositivos del mismo usuario, usando `supabase.channel('user_stickers').on('postgres_changes', ...)`.

### Exportar lista de faltantes
Una funcionalidad futura podría generar un PDF o imagen con la lista de estampas faltantes, usando `jspdf` o `html2canvas`.

### Notificaciones push
Supabase + Web Push API podrían notificar al usuario cuando alguien accede a su enlace de intercambio.
