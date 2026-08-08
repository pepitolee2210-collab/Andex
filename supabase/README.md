# ANDEX — Base de datos (Supabase)

Persistencia del MVP v1. Fuente de verdad: `ANDEX-PRD-v1.3-FINAL.md` §7
(esquema, RLS, seed, eventos). **Sin credenciales la app corre en modo demo**
(localStorage) y nada de esto hace falta: ver `lib/data/demo-store.ts`.

## Contenido

| Archivo | Qué hace |
|---|---|
| `migrations/0001_schema.sql` | Esquema completo de §7.2: 12 tablas, índices, `set_updated_at()` y sus triggers |
| `migrations/0002_rls.sql` | RLS de §7.3 + políticas para las tablas que el PRD no cubrió |
| `migrations/0003_seed.sql` | Seed de `modules` (§7.4), `module_relevance` (§3.3.1 + §4.2.1) y `external_resources` (§6) |
| `migrations/0004_auth.sql` | Trigger `handle_new_user`: alta en `public.users` al registrarse en Supabase Auth |
| `tests/rls_verification.sql` | Verificación de RLS con dos usuarios de prueba (DoD de §7.3) |

Las migraciones son **idempotentes**: se pueden re-ejecutar sin error
(`IF NOT EXISTS`, `OR REPLACE`, `DROP … IF EXISTS`, `ON CONFLICT DO UPDATE`).
Aplícalas **en orden numérico**.

## Aplicar las migraciones

### Opción A — Supabase CLI (recomendada)

```bash
supabase link --project-ref <tu-project-ref>
supabase db push
```

### Opción B — SQL Editor del dashboard

Pega y ejecuta cada archivo en orden: `0001` → `0002` → `0003` → `0004`.

### Opción C — psql

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/0001_schema.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/0002_rls.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/0003_seed.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/0004_auth.sql
```

Después copia las claves del proyecto a `.env.local` (plantilla en
`.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y
`SUPABASE_SERVICE_ROLE_KEY` (esta última **jamás** con prefijo `NEXT_PUBLIC`).
En cuanto existan las dos primeras, `isDemoMode` de `lib/config.ts` pasa a
`false` y la app usa `lib/data/supabase-store.ts`.

## Verificar RLS (obligatorio antes de lanzar)

> §7.3: *"Supabase expone las tablas públicamente por defecto. Sin RLS, todo el
> perfil de todos los usuarios es legible. Esto no es opcional ni se deja para
> después."*

`tests/rls_verification.sql` es un script autocontenido que **no necesita
usuarios reales**: siembra dos usuarios ficticios (Ana y Bruno), se hace pasar
por cada rol con la técnica oficial de PostgREST (`SET LOCAL ROLE` +
`request.jwt.claims`) y verifica 22 aserciones. Todo corre en una transacción
que termina en `ROLLBACK`: **no deja datos**.

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls_verification.sql
```

También se puede pegar completo en el SQL Editor del dashboard (que ejecuta
como `postgres`, dueño de las tablas — necesario para el `SET ROLE`).

Salida esperada: una serie de `PASS …` y al final `RLS OK`. Cualquier fallo
aborta con `FAIL <id>: <qué se pudo hacer y no debía>`.

Qué comprueba:

- El usuario A **no** lee ni edita nada de B: perfil, onboarding, suscripción,
  ranking, consentimientos, historial de contexto (T1–T6).
- A **no** puede insertar filas a nombre de B: consentimientos, analítica,
  ranking (T7, T9, T14).
- A **sí** puede registrar su propio consentimiento (§3.4.6) y escribir su
  ranking e historial (T8, T15).
- La telemetría (`analytics_events`, `external_redirect_logs`) se inserta pero
  **no se lee** desde el cliente (T10, T16).
- Los catálogos (`modules`, `module_relevance`, `external_resources`) son
  legibles por todos, con y sin sesión (T11, A2).
- `subscriptions` y `stripe_events` **no** admiten escritura de clientes: solo
  el service role del webhook de Stripe (T12, T13).
- Un anónimo no ve ningún usuario y solo puede insertar analítica sin
  `user_id` (A1, A3–A6).

### Verificación manual con dos usuarios reales (opcional)

Si prefieres probarlo end-to-end contra la API real:

1. Registra dos cuentas en la app (`/registro`): `ana@…` y `bruno@…`.
   El trigger de `0004_auth.sql` crea sus filas en `public.users`.
2. Completa la entrevista con la cuenta de Bruno para que tenga perfil y ranking.
3. Copia el `access_token` de Ana (en el navegador:
   `localStorage` → clave `sb-<ref>-auth-token` → campo `access_token`).
4. Intenta leer a Bruno con el token de Ana:

```bash
curl "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/users?select=*" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer <access_token_de_ana>"
```

Debe devolver **solo la fila de Ana** (`[{…}]`, nunca dos). Repite con
`user_onboarding_profile`, `subscriptions` y `user_module_ranking`.

## Notas de operación

- **`external_resources.last_verified_at` es visible al usuario** (§6). Hay que
  mantenerlo fresco; §6 pide además un job semanal que verifique las URLs y
  alerte ante 404 o redirección — pendiente, fuera de estas migraciones.
- **Solo el service role escribe suscripciones.** El webhook de Stripe
  (`app/api/webhooks/stripe`) usa `lib/supabase/admin.ts`; el cliente nunca
  escribe en `subscriptions` ni en `stripe_events`.
- **`users.deleted_at` es soft delete** (§7.2). Ninguna consulta del store lo
  filtra todavía: si se implementa el borrado de cuenta, hay que añadir
  `deleted_at IS NULL` a las lecturas y decidir el borrado real en Auth.
- **`module_relevance` es la fuente del ranking base y de los títulos por
  contexto** (§3.3.1, §4.2.1). El motor de recomendación tiene la misma matriz
  en código; si se cambia una, hay que cambiar la otra.
