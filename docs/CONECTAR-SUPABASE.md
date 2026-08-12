# Conectar Supabase

Tres pasos. El proyecto ya existe: `yikittzwgvcbszktmgti`.

---

## 1 · Aplicar el esquema

Supabase → **SQL Editor** → *New query* → pega **`supabase/TODO.sql`** entero
→ **Run**.

Son las 10 migraciones concatenadas y en orden. Es idempotente: si algo falla
a mitad, se corrige y se vuelve a ejecutar entero sin romper nada.

> El archivo se regenera con `npm run sql:bundle` cada vez que se añade una
> migración. No editarlo a mano.

## 2 · Crear `.env.local`

En la raíz del proyecto, copiando de `.env.example`:

```
NEXT_PUBLIC_SUPABASE_URL=https://yikittzwgvcbszktmgti.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<clave anon / publishable>
SUPABASE_SERVICE_ROLE_KEY=<clave service_role>
NEXT_PUBLIC_SITE_URL=http://localhost:3200
```

Las claves están en Supabase → **Project Settings → API**.

⚠️ La `service_role` da acceso total saltándose RLS. Va sólo en `.env.local`
—que está en `.gitignore`— y **nunca** con prefijo `NEXT_PUBLIC_`, que la
publicaría en el JavaScript del navegador.

Comprueba que todo entró:

```
npm run supabase:check
```

Recorre las 17 tablas. Un `401` o `403` cuenta como correcto: significa que
la tabla existe y RLS la está protegiendo, que es justo lo que se busca.

## 3 · Darte el rol de administrador

**Este paso es obligatorio y es fácil olvidarlo.**

En cuanto `.env.local` existe, `isDemoMode` pasa a falso y el permiso de
administrador deja de concederse solo: ahora sale de la tabla `user_roles`.
Hasta que te des el rol, **`/admin` devuelve 404** — también a ti.

Primero **regístrate en la app** con el correo que vayas a usar. Después, en
el SQL Editor:

```sql
insert into user_roles (user_id, role)
select id, 'admin' from users where email = 'TU-CORREO-AQUI'
on conflict do nothing;

-- Comprobación: tiene que devolver una fila.
select u.email, r.role from user_roles r join users u on u.id = r.user_id;
```

---

## Qué cambia al conectarse

| | Modo demo | Con Supabase |
|---|---|---|
| Sesión | cookie + localStorage | Supabase Auth |
| Perfil y ranking | localStorage | PostgreSQL con RLS |
| Sesiones de taller | localStorage del navegador | `workshop_sessions` |
| Administrador | cualquiera con sesión | sólo `user_roles` |

La **Bóveda no cambia**: los documentos siguen cifrados en IndexedDB y no
salen del dispositivo. Eso es del producto, no del modo.

Stripe va aparte: sin sus claves el checkout sigue simulado aunque Supabase
esté conectado.

## Lo que sigue sin verificarse hasta que esto corra

Las políticas RLS **nunca se han ejecutado contra una base viva**. Están
escritas y revisadas, pero hasta que haya dos usuarios reales y se compruebe
que ninguno ve los datos del otro, eso es una afirmación y no un hecho.
