/**
 * PRUEBA DE AISLAMIENTO — que un usuario NO vea los datos de otro.
 *
 * Es la única prueba de este proyecto que no se puede escribir en Vitest,
 * porque lo que verifica no está en el código: está en las políticas de
 * PostgreSQL. Hasta que esto pase contra una base viva, "los datos de cada
 * usuario están protegidos" es una afirmación nuestra, no un hecho.
 *
 * Y aquí eso pesa más que en un producto normal. Las tablas que se prueban
 * guardan qué trabajo busca alguien, a qué taller de inmigración se apuntó y
 * qué preguntó. Una política mal escrita no es un fallo de privacidad
 * abstracto: es exponer a una persona indocumentada ante cualquiera que se
 * registre.
 *
 * ── Cómo funciona ──
 *
 * Crea DOS usuarios de verdad con la API de administración —ya confirmados,
 * para no depender del correo—, inicia sesión con cada uno usando la clave
 * anónima (que es la que usa el navegador, y por tanto la que RLS filtra), y
 * comprueba que ninguno alcanza lo del otro. Al terminar los borra.
 *
 *   npm run supabase:rls
 *
 * ⚠️ Crea y borra usuarios reales en el proyecto. Correr sólo contra el
 * proyecto de desarrollo.
 */

import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// ── Entorno ──────────────────────────────────────────────

function leerEnv() {
  const env = {};
  for (const archivo of [".env.local", ".env"]) {
    if (!existsSync(archivo)) continue;
    for (const linea of readFileSync(archivo, "utf8").split("\n")) {
      const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
    }
  }
  return env;
}

const env = leerEnv();
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !ANON || !SERVICE) {
  console.error("✗ Faltan variables en .env.local.");
  console.error("  Se necesitan NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY");
  console.error("  y SUPABASE_SERVICE_ROLE_KEY. Ver docs/CONECTAR-SUPABASE.md.");
  process.exit(1);
}

// ── Resultados ───────────────────────────────────────────

let pasadas = 0;
const fallos = [];

function comprobar(nombre, ok, detalle = "") {
  if (ok) {
    pasadas += 1;
    console.log(`  ✓ ${nombre}`);
  } else {
    fallos.push(nombre);
    console.log(`  ✗ ${nombre}${detalle ? `  → ${detalle}` : ""}`);
  }
}

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

/** Cliente con la sesión de un usuario: es lo que RLS ve desde el navegador. */
function comoUsuario(accessToken) {
  return createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

const sello = Date.now();
const CUENTAS = [
  { etiqueta: "A", email: `rls-a-${sello}@andex-test.dev`, password: `Rls-${sello}-aaa` },
  { etiqueta: "B", email: `rls-b-${sello}@andex-test.dev`, password: `Rls-${sello}-bbb` },
];

const creados = [];

async function crearUsuario(cuenta) {
  const { data, error } = await admin.auth.admin.createUser({
    email: cuenta.email,
    password: cuenta.password,
    email_confirm: true,
  });
  if (error) throw new Error(`No se pudo crear ${cuenta.etiqueta}: ${error.message}`);
  creados.push(data.user.id);

  const anon = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data: sesion, error: errLogin } = await anon.auth.signInWithPassword({
    email: cuenta.email,
    password: cuenta.password,
  });
  if (errLogin) throw new Error(`No se pudo entrar como ${cuenta.etiqueta}: ${errLogin.message}`);

  return {
    ...cuenta,
    id: data.user.id,
    cliente: comoUsuario(sesion.session.access_token),
  };
}

async function limpiar() {
  for (const id of creados) {
    await admin.auth.admin.deleteUser(id).catch(() => {});
  }
}

// ── La prueba ────────────────────────────────────────────

try {
  console.log(`proyecto: ${URL}\n`);

  console.log("▶ creando dos usuarios de prueba");
  const A = await crearUsuario(CUENTAS[0]);
  const B = await crearUsuario(CUENTAS[1]);
  console.log(`  A = ${A.id}\n  B = ${B.id}`);

  // El trigger de 0004_auth.sql debería haber creado su fila en `users`.
  console.log("\n▶ la fila de `users` se crea sola al registrarse");
  {
    const { data } = await A.cliente.from("users").select("id").eq("id", A.id);
    comprobar("A tiene su fila en users", (data?.length ?? 0) === 1);
  }

  console.log("\n▶ PERFIL LABORAL — lo más sensible que guarda la app");
  {
    const { error } = await A.cliente.from("work_profile").insert({
      user_id: A.id,
      occupations: ["limpieza"],
      english_level: "basico",
      search_state_us: "UT",
    });
    comprobar("A puede escribir su propio perfil", !error, error?.message);

    const { data: propio } = await A.cliente.from("work_profile").select("*").eq("user_id", A.id);
    comprobar("A ve su propio perfil", (propio?.length ?? 0) === 1);

    // El corazón de todo: B pide explícitamente la fila de A.
    const { data: ajeno } = await B.cliente.from("work_profile").select("*").eq("user_id", A.id);
    comprobar("B NO ve el perfil de A", (ajeno?.length ?? 0) === 0);

    // Y sin filtro: "dame todo lo que haya".
    const { data: todo } = await B.cliente.from("work_profile").select("*");
    comprobar("B no ve NINGÚN perfil ajeno al pedirlos todos", (todo?.length ?? 0) === 0);

    // Suplantación: B intenta escribir una fila a nombre de A.
    const { error: errSupl } = await B.cliente
      .from("work_profile")
      .insert({ user_id: A.id, occupations: ["hackeado"] });
    comprobar("B NO puede escribir un perfil a nombre de A", Boolean(errSupl));
  }

  console.log("\n▶ ROLES — nadie se asciende solo");
  {
    const { error } = await B.cliente.from("user_roles").insert({ user_id: B.id, role: "admin" });
    comprobar("B NO puede darse el rol de administrador", Boolean(error), error ? "" : "¡lo consiguió!");

    // La trampa clásica de RLS en Supabase: si la política consulta la misma
    // tabla, Postgres aborta con recursión infinita. Esto lo detectaría.
    const { error: errLeer } = await B.cliente.from("user_roles").select("*");
    const recursion = /recursion|stack depth/i.test(errLeer?.message ?? "");
    comprobar("leer user_roles no entra en recursión", !recursion, errLeer?.message);
  }

  console.log("\n▶ CONTENIDO — sólo un administrador publica");
  {
    const { error } = await B.cliente.from("workshop_series").insert({
      slug: `intruso-${sello}`,
      title: { es: "x", en: "x" },
      summary: { es: "x", en: "x" },
      start_minutes: 600,
      end_minutes: 660,
    });
    comprobar("B NO puede crear un taller", Boolean(error), error ? "" : "¡lo creó!");

    const { error: errVacante } = await B.cliente.from("job_postings").insert({
      title: { es: "x", en: "x" },
      apply_url: "https://ejemplo.test",
    });
    comprobar("B NO puede publicar una vacante", Boolean(errVacante));

    // Un borrador no existe para nadie salvo administradores.
    const { data: borradores } = await B.cliente
      .from("workshop_series")
      .select("*")
      .eq("status", "draft");
    comprobar("B no ve borradores", (borradores?.length ?? 0) === 0);
  }

  console.log("\n▶ CATÁLOGOS — sí tienen que leerse");
  {
    const { data, error } = await A.cliente.from("modules").select("id");
    comprobar("A lee el catálogo de módulos", !error && (data?.length ?? 0) > 0, error?.message);
  }

  console.log("\n▶ INSCRIPCIONES A TALLERES");
  {
    // Se crea una sesión con el service role (salta RLS, como haría el panel).
    const { data: serie } = await admin
      .from("workshop_series")
      .insert({
        slug: `prueba-rls-${sello}`,
        title: { es: "Prueba", en: "Test" },
        summary: { es: "Prueba", en: "Test" },
        weekdays: [2],
        start_minutes: 1080,
        end_minutes: 1200,
        status: "published",
      })
      .select()
      .single();

    if (serie) {
      const { data: sesion } = await admin
        .from("workshop_sessions")
        .insert({
          series_id: serie.id,
          starts_at: new Date(Date.now() + 86400000).toISOString(),
          ends_at: new Date(Date.now() + 90000000).toISOString(),
        })
        .select()
        .single();

      if (sesion) {
        await A.cliente
          .from("workshop_registrations")
          .insert({ session_id: sesion.id, user_id: A.id, question: "dato privado de A" });

        const { data: ajenas } = await B.cliente.from("workshop_registrations").select("*");
        comprobar(
          "B NO ve a quién se inscribió en un taller",
          (ajenas?.length ?? 0) === 0,
          "expone quién asiste a un taller de inmigración",
        );
      }
      await admin.from("workshop_series").delete().eq("id", serie.id);
    } else {
      console.log("  · omitido: no se pudo crear la serie de prueba");
    }
  }
} catch (e) {
  console.error("\n✗ La prueba se rompió:", e.message);
  fallos.push("ejecución");
} finally {
  console.log("\n▶ limpiando usuarios de prueba");
  await limpiar();
}

console.log("\n" + "═".repeat(56));
if (fallos.length === 0) {
  console.log(`✓ ${pasadas} comprobaciones. Ningún usuario alcanza los datos de otro.`);
  process.exit(0);
}
console.log(`✗ ${fallos.length} FALLO(S) de ${pasadas + fallos.length}:`);
for (const f of fallos) console.log(`   · ${f}`);
console.log("\nNO publicar hasta resolverlos.");
process.exit(1);
