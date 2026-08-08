# BRIEF PARA AGENTES — PROYECTO ANDEX MVP v1

> **Lee este documento completo antes de escribir una sola línea.** Después lee las
> secciones del PRD que te asigna tu prompt. Al terminar tu trabajo, RE-LEE esas
> secciones y verifica punto por punto que cumpliste. Ese ciclo (leer → construir →
> re-verificar contra el documento) es requisito explícito del dueño del producto.

## 1. Fuentes de verdad

| Fuente | Manda sobre |
|---|---|
| `D:\Andex\ANDEX-PRD-v1.3-FINAL.md` | Alcance, lógica, datos, reglas de negocio, copy especificado |
| Este brief | Convenciones de código, estructura, contratos entre agentes |

⚠️ El PRD cita `andex-prototipo-visual.html` como fuente de verdad visual. **Ese archivo
NO existe en el repo.** Ante una decisión visual no escrita en el PRD: aplica el sistema
de §2 con criterio sobrio ("todo lo demás es disciplinado y silencioso", §2.8) y anota la
decisión en tu reporte final. No inventes elementos decorativos: los únicos permitidos
son La Ruta (§2.8, una vez por pantalla) y el sello (§2.9, solo en el paywall).

## 2. Stack y comandos

- Next.js 15 (App Router) + TypeScript estricto + Tailwind CSS v4 + React 19.
- Supabase (`@supabase/supabase-js`, `@supabase/ssr`), Stripe, `lucide-react`, Vitest.
- Verificación: `npx tsc --noEmit` (obligatorio antes de reportar). Tests: `npx vitest run`.
- **NO ejecutes:** `npm install` (ya está todo instalado), `next build`, `next dev`,
  ni ningún servidor. **NO uses git.** Si te falta una dependencia, anótalo en tu
  reporte; no la instales.
- Entorno Windows: rutas `D:\Andex\...`. La app corre en **modo demo** sin credenciales
  (ver §6): nunca asumas que hay Supabase/Stripe reales al programar.

## 3. Estructura y mapa de propiedad

```
app/
  layout.tsx            ← Sesión 0 (NO TOCAR)
  globals.css           ← tokens Sesión 0; SOLO el agente de Diseño puede añadir
  page.tsx              ← agente Landing
  (auth)/login|registro|recuperar  ← agente Auth
  entrevista/           ← agente Wizard
  membresia/  pago/     ← agente Paywall/Stripe
  (panel)/panel|modulo/[slug]|perfil  ← agente Dashboard
  design/               ← agente Diseño (showcase interno de componentes)
  api/prefs             ← Sesión 0 (NO TOCAR)
  api/events            ← agente Datos
  api/checkout|webhooks ← agente Paywall/Stripe
components/
  ui/*                  ← agente Diseño (Button, Input, Badge, Modal, Toast, etc.)
  route-bar.tsx, seal.tsx, module-card.tsx, la-ruta-hero.tsx, module-icon.tsx ← agente Diseño
  landing/* wizard/* paywall/* panel/*  ← cada agente de feature su carpeta
lib/
  types.ts, config.ts, utils.ts, catalogs/modules.ts, data/contract.ts ← Sesión 0 (NO TOCAR)
  data/{demo-store,supabase-store,index}.ts ← agente Datos
  supabase/*, db-types.ts ← agente Datos
  auth/*                ← FIRMAS congeladas en stubs (Sesión 0); el agente Auth
                          implementa los cuerpos SIN cambiar firmas
  geo.ts                ← Sesión 0 (NO TOCAR) — hint IP para preselección
  notifications/email.ts ← Sesión 0; el agente Paywall/Stripe puede ampliar jobs
  recommendation-engine/* ← agente Motor (PROHIBIDO importar UI aquí)
  i18n/*                ← agente i18n crea; cada feature REFINA solo su dominio
  catalogs/{states,countries,...}.ts ← agente i18n
  stripe/*              ← agente Paywall/Stripe
  analytics/track.ts    ← Sesión 0 (NO TOCAR)
middleware.ts           ← agente Auth
supabase/migrations/*   ← agente Datos
docs/DECISIONES.md      ← SOLO el orquestador; los agentes reportan, no editan
```

**Regla:** no toques archivos de otro dueño. Si necesitas un cambio ajeno, descríbelo en
tu reporte final y el orquestador lo aplica. Los stubs marcados `⛏️` en el código sí se
reemplazan por su dueño asignado.

## 4. Convenciones de código

1. TypeScript estricto. Prohibido `any`; prefiere tipos de `lib/types.ts` (no los
   redefinas jamás).
2. Server Components por defecto; `"use client"` solo donde hay interacción.
3. Imports con alias `@/` siempre.
4. **Colores:** SOLO clases de token (`bg-page`, `bg-surface`, `bg-surface-alt`,
   `text-ink`, `text-muted`, `text-disabled`, `border-line`, `bg-teal`, `bg-teal-deep`,
   `bg-teal-soft`, `bg-amber`, `text-amber-deep`, `bg-amber-soft`, `bg-navy`,
   `text-on-accent`, `text-on-highlight`, `text-success|warning|danger|info`, …).
   **Prohibido cualquier hex fuera de `app/globals.css`.** Regla de oro §2.1.1:
   texto sobre `#12B8A6` o `#F4B942` puros = NUNCA.
5. Tipografía por token: `text-display`, `text-h1`, `text-h2`, `text-h3`,
   `text-body-lg`, `text-body`, `text-label`, `text-caption`; títulos con
   `font-heading`. Body nunca menor a `text-body` (16px, §2.2.1).
6. Breakpoints: usar `sm:` (≥640), `lg:` (≥1024), `xl:` (≥1440). Evitar `md:`.
7. Accesibilidad no negociable (§9): targets táctiles ≥44px (`min-h-11`), foco visible
   (ya global), `aria-*` correcto, roles, labels en inputs, `prefers-reduced-motion` ya
   cubierto globalmente — no añadas animaciones que lo ignoren. Responsive hasta 320px.
8. **Copy SOLO desde `lib/i18n`** — nunca strings visibles hardcodeados en JSX.
   Español neutro latinoamericano, voz directa y cálida (§2.7). Los errores dicen qué
   pasó y cómo resolverlo. **La palabra "notario" está PROHIBIDA en español** (Anexo B).
9. Sin datos sensibles en URLs (nunca `?status=asilo` ni similares) (§9).
10. Radios: inputs/chips `rounded-sm` (8), botones `rounded-md` (12), tarjetas
    `rounded-lg` (16), modales/hero `rounded-xl` (24). Sombras `shadow-sm|md|lg`.

## 5. La Ruta y el sello (§2.8–2.9)

- `<RouteBar step={1..6} context?>` — única firma visual. Aparece **una vez por
  pantalla** como máximo: hero landing (variante propia), wizard (pasos), paywall
  (nodo 6 = sello). En el dashboard solo el chip compacto del topbar. Nunca como
  divisor ni viñeta.
- El sello ámbar rotado −9° aparece **solo** en la tarjeta del plan anual del paywall.

## 6. Datos: contrato único

- Toda la UI usa `getDataStore()` de `@/lib/data` (contrato en `lib/data/contract.ts`).
  **Prohibido** llamar Supabase directo desde componentes (única excepción: webhook
  Stripe con cliente admin).
- Modo demo (sin env vars): el store persiste en localStorage y la sesión es una cookie
  `andex_session`. Modo real: Supabase con RLS. La UI no distingue — por eso las
  páginas tras el login son client components que consumen el store.
- Sesión: importa de `@/lib/auth` — `getSessionUser()` (server),
  `useSessionUser()` (client), `requireUser()` (server, redirige a /login).

## 7. Rutas y cookies

Rutas SIEMPRE desde `ROUTES` de `@/lib/config`:
`/` landing · `/login` · `/registro` · `/recuperar` · `/entrevista` · `/membresia`
(paywall) · `/pago` (checkout) · `/pago/exito` · `/panel` · `/modulo/[slug]` ·
`/perfil` · `/design` (showcase interno).

Flujo del embudo (§3): landing → registro → entrevista → membresía → pago → panel.

Cookies: `andex_lang` ('es' default | 'en'), `andex_theme` ('light'|'dark'|ausente =
sistema), `andex_session` (solo demo). Idioma/tema se cambian vía
`GET /api/prefs?lang=..&theme=..&back=..` (funciona sin JS) o client-side + refresh.

## 8. Analítica (§7.5)

`track(nombre, props)` de `@/lib/analytics/track` — los 27 nombres están tipados en
`lib/types.ts`. Usa exactamente las propiedades de la tabla §7.5. No inventes eventos
ni props nuevas sin anotarlo en el reporte.

## 9. Proceso obligatorio y reporte

1. Lee este brief + tus secciones del PRD (tu prompt trae números de sección y líneas).
2. Construye. Ante ambigüedad: PRD > brief > criterio sobrio documentado.
3. RE-LEE tus secciones del PRD y verifica tu checklist punto por punto.
4. `npx tsc --noEmit` limpio (si hay errores de archivos ajenos, repórtalos sin tocarlos).
5. Si tu prompt incluye tests: `npx vitest run` verde.
6. Reporte final (es lo único que ve el orquestador — sé preciso):
   - Archivos creados/modificados (lista completa).
   - Checklist del PRD: cumplido / desviación y por qué.
   - Decisiones tomadas ante ambigüedad.
   - **Sugerencias UX** (opcionales, marcadas como APUESTA — opinión experta, no hallazgo).
   - Cambios que necesitas de archivos ajenos.
