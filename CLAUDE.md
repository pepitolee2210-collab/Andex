# ANDEX

Aplicación de suscripción para **familias hispanas inmigrantes en Estados
Unidos**. Guarda sus documentos y vigila sus fechas límite, y reúne trámites
migratorios, empleo, finanzas, formación y comunidad. Piloto en Utah.
Bilingüe español/inglés, con el español por defecto.

La especificación completa está en `ANDEX-PRD-v1.3-FINAL.md`. Es la fuente
de verdad; cuando algo del código y del PRD no coincidan, gana el PRD o se
documenta por qué no.

---

## Cómo se trabaja aquí

**Una pantalla, se enseña, y sólo si convence sigue la siguiente.**

Esto no es una preferencia de estilo: se aprendió caro. En agosto de 2026 se
construyó una cáscara visual entera —inicio, dock, widgets, siete pantallas—
antes de que el usuario aprobara una sola. Cuando por fin la vio, no era lo
que quería y hubo que revertirlo todo. Ese trabajo sigue vivo en la rama
`ui-prototipo` por si algún día se rescata.

**Verificar en el navegador, no sólo con pruebas.** Los dos fallos más
visibles de aquella sesión —un dock que repetía la rejilla entera y otro
alineado a la izquierda con medio ancho vacío— pasaron todas las pruebas. Se
detectaron mirando. Hay guiones de Playwright en `scratchpad/` para eso.

**Medir antes de afirmar.** Cuando algo se pueda medir, se mide: el escáner
tiene un banco de fotos con esquinas conocidas, el contraste se calcula
pintando el color en un canvas y fotografiando el fondo real. «Mejoró» no es
un resultado; 6/8 → 8/8 sí.

**Idioma de trabajo: español**, en la conversación, en los comentarios y en
los mensajes de commit.

---

## Reglas duras

Están verificadas automáticamente en `tests/reglas-duras.test.ts`. Romper una
rompe el build.

| Regla | Por qué |
|---|---|
| **La palabra «notario» está prohibida** en el copy | En EE. UU. un *notary public* no es abogado; usar el término en español está restringido por ley estatal. Riesgo legal, no estilo |
| Los colores **sólo se definen en `app/globals.css`** | Un hex suelto en un componente elude la matriz de contraste sin dejar rastro |
| El teal y el ámbar puros **nunca llevan texto encima** | Blanco sobre teal da 2.49:1; sobre ámbar, 1.77:1 |
| El texto **nunca baja de 16px** en cuerpo | Se lee bajo el sol, con vista cansada, en un teléfono de gama baja |
| **Ningún texto visible se escribe en el JSX** | Todo sale de `lib/i18n/`. Una cadena a mano se queda en español para siempre y el conmutador EN deja de decir la verdad |
| **ANDEX nunca toca datos de tarjeta** | Todo pasa por Stripe Elements. Un `<input>` propio metería el producto en el alcance de PCI DSS |
| **Ningún dato del usuario viaja en una URL** | Historial, portapapeles y registros de proxy. Con este público, es un riesgo real |
| El sello **no se usa en producto**. Si vuelve, una sola vez | Se retiró del muro de pago por diseño; la prueba exige «como máximo una vez», así que cero pasa. Si aparece en todas partes, deja de significar algo |

Y una que no es automática pero pesa igual: **nunca se promete de más en
seguridad.** El copy dice que los documentos se cifran en el teléfono *y*
dice el límite en la misma frase. Este público ya oyó «nivel bancario» de
quien lo estafó.

---

## Arquitectura, lo mínimo

- **Next.js 15 (App Router) · TypeScript estricto · Tailwind v4 · React 19**
- **`DataStore`** es un contrato con dos implementaciones: `localStorage`
  (modo demo) y Supabase. `isDemoMode = !isSupabaseConfigured`.
- **La bóveda es cliente puro.** Los documentos se cifran con AES-GCM y
  viven en IndexedDB. **No salen del dispositivo**; el servidor no puede
  verlos aunque quisiera. Por eso esas pantallas son `"use client"`.
- **El escáner** (`lib/scanner/`) es una cascada de tres niveles: `scanic`
  clásico → `scanic` con red neuronal si la confianza baja de 0.8 →
  detector propio Sobel/Hough como red de seguridad. Medido: 8 de 8 contra
  el banco de `lib/scanner/fixtures.ts`.
- **Los horarios** (`lib/community/schedule.ts`) convierten a la zona del
  navegador, **nunca de la IP**. 23 pruebas, incluido el cambio de día.
- **Supabase**: proyecto `yikittzwgvcbszktmgti`, con RLS por usuario.
  Migraciones en `supabase/migrations/`.

---

## Base de datos

**Antes de tocar cualquier cosa de Postgres o Supabase, cargar las skills:**

- `supabase` — Auth, Edge Functions, Realtime, Storage, RLS, CLI, MCP, y
  depurar errores o logs
- `supabase-postgres-best-practices` — **antes** de escribir esquema,
  migraciones, políticas RLS, índices, triggers o funciones

Sin excepción, ni para un cambio de una sola columna. El esquema ya está en
producción con datos de personas migrantes, y una auditoría anterior destapó
una función `SECURITY DEFINER` invocable públicamente que podía escribir en
`users`.

---

## Comandos

```bash
npm run dev              # servidor de desarrollo
npm run typecheck        # tsc --noEmit
npm test                 # vitest
npm run simular:ver      # recorrido completo en navegador, visible
npm run supabase:check   # verifica la conexión
npm run supabase:rls     # verifica el aislamiento entre usuarios
```

**Nunca ejecutar `npm run build` con `next dev` corriendo**: sobrescribe
`.next` y el servidor queda sirviendo chunks rotos. Los síntomas son
confusos —la página no hidrata y nada responde al tocar— y se pierde media
hora buscando un fallo que no existe.

---

## Documentos del repo

| Archivo | Qué contiene |
|---|---|
| `ANDEX-PRD-v1.3-FINAL.md` | La especificación completa |
| `docs/DECISIONES.md` | Cada decisión de producto con su número (D1, D2…) y su porqué |
| `docs/ANDEX-PARA-DISENO.md` | Contexto para diseñar la interfaz, sin estética impuesta |
| `docs/evidencia-*.md` | Lo que respalda cada decisión, con sus fuentes |
| `docs/BRIEF-AGENTES.md` | Convenciones de código |
| `docs/CONECTAR-SUPABASE.md` | Cómo enchufar la base |

---

## Estado

**Funciona**: portada con escáner gratis sin registro · registro ·
entrevista de 5 pasos · membresía y pago simulado · panel · Bóveda completa
· Comunidad con talleres y zonas horarias · Academia con nueve temarios de
inglés y sus manuales en PDF · Inversiones · perfil · administración de
talleres.

**Pendiente, y conviene tenerlo presente porque son promesas ya publicadas:**

- **Los avisos de 90/60/30/7 días no existen.** Es la promesa central del
  producto y no hay nada detrás.
- `/terminos`, `/privacidad` y `/contacto` dan **404** estando enlazadas
  desde el pie y el registro.
- **Stripe no está provisionado**: el pago es simulado.
- Las traducciones al inglés las escribió un modelo; **necesitan revisión
  humana bilingüe** antes de publicarse.
- Cuatro módulos siguen en `coming_soon`: migración, finanzas, negocio,
  empleo.
- El contenido sobre policía y paradas de tráfico se dejó fuera a propósito,
  pendiente de revisión legal.
