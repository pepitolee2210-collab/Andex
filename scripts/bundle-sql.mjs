/**
 * Concatena las migraciones en un solo archivo pegable en el SQL Editor.
 *
 * Existe porque sin la CLI de Supabase ni el MCP conectado, la vía que
 * siempre funciona es pegar SQL en el editor del navegador. Que sea
 * generado y no escrito a mano evita que se desincronice de las migraciones.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "supabase/migrations";
const archivos = readdirSync(DIR).filter((f) => f.endsWith(".sql")).sort();

const cabecera = `-- ═══════════════════════════════════════════════════════════════════════
-- ANDEX — TODAS LAS MIGRACIONES, EN ORDEN
--
-- Generado por \`npm run sql:bundle\`. NO editar a mano.
--
-- CÓMO APLICARLO
--   1. Supabase → SQL Editor → New query
--   2. Pega este archivo entero y pulsa Run
--
-- Es idempotente: se puede reejecutar sin romper nada.
--
-- DESPUÉS quedan dos pasos manuales, en docs/CONECTAR-SUPABASE.md.
-- ═══════════════════════════════════════════════════════════════════════

`;

const cuerpo = archivos
  .map((f) => `\n\n-- ${"═".repeat(69)}\n-- ▼▼▼  ${f}\n-- ${"═".repeat(69)}\n\n${readFileSync(join(DIR, f), "utf8")}`)
  .join("");

writeFileSync("supabase/TODO.sql", cabecera + cuerpo, "utf8");
console.log(`supabase/TODO.sql · ${archivos.length} migraciones`);
