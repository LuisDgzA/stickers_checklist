# Guía de Configuración — Album Checklist

> Versión: 1.0
> Fecha: 2026-04-26

---

## Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** v20 o superior (`node -v`)
- **npm** v10 o superior (`npm -v`)
- Una cuenta en [Supabase](https://supabase.com) (plan gratuito funciona)
- Una cuenta en [Google Cloud Console](https://console.cloud.google.com) para configurar OAuth
- Una cuenta en [Vercel](https://vercel.com) (opcional, para despliegue en producción)
- Git

---

## 1. Clonar o Crear el Proyecto

Si estás empezando desde cero, el proyecto ya fue inicializado con:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --yes
npm install @supabase/supabase-js @supabase/ssr react-qr-code qrcode
```

Si estás clonando un repositorio existente:

```bash
git clone <url-del-repositorio>
cd stickers_checklist
npm install
```

---

## 2. Variables de Entorno

Crea el archivo `.env.local` en la raíz del proyecto (nunca lo subas al repositorio):

```bash
cp .env.local.example .env.local
```

Edita `.env.local` con tus valores reales:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Estos valores los obtienes del dashboard de Supabase en **Settings → API**.

---

## 3. Configuración de Supabase

### 3.1 Crear un nuevo proyecto

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta.
2. Crea un nuevo proyecto (elige región más cercana: `us-east-1` para LATAM).
3. Anota la URL del proyecto y la `anon key` (Settings → API).

### 3.2 Ejecutar el esquema inicial

En el dashboard de Supabase, abre el **SQL Editor** y ejecuta el contenido de:

```
supabase/migrations/001_initial_schema.sql
```

Esto crea todas las tablas: `profiles`, `collections`, `sections`, `groups`, `countries`, `stickers`, `user_stickers`, `share_links`, y el trigger para auto-crear perfiles.

### 3.3 Aplicar políticas RLS

Aún en el SQL Editor, ejecuta:

```
supabase/policies.sql
```

Esto habilita Row Level Security en todas las tablas y crea las políticas de acceso.

### 3.4 Cargar datos semilla (seed)

Para cargar los datos del Mundial 2026 (colección, grupos, 36 países, 740 estampas), ejecuta:

```
supabase/seed.sql
```

Puedes verificar que los datos se cargaron correctamente con:

```sql
SELECT COUNT(*) FROM public.stickers;  -- Debería retornar 740
SELECT COUNT(*) FROM public.countries; -- Debería retornar 36
SELECT COUNT(*) FROM public.groups;    -- Debería retornar 12
```

---

## 4. Configuración de Google OAuth

### 4.1 Crear credenciales en Google Cloud Console

1. Ve a [console.cloud.google.com](https://console.cloud.google.com).
2. Crea un proyecto nuevo o selecciona uno existente.
3. Navega a **APIs & Services → Credentials**.
4. Crea credenciales de tipo **OAuth 2.0 Client ID**.
5. Tipo de aplicación: **Web application**.
6. Agrega los URIs de redirección autorizados:
   - Para desarrollo: `https://<tu-proyecto>.supabase.co/auth/v1/callback`
   - Para producción (Vercel): `https://<tu-proyecto>.supabase.co/auth/v1/callback`
   
   Nota: El callback va siempre a Supabase, no a tu app directamente.

7. Copia el **Client ID** y el **Client Secret**.

### 4.2 Configurar en Supabase

1. En el dashboard de Supabase, ve a **Authentication → Providers**.
2. Activa **Google**.
3. Ingresa el **Client ID** y **Client Secret** de Google Cloud Console.
4. En **Redirect URLs** agrega:
   - `http://localhost:3000/auth/callback` (para desarrollo)
   - `https://<tu-dominio-vercel>.vercel.app/auth/callback` (para producción)

---

## 5. Ejecutar Localmente

Con `.env.local` configurado y Supabase listo:

```bash
npm run dev
```

La app estará disponible en [http://localhost:3000](http://localhost:3000).

Para verificar que todo funciona:
1. Ve a `http://localhost:3000` → debe mostrar la lista de colecciones.
2. Haz clic en "Iniciar sesión" → debe ir a `/login`.
3. Haz clic en "Continuar con Google" → debe redirigir al OAuth de Google.
4. Tras autenticarte → debe redirigir a `/` con tu email visible en el navbar.
5. Haz clic en "Mundial 2026" → debe cargar el álbum con 36 países y 740 estampas.

---

## 6. Verificación de Tipos TypeScript

```bash
npx tsc --noEmit
```

No debe haber errores de tipo en ningún archivo del proyecto.

---

## 7. Build de Producción (Local)

Para verificar que el build funciona antes de desplegar:

```bash
npm run build
npm run start
```

La app estará disponible en [http://localhost:3000](http://localhost:3000) en modo producción.

---

## 8. Despliegue en Vercel

### 8.1 Instalar Vercel CLI (opcional)

```bash
npm i -g vercel
vercel login
vercel
```

O simplemente:
1. Push tu código a GitHub.
2. Ve a [vercel.com](https://vercel.com) → **Add New Project**.
3. Importa el repositorio de GitHub.

### 8.2 Configurar variables de entorno en Vercel

En el dashboard de Vercel → tu proyecto → **Settings → Environment Variables**, agrega:

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` |
| `NEXT_PUBLIC_APP_URL` | `https://tu-app.vercel.app` |

### 8.3 Actualizar Redirect URLs en Supabase

Después de obtener la URL de producción de Vercel (`https://tu-app.vercel.app`):

1. En Supabase → **Authentication → URL Configuration**.
2. En **Redirect URLs**, agrega: `https://tu-app.vercel.app/auth/callback`.
3. Actualiza `NEXT_PUBLIC_APP_URL` en Vercel a esa URL.

### 8.4 Redesplegar

Si ya tenías un deployment anterior, haz redeploy para que tome las nuevas variables:

```bash
vercel --prod
```

---

## 9. Comandos Útiles

```bash
# Desarrollo
npm run dev

# Verificar TypeScript
npx tsc --noEmit

# Lint
npm run lint

# Build de producción
npm run build

# Iniciar en producción
npm run start
```

---

## 10. Nota sobre Cloudflare (Opcional)

Si en el futuro quieres migrar de Vercel a Cloudflare Pages:

1. Instala el adaptador: `npm install @cloudflare/next-on-pages`
2. Agrega al `next.config.ts`: `experimental: { runtime: 'edge' }`
3. Despliega con: `npx @cloudflare/next-on-pages`
4. Configura las variables de entorno en el dashboard de Cloudflare Workers → Settings.
5. Actualiza `NEXT_PUBLIC_APP_URL` a tu dominio de Cloudflare Pages.
6. Actualiza los Redirect URLs en Supabase y Google Cloud Console.

Cloudflare Pages ofrece CDN global con mejor latencia en LATAM comparado con Vercel, pero requiere el runtime `edge` que tiene algunas limitaciones (no soporta ciertos módulos de Node.js).

---

## 11. Estructura de Archivos del Proyecto

```
stickers_checklist/
├── app/
│   ├── album/
│   │   └── [collectionSlug]/
│   │       ├── AlbumClient.tsx   ← Componente cliente interactivo
│   │       └── page.tsx          ← Servidor: fetch de datos
│   ├── auth/
│   │   ├── callback/route.ts    ← Intercambio de código OAuth
│   │   ├── google/route.ts      ← Inicio de flujo OAuth
│   │   └── signout/route.ts     ← Cierre de sesión
│   ├── login/page.tsx
│   ├── share/
│   │   └── [token]/
│   │       ├── MatchClient.tsx  ← Visualización de intercambio
│   │       └── page.tsx         ← Servidor: validación de token
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                 ← Home: lista de colecciones
├── components/
│   ├── album/
│   │   ├── CountryCard.tsx
│   │   ├── FilterBar.tsx
│   │   ├── GroupNav.tsx
│   │   └── StickerCard.tsx
│   ├── progress/
│   │   └── StatsBar.tsx
│   ├── share/
│   │   └── ShareModal.tsx
│   └── ui/
│       ├── Badge.tsx
│       ├── Modal.tsx
│       └── ProgressBar.tsx
├── docs/
│   ├── arquitectura.md
│   ├── historias-usuario.md
│   └── setup.md
├── lib/
│   ├── collections.ts           ← Queries de catálogo
│   ├── progress.ts              ← Cálculos de progreso y filtros
│   ├── share.ts                 ← Lógica de enlaces y match
│   ├── stickers.ts              ← Update de cantidades
│   └── supabase/
│       ├── client.ts            ← Cliente para browser
│       ├── middleware.ts        ← Cliente para middleware
│       └── server.ts            ← Cliente para servidor
├── middleware.ts                ← Protección de rutas
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   ├── policies.sql
│   └── seed.sql
├── types/
│   ├── album.ts                 ← Tipos de dominio
│   └── database.ts              ← Tipos de BD generados
├── .env.local.example
├── .env.local                   ← NO subir al repo
├── next.config.ts
├── package.json
└── tsconfig.json
```
