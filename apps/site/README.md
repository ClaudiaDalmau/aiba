# AI Booking · Dashboard Web (Next.js 15)

Web app pública del panel profesional, en desarrollo en paralelo a la app Expo actual.

## Stack

- **Next.js 15 (App Router, Turbopack)**
- **React 19**
- **Tailwind CSS v4** + **shadcn/ui** (preset Nova, Radix primitives, Lucide icons)
- **TypeScript** strict
- **Auth**: JWT del backend FastAPI almacenado en **cookie `aib_session` httpOnly** (SameSite=Lax, Secure en producción, 7 días de vida)
- **Middleware/Proxy** para redirigir usuarios sin sesión a `/login` y bloquear `/login`+`/register` cuando ya hay cookie

## Estructura

```
dashboard-web/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx        # /login
│   │   └── register/page.tsx     # /register
│   ├── api/auth/
│   │   ├── login/route.ts        # POST → backend + set cookie
│   │   ├── register/route.ts     # POST → backend + set cookie
│   │   ├── logout/route.ts       # POST → clear cookie
│   │   └── me/route.ts           # GET current user via cookie
│   ├── dashboard/page.tsx        # placeholder (Fase 2 lo llena)
│   ├── layout.tsx
│   ├── page.tsx                  # redirect según sesión
│   └── globals.css
├── components/ui/                # shadcn/ui
├── lib/
│   ├── backend.ts                # server-side fetch al FastAPI
│   ├── session.ts                # cookies() helpers + getCurrentUser
│   └── utils.ts                  # shadcn cn()
├── proxy.ts                      # replaces middleware.ts en Next.js 16
└── .env.local
```

## Variables de entorno

| Variable | Default | Descripción |
|---|---|---|
| BACKEND_INTERNAL_URL | http://localhost:8001 | URL server-to-server al FastAPI |
| NEXT_PUBLIC_BACKEND_URL | http://localhost:8001 | URL pública (rara vez usada) |
| SESSION_COOKIE_NAME | aib_session | Nombre de la cookie del JWT |

## Cómo ejecutar en local

```bash
cd /app/dashboard-web
PORT=3001 npm run dev   # localhost:3001 (3000 lo usa Expo)
```

## Autenticación de prueba

Backend arriba (`sudo supervisorctl restart backend`) →
`http://localhost:3001/login` → `pro@aib.app` / `demo1234`.

## Estado por fases

- ✅ **Fase 1** — Scaffold + Tailwind/shadcn + Auth cookie + `/login` + `/register`
- ⏳ **Fase 2** — Layout global + sidebar + `/dashboard` Analytics (recharts)
- ⏳ **Fase 3** — `/services` (con Extras) + `/agenda`
- ⏳ **Fase 4** — `/clients` + `/payments`
- ⏳ **Fase 5** — `/settings` + swap final (reemplaza Expo, archivo en /app/frontend-expo-backup/)
- ⏳ **Fase 6** — Deploy Vercel + custom domain
