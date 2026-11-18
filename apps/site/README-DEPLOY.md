# Deploy a Vercel — checklist paso a paso

Este dashboard (Next.js 16 + React 19 + Tailwind v4 + shadcn/ui) está listo para deploy en Vercel. El backend FastAPI queda en Emergent; el frontend se sirve desde Vercel y llama al backend vía un proxy Next.js server-side (no hay CORS entre navegador y Vercel).

---

## 0. Requisitos
- Cuenta gratuita en <https://vercel.com/signup>
- Node.js 20+ y npm 10+ en tu máquina local
- Acceso al código de este repo (ver “Sacar el código” abajo)

---

## 1. Sacar el código a tu máquina

### Opción A — GitHub (requiere plan pago de Emergent)
1. Perfil → **Connect GitHub** → autoriza
2. Chat → **Save to GitHub** → crear repo
3. En tu máquina: `git clone https://github.com/<user>/<repo>.git`
4. `cd <repo>/dashboard-web`

### Opción B — Sin GitHub
Contacta a **support@emergent.sh** con tu **job ID** solicitando exportación del proyecto como ZIP, o revisa si tu workspace ofrece “Download as ZIP”.

---

## 2. Instalar Vercel CLI
```bash
npm install -g vercel
vercel login   # abrirá tu navegador para autenticarte
```

---

## 3. Primer deploy (preview)
Desde `/dashboard-web/`:
```bash
vercel
```
La CLI te preguntará:
- Set up and deploy? **Y**
- Which scope? tu cuenta
- Link to existing project? **N**
- Project name? `aib-dashboard` (o el que quieras)
- Directory? `.` (Enter)
- Modify settings? **N**

Al terminar tendrás una URL tipo `https://aib-dashboard-xxxx.vercel.app`.

---

## 4. Configurar variables de entorno
En <https://vercel.com/dashboard> → tu proyecto → **Settings → Environment Variables**, añade estas 3 (aplica a Production + Preview + Development):

| Nombre | Valor |
|---|---|
| `BACKEND_INTERNAL_URL` | `https://schedule-master-482.preview.emergentagent.com` |
| `NEXT_PUBLIC_BACKEND_URL` | `https://schedule-master-482.preview.emergentagent.com` |
| `SESSION_COOKIE_NAME` | `aib_session` |

> **Nota:** cuando publiques el backend en producción de Emergent, cambia la URL a la producción.

---

## 5. Deploy final a producción
Para promover a producción:
```bash
vercel --prod
```
Esto genera la URL definitiva `https://aib-dashboard.vercel.app` (o el nombre elegido).

---

## 6. Verificar el deploy
1. Visita tu URL de Vercel → debes ver `/login`
2. Login con `pro@aib.app` / `demo1234`
3. Verifica que:
   - Redirige a `/dashboard`
   - Carga Analytics con datos reales
   - Navegación entre tabs funciona
   - Cookie `aib_session` presente en DevTools → Application → Cookies (con `HttpOnly`, `Secure`, `SameSite=Lax`)

---

## 7. Actualizaciones futuras
- Con GitHub: cada `git push` a la rama principal auto-despliega
- Con CLI: `vercel --prod` desde `/dashboard-web/`

---

## 8. Consideraciones importantes

### Cookies cross-domain
No hay problema: todas las llamadas al backend pasan por `/api/backend/*` (route handler server-side de Next.js), así que el navegador solo dialoga con `*.vercel.app`. Vercel añade la cookie de sesión internamente y Next.js inyecta el `Bearer` al llamar al FastAPI.

### CORS del backend
El backend Emergent tiene `allow_origins=["*"]`, así que no requiere cambios. Si en el futuro lo restringes, añade tu dominio Vercel a la whitelist.

### Costes
Plan **Hobby** de Vercel: 100 GB de bandwidth/mes, 100 GiB-hours de compute, dominios `.vercel.app` gratis. Suficiente para MVP.

---

## 9. Dominio custom (más tarde)
Cuando quieras `dashboard.aibooking.app`:
1. Compra el dominio (Namecheap, Google Domains…)
2. Vercel → Settings → Domains → Add → introduce `dashboard.aibooking.app`
3. Vercel te dará un registro CNAME o A que añadirás en el DNS de tu registrador
4. En 5–10 min tendrás HTTPS automático (Let’s Encrypt)

---

## Troubleshooting rápido

**Login devuelve 401 desde Vercel** → revisa que `BACKEND_INTERNAL_URL` esté configurado en Vercel (Settings → Env Vars). Sin él, el proxy no sabe a quién llamar.

**“Module not found” en build** → asegura que `npm install` corrió antes del `vercel` command. `vercel.json` fuerza `npm install` automáticamente.

**Estilos rotos** → puede ser que Tailwind v4 no encuentre las utilidades. Verifica que `globals.css` incluye `@import "tailwindcss";` y que `postcss.config.mjs` existe.

**Backend cambió de URL** → solo cambia las env vars en Vercel y redeploy (`vercel --prod` o desde el dashboard “Redeploy”).
