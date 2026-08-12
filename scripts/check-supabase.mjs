/**
 * Comprueba que la conexión con Supabase está viva y que el esquema entró.
 *
 * No usa el SDK: una petición REST simple contra PostgREST basta y evita
 * depender de nada. Lee `.env.local` a mano porque este script corre fuera
 * de Next.js.
 */
import { readFileSync, existsSync } from "node:fs";

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
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("✗ Falta NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local");
  console.error("  Sin ellas la app sigue en modo demo.");
  process.exit(1);
}
console.log("proyecto:", url);

// Tablas que deben existir tras aplicar supabase/TODO.sql.
const TABLAS = [
  "users", "modules", "subscriptions",
  "user_roles", "workshop_series", "workshop_sessions", "workshop_registrations",
  "work_profile", "employers", "job_postings", "job_matches", "job_interactions",
  "support_places", "lesson_tracks", "lessons", "lesson_progress",
  "job_sync_runs",
];

let fallos = 0;
for (const tabla of TABLAS) {
  const r = await fetch(`${url}/rest/v1/${tabla}?select=*&limit=0`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  }).catch((e) => ({ ok: false, status: 0, statusText: e.message }));

  // 200 = existe y RLS deja mirar. 401/403 = existe pero RLS la protege,
  // que es exactamente lo que se quiere para las tablas privadas.
  const existe = r.ok || r.status === 401 || r.status === 403;
  if (!existe) fallos += 1;
  console.log(`  ${existe ? "✓" : "✗"} ${tabla}${existe ? "" : `  (${r.status} ${r.statusText})`}`);
}

console.log(fallos === 0
  ? "\n✓ El esquema completo está aplicado."
  : `\n✗ Faltan ${fallos} tablas. Pega supabase/TODO.sql en el SQL Editor.`);
process.exit(fallos === 0 ? 0 : 1);
