# ANDEX — Super App para inmigrantes hispanos

> *Tu progreso cruza fronteras.*

Implementación del **MVP v1** especificado en [`ANDEX-PRD-v1.3-FINAL.md`](./ANDEX-PRD-v1.3-FINAL.md).
El PRD es la fuente de verdad de alcance, lógica de negocio y datos. Este README solo
explica cómo correr y cómo está organizado el código.

## Arrancar

```bash
npm install
npm run dev          # http://localhost:3000
```

**No hace falta configurar nada para verlo funcionar.** Sin credenciales la app corre en
**modo demo**: la sesión vive en una cookie, los datos en `localStorage` y el checkout es
simulado. Puedes recorrer el embudo completo — landing → registro → entrevista → paywall →
panel — y comprobar que el dashboard se reordena según las respuestas.

Para conectar servicios reales, copia `.env.example` a `.env.local` y complétalo. La
aplicación detecta las variables y cambia de modo sola; **la UI no distingue**, porque todo
el acceso a datos pasa por un contrato único (`lib/data/contract.ts`).

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Tests (Vitest) |

## Stack

Next.js 15 (App Router) · TypeScript estricto · Tailwind CSS v4 · React 19 ·
Supabase (PostgreSQL + Auth) · Stripe · Vitest. Corresponde al stack fijado en §7.1 del PRD.

## Mapa del código

```
app/
  page.tsx              Landing — el hero ES la bifurcación (§3.1.1)
  (auth)/               Login, registro, recuperación, magic link
  entrevista/           Micro-entrevista de 5 pasos, bifurcada (§3.2)
  membresia/  pago/     Paywall personalizado y checkout Stripe (§3.4)
  (panel)/              Dashboard adaptativo, módulos, perfil (§4)
  design/               Showcase del sistema de diseño — referencia visual viva
  api/                  Eventos de analítica, webhooks de Stripe, preferencias
components/
  ui/                   Kit base: Button, Input, Modal, Toast, Combobox…  (§2.5)
  route-bar.tsx         "La Ruta" — el elemento firma (§2.8)
  seal.tsx              El sello de tarifa congelada (§2.9)
  module-card.tsx       Tarjeta de módulo en sus 4 estados (§4.5)
lib/
  types.ts              Contratos compartidos. Nadie los redefine.
  recommendation-engine/  Motor de reglas PURO, sin UI (§3.3) — sustituible por IA en Fase 2
  data/                 Contrato de datos + store demo + store Supabase
  i18n/                 Todo el copy, ES y EN. Nada de texto suelto en JSX.
  catalogs/             Estados, países, situaciones, intereses (Anexo C)
supabase/migrations/    Esquema, RLS, seeds (§7.2–7.4)
docs/
  BRIEF-AGENTES.md      Convenciones de código y mapa de propiedad de archivos
  DECISIONES.md         Decisiones de implementación que el PRD no fijaba, con su porqué
```

## Reglas que no se negocian

Están en el PRD; se repiten aquí porque son las que más fácil se rompen sin querer:

- **Contraste.** El teal `#12B8A6` y el ámbar `#F4B942` son colores de superficie. Nunca
  llevan texto encima (§2.1.1). Los colores solo se escriben en `app/globals.css`; el resto
  del código usa clases de token.
- **Texto mínimo 16px**, todo en `rem`, targets táctiles de 44px, foco de teclado visible.
  La audiencia usa Android de gama baja, con frecuencia bajo sol directo (§2.2.1, §9).
- **La palabra "notario" no aparece en ningún texto en español.** Está restringida por las
  leyes estatales de consultoría migratoria (Anexo B).
- **La personalización ordena y enfatiza; nunca oculta ni bloquea.** Los 7 módulos son
  visibles y accesibles para todo usuario con suscripción activa (§0.4).
- **Sin patrones oscuros en el paywall.** Nada de contadores, escasez inventada ni casillas
  premarcadas. Cancelar toma un clic (§3.4.6).
- **Sin datos sensibles en URLs.** Nunca `?status=asilo` ni equivalentes (§9).
- **ANDEX no toca datos de tarjeta.** Todo pasa por Stripe Elements (§3.4.5).

## Simulación del embudo

Un guion recorre el producto entero en un navegador real, en modo demo, como lo haría una
persona: landing → registro → entrevista → paywall → pago → panel → perfil.

```bash
npm run build && npm start      # en una terminal
npm run simular:ver             # en otra — abre el navegador y se ve el recorrido
npm run simular                 # igual, sin ventana (para CI)
```

Hace 66 comprobaciones sobre lo que ninguna lectura de código puede confirmar: que las
pantallas se pintan, que el motor produce dashboards distintos para perfiles distintos, que
el consentimiento bloquea el cobro y que nada desborda a 320px. Deja capturas de cada paso
en `tests/capturas/`.

## Estado verificado

| Comprobación | Resultado |
|---|---|
| `npm run typecheck` | Limpio |
| `npm test` | 67 tests verdes |
| `npm run build` | Compila, 23 rutas |
| Peso de la landing | 112 kB de JS de primera carga (presupuesto: <300 KB) |
| Arranque real | El servidor levanta y sirve la landing con contenido completo |
| Reordenamiento sin JavaScript | Confirmado: el servidor devuelve HTML distinto por rama |
| Control de acceso | Las rutas privadas redirigen a `/login` conservando el destino |
| `npm run simular` | **66/66** — el embudo completo recorrido en un navegador real |

`npm test` incluye 19 verificaciones automáticas de las reglas que el PRD declara no
negociables: contraste AA medido con la fórmula WCAG en ambos temas, ausencia de la palabra
prohibida, cero colores fuera del archivo de tokens, escala tipográfica, unicidad del sello
y de La Ruta, cobertura de los eventos declarados y existencia de todas las rutas enlazadas.

## Antes de lanzar

Pendientes que no son de código y bloquean el lanzamiento — el detalle está en
[`docs/DECISIONES.md`](./docs/DECISIONES.md):

1. Validar con asesoría legal el copy de **tarifa congelada**: es una promesa comercial
   vinculante (§3.4.4, riesgo R2).
2. Aprovisionar Supabase y aplicar las migraciones **con RLS activo desde el día uno**.
3. Crear los precios en Stripe y verificar el webhook con eventos duplicados.
4. Conectar el proveedor de correo: aviso 48 h antes de cada cobro, recibo y recuperación
   de checkout son requisitos de cumplimiento, no mejoras (§3.4.6).
