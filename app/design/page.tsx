"use client";

/**
 * /design — Referencia interna de diseño (ANDEX-UI-2026-V1).
 *
 * Sustituye al `andex-prototipo-visual.html` que el PRD §2.10 cita como
 * fuente de verdad visual y que NO existe en el repo. Aquí viven todas
 * las variantes y estados del UI kit para inspección visual.
 *
 * Excepciones documentadas de esta página:
 * - Copy en español hardcodeado: es una pantalla interna, exenta de i18n.
 * - La Ruta aparece varias veces (§2.8 la limita a una por pantalla):
 *   esta es la página que la documenta, no una pantalla de producto.
 * - Los hex de la matriz §2.1.1 aparecen como TEXTO de documentación,
 *   nunca como valor de estilo.
 */

import { useState } from "react";
import { Compass, Inbox } from "lucide-react";
import { moduleBySlug } from "@/lib/catalogs/modules";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { Modal } from "@/components/ui/modal";
import { OptionChips } from "@/components/ui/option-chips";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { toast } from "@/components/ui/toaster";
import { LaRutaHero } from "@/components/la-ruta-hero";
import { ModuleCard } from "@/components/module-card";
import { RouteBar, type RouteBarStep } from "@/components/route-bar";
import { Seal } from "@/components/seal";

// ── Ayudantes de maquetación de la propia referencia ──────

function Section({
  id,
  title,
  source,
  children,
}: {
  id: string;
  title: string;
  source: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 border-t border-line pt-8">
      <div className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="font-heading text-h2 text-ink">{title}</h2>
        <span className="text-caption text-muted">{source}</span>
      </div>
      {children}
    </section>
  );
}

function Case({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="mb-2 text-caption font-semibold uppercase tracking-wide text-muted">
        {label}
      </div>
      {children}
    </div>
  );
}

// ── Datos de muestra ──────────────────────────────────────

const PALETTE: Array<{ name: string; hex: string; swatch: string; note: string }> = [
  { name: "navy", hex: "#102A43", swatch: "bg-navy", note: "Texto principal · 14.6:1 sobre blanco ✅" },
  { name: "navy-soft", hex: "#EEF2F6", swatch: "bg-navy-soft", note: "Fondos de sección" },
  { name: "cream (bg)", hex: "#F7F5EF", swatch: "bg-cream", note: "Fondo de pantalla · navy encima 13.7:1 ✅" },
  { name: "surface", hex: "#FFFFFF", swatch: "bg-surface", note: "Tarjetas y modales" },
  { name: "surface-alt", hex: "#EEF2F6", swatch: "bg-surface-alt", note: "Superficie secundaria" },
  { name: "teal", hex: "#12B8A6", swatch: "bg-teal", note: "SOLO superficie · blanco encima 2.49:1 ❌" },
  { name: "teal-deep", hex: "#0F766E", swatch: "bg-teal-deep", note: "Botón primario · blanco encima 5.47:1 ✅" },
  { name: "teal-soft", hex: "#E6F7F5", swatch: "bg-teal-soft", note: "Fondo de badge y chip seleccionado" },
  { name: "amber", hex: "#F4B942", swatch: "bg-amber", note: "SOLO fondo de badge · navy encima 8.2:1 ✅" },
  { name: "amber-deep", hex: "#9A6B00", swatch: "bg-amber-deep", note: "Texto de alerta · 4.69:1 sobre blanco ✅" },
  { name: "amber-soft", hex: "#FEF6E3", swatch: "bg-amber-soft", note: "Fondo de callout y del sello" },
  { name: "line", hex: "#E4E7EB", swatch: "bg-line", note: "Bordes y separadores" },
  { name: "success", hex: "#0E7C5A", swatch: "bg-success", note: "Semántico" },
  { name: "warning", hex: "#9A6B00", swatch: "bg-warning", note: "Semántico" },
  { name: "danger", hex: "#B42318", swatch: "bg-danger", note: "Semántico" },
  { name: "info", hex: "#0F766E", swatch: "bg-info", note: "Semántico" },
];

const CONTRAST_MATRIX: Array<{ combo: string; ratio: string; ok: boolean; use: string }> = [
  { combo: "#102A43 sobre blanco", ratio: "14.6:1", ok: true, use: "Texto principal" },
  { combo: "#102A43 sobre #F7F5EF", ratio: "13.7:1", ok: true, use: "Texto sobre crema" },
  { combo: "#52708C sobre blanco", ratio: "5.18:1", ok: true, use: "Texto secundario (text-muted)" },
  { combo: "#627D98 sobre blanco", ratio: "4.28:1", ok: false, use: "No usar para texto — fuera de la paleta" },
  { combo: "Blanco sobre #0F766E", ratio: "5.47:1", ok: true, use: "Botón primario" },
  { combo: "Blanco sobre #12B8A6", ratio: "2.49:1", ok: false, use: "Nunca — teal es superficie" },
  { combo: "#102A43 sobre #12B8A6", ratio: "5.88:1", ok: true, use: "Alternativa de botón teal" },
  { combo: "#F4B942 sobre blanco", ratio: "1.77:1", ok: false, use: "Nunca para texto" },
  { combo: "#102A43 sobre #F4B942", ratio: "8.2:1", ok: true, use: "Badge ámbar con texto navy" },
  { combo: "#9A6B00 sobre blanco", ratio: "4.69:1", ok: true, use: "Texto de alerta" },
];

const TYPE_SCALE: Array<{ token: string; spec: string; cls: string; heading?: boolean }> = [
  { token: "display", spec: "40px / 1.1 / 700 — hero de landing", cls: "text-display", heading: true },
  { token: "h1", spec: "32px / 1.2 / 700 — título de pantalla", cls: "text-h1", heading: true },
  { token: "h2", spec: "24px / 1.3 / 600 — sección", cls: "text-h2", heading: true },
  { token: "h3", spec: "20px / 1.4 / 600 — tarjeta", cls: "text-h3", heading: true },
  { token: "body-lg", spec: "18px / 1.6 / 400 — instructivos", cls: "text-body-lg" },
  { token: "body", spec: "16px / 1.6 / 400 — texto base (mínimo)", cls: "text-body" },
  { token: "label", spec: "14px / 1.4 / 500 — etiquetas de formulario", cls: "text-label" },
  { token: "caption", spec: "13px / 1.4 / 400 — metadatos", cls: "text-caption" },
];

const RADII: Array<{ token: string; cls: string; use: string }> = [
  { token: "sm · 8px", cls: "rounded-sm", use: "Inputs, chips" },
  { token: "md · 12px", cls: "rounded-md", use: "Botones" },
  { token: "lg · 16px", cls: "rounded-lg", use: "Tarjetas de módulo" },
  { token: "xl · 24px", cls: "rounded-xl", use: "Modales, hero card" },
  { token: "full · 999px", cls: "rounded-full", use: "Avatares, badges, nodos" },
];

const TIEMPO_EN_US = [
  { value: "menos_6_meses", label: "Menos de 6 meses" },
  { value: "6m_2a", label: "6 meses – 2 años" },
  { value: "2a_5a", label: "2 – 5 años" },
  { value: "mas_5a", label: "Más de 5 años" },
  { value: "no_responde", label: "Prefiero no decir" },
];

const INTERESES = [
  { value: "legal_tramites", label: "Trámites migratorios" },
  { value: "empresa_llc", label: "Crear o formalizar una empresa" },
  { value: "finanzas", label: "Educación financiera y crédito" },
  { value: "certificaciones", label: "Certificaciones técnicas" },
  { value: "empleo", label: "Empleo y oportunidades" },
  { value: "other", label: "Otro" },
];

/** Muestra del Anexo C.1 con sus tres bloques. */
const ESTADOS = [
  { value: "UT", label: "Utah", group: "piloto" },
  { value: "CA", label: "California", group: "rapido" },
  { value: "TX", label: "Texas", group: "rapido" },
  { value: "FL", label: "Florida", group: "rapido" },
  { value: "NY", label: "Nueva York", group: "rapido" },
  { value: "AZ", label: "Arizona", group: "rapido" },
  { value: "AL", label: "Alabama", group: "todos" },
  { value: "AK", label: "Alaska", group: "todos" },
  { value: "CO", label: "Colorado", group: "todos" },
  { value: "DC", label: "Washington D. C.", group: "todos" },
  { value: "GA", label: "Georgia", group: "todos" },
  { value: "IL", label: "Illinois", group: "todos" },
  { value: "NJ", label: "Nueva Jersey", group: "todos" },
  { value: "NV", label: "Nevada", group: "todos" },
  { value: "PR", label: "Puerto Rico", group: "todos" },
];

const GRUPOS_ESTADOS = {
  piloto: "Piloto",
  rapido: "Acceso rápido",
  todos: "Todos",
};

const STEPS: RouteBarStep[] = [1, 2, 3, 4, 5, 6];

export default function DesignPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tiempo, setTiempo] = useState<string | null>("6m_2a");
  const [intereses, setIntereses] = useState<string[]>(["empresa_llc", "finanzas"]);
  const [estado, setEstado] = useState<string | null>("UT");
  const [paso, setPaso] = useState(2);

  const negocio = moduleBySlug("negocio");
  const boveda = moduleBySlug("boveda");
  const empleo = moduleBySlug("empleo");
  const academia = moduleBySlug("academia");

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      {/* Aviso */}
      <div className="mb-8 rounded-lg border border-amber-deep bg-amber-soft p-4">
        <p className="text-body font-semibold text-ink">
          Referencia interna de diseño — ANDEX-UI-2026-V1
        </p>
        <p className="mt-1 text-body text-ink">
          Esta pantalla no es parte del producto. Documenta el sistema de §2 del
          PRD: todas las variantes y estados del UI kit, los elementos firma y la
          matriz de contraste. Cambia el tema y el idioma aquí arriba para
          verificar los tres ejes de adaptación.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <LanguageToggle lang="es" backPath="/design" />
          <ThemeToggle />
          <span className="text-caption text-muted">
            El toggle de idioma es un enlace: funciona sin JavaScript.
          </span>
        </div>
      </div>

      <h1 className="mb-2 font-heading text-h1 text-ink">Sistema de diseño ANDEX</h1>
      <p className="mb-10 text-body-lg text-muted">
        Un solo elemento memorable — La Ruta. Todo lo demás es disciplinado y
        silencioso.
      </p>

      <div className="space-y-12">
        {/* ── Paleta ── */}
        <Section id="paleta" title="Paleta" source="§2.1">
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PALETTE.map((c) => (
              <li
                key={c.name}
                className="flex items-center gap-3 rounded-lg border border-line bg-surface p-3"
              >
                <span
                  aria-hidden="true"
                  className={`size-11 shrink-0 rounded-md border border-line ${c.swatch}`}
                />
                <div className="min-w-0">
                  <p className="text-body font-medium text-ink">
                    {c.name}{" "}
                    <span className="text-caption font-normal text-muted">{c.hex}</span>
                  </p>
                  <p className="text-caption text-muted">{c.note}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-sm border border-line bg-surface-alt p-3 text-body text-ink">
            <strong>Regla de oro:</strong> si un elemento lleva texto encima, el
            fondo es navy, blanco, crema, teal-deep o un tono <code>-soft</code>.
            Nunca #12B8A6 ni #F4B942 puros.
          </p>
        </Section>

        {/* ── Matriz de contraste ── */}
        <Section id="contraste" title="Matriz de contraste" source="§2.1.1 · obligatoria">
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full min-w-[34rem] border-collapse bg-surface text-left">
              <caption className="sr-only">
                Ratios de contraste de la paleta ANDEX contra WCAG 2.2 AA (4.5:1)
              </caption>
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className="p-3 text-label text-muted">Combinación</th>
                  <th scope="col" className="p-3 text-label text-muted">Ratio</th>
                  <th scope="col" className="p-3 text-label text-muted">AA</th>
                  <th scope="col" className="p-3 text-label text-muted">Uso</th>
                </tr>
              </thead>
              <tbody>
                {CONTRAST_MATRIX.map((row) => (
                  <tr key={row.combo} className="border-b border-line last:border-0">
                    <td className="p-3 text-body text-ink">{row.combo}</td>
                    <td className="p-3 text-body text-muted">{row.ratio}</td>
                    <td className="p-3 text-body">
                      <span className={row.ok ? "text-success" : "text-danger"}>
                        {row.ok ? "✅ Sí" : "❌ No"}
                      </span>
                    </td>
                    <td className="p-3 text-body text-muted">{row.use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* ── Tipografía ── */}
        <Section id="tipografia" title="Tipografía" source="§2.2.1 · base 16px, todo en rem">
          <div className="space-y-5 rounded-lg border border-line bg-surface p-5">
            {TYPE_SCALE.map((t) => (
              <div key={t.token}>
                <div className="text-caption text-muted">
                  <code>text-{t.token}</code> — {t.spec}
                </div>
                <p className={`${t.cls} ${t.heading ? "font-heading" : ""} text-ink`}>
                  Tu progreso cruza fronteras
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-caption text-muted">
            Montserrat para títulos (<code>font-heading</code>), Inter para texto.
            Ningún texto de cuerpo baja de 16px.
          </p>
        </Section>

        {/* ── Radios y sombras ── */}
        <Section id="radios" title="Radios y sombras" source="§2.3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {RADII.map((r) => (
              <div key={r.token} className="text-center">
                <div
                  aria-hidden="true"
                  className={`mb-2 h-16 w-full border border-line bg-surface-alt ${r.cls}`}
                />
                <p className="text-caption font-medium text-ink">{r.token}</p>
                <p className="text-caption text-muted">{r.use}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(["shadow-sm", "shadow-md", "shadow-lg"] as const).map((s) => (
              <div
                key={s}
                className={`rounded-lg border border-line bg-surface p-4 text-body text-muted ${s}`}
              >
                <code>{s}</code>
              </div>
            ))}
          </div>
        </Section>

        {/* ── La Ruta: hero ── */}
        <Section id="la-ruta-hero" title="La Ruta — hero" source="§2.8 · §3.1.1">
          <div className="rounded-xl border border-line bg-surface p-5">
            <LaRutaHero className="mx-auto max-w-md" />
          </div>
          <p className="mt-3 text-caption text-muted">
            Dos poblaciones, un destino. Se dibuja al cargar en 1.5 s con
            <code> stroke-dashoffset</code>; con <code>prefers-reduced-motion</code>{" "}
            aparece ya dibujada. Aparece <strong>una sola vez por pantalla</strong>.
          </p>
        </Section>

        {/* ── La Ruta: RouteBar ── */}
        <Section id="route-bar" title="La Ruta — RouteBar" source="§2.8 · 6 nodos">
          <div className="space-y-6 rounded-lg border border-line bg-surface p-5">
            {STEPS.map((s) => (
              <div key={s}>
                <p className="mb-2 text-label text-muted">
                  Paso {s} de 6{s === 6 ? " — meta alcanzada, el nodo 6 es el sello" : ""}
                </p>
                <RouteBar step={s} />
              </div>
            ))}
            <div className="border-t border-line pt-5">
              <p className="mb-2 text-label text-muted">
                Con <code>context</code>: solo se enciende el trazo de la rama del
                usuario (arriba <code>pre_arrival</code>, abajo <code>in_us</code>).
              </p>
              <div className="space-y-4">
                <RouteBar step={4} context="in_us" />
                <RouteBar step={4} context="pre_arrival" />
              </div>
            </div>
          </div>
          <p className="mt-3 text-caption text-muted">
            Nodos 11px · actual 13px teal con halo · sello 18px ámbar con halo ·
            conectores 1.5px · glifo de bifurcación en el nodo 2 a ±32°.
            El gráfico va <code>aria-hidden</code>; el consumidor pone el texto
            &ldquo;Paso X de Y&rdquo;.
          </p>
        </Section>

        {/* ── El sello ── */}
        <Section id="sello" title="El sello" source="§2.9 · solo en el paywall">
          <div className="flex flex-wrap items-center gap-6 rounded-lg border border-line bg-surface p-5">
            <Seal title="Tarifa congelada" subtitle="Tu precio no sube nunca" />
            <p className="max-w-sm text-body text-muted">
              Única concesión decorativa del sistema. Se usa una sola vez en todo
              el producto: la tarjeta del plan anual. Si aparece en badges o
              confirmaciones, pierde su significado.
            </p>
          </div>
        </Section>

        {/* ── Botones ── */}
        <Section id="botones" title="Button" source="§2.5 · 4 variantes × 6 estados">
          <div className="space-y-6 rounded-lg border border-line bg-surface p-5">
            {(["primary", "secondary", "ghost", "danger"] as const).map((v) => (
              <div key={v}>
                <div className="mb-2 text-caption font-semibold uppercase tracking-wide text-muted">
                  {v}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant={v}>Reposo</Button>
                  <Button variant={v} disabled>
                    Deshabilitado
                  </Button>
                  <Button variant={v} loading>
                    Guardando
                  </Button>
                  <Button variant={v} size="lg">
                    Grande
                  </Button>
                  <Button variant={v} href="/design">
                    Como enlace
                  </Button>
                </div>
              </div>
            ))}
            <p className="text-caption text-muted">
              Hover, active y focus-visible se comprueban interactuando: pasa el
              mouse, mantén pulsado y navega con Tab. Altura mínima 44px en todos
              los tamaños; <code>loading</code> marca <code>aria-busy</code> y
              anuncia el estado a los lectores.
            </p>
          </div>
        </Section>

        {/* ── Formularios ── */}
        <Section id="formularios" title="Input y Select" source="§2.5">
          <div className="grid grid-cols-1 gap-5 rounded-lg border border-line bg-surface p-5 sm:grid-cols-2">
            <Case label="default">
              <Input label="Nombre" placeholder="María" />
            </Case>
            <Case label="con ayuda">
              <Input
                label="Teléfono"
                type="tel"
                placeholder="+1 801 555 0134"
                help="Lo usamos solo para avisarte de tus trámites."
              />
            </Case>
            <Case label="error">
              <Input
                label="Correo electrónico"
                type="email"
                defaultValue="maria@"
                error="Falta el dominio del correo. Escríbelo completo, por ejemplo maria@correo.com."
              />
            </Case>
            <Case label="disabled">
              <Input label="Contraseña" type="password" defaultValue="secreta" disabled />
            </Case>
            <Case label="select — listas cortas">
              <Select label="¿Para quién buscas ayuda?" defaultValue="self">
                <option value="self">Para mí</option>
                <option value="family">Para un familiar</option>
                <option value="both">Para ambos</option>
              </Select>
            </Case>
            <Case label="select con error">
              <Select label="Plan de viaje" defaultValue="" error="Elige una opción para continuar.">
                <option value="" disabled>
                  Selecciona…
                </option>
                <option value="fecha_confirmada">Ya tengo fecha de viaje</option>
                <option value="este_ano">Quiero ir este año</option>
              </Select>
            </Case>
          </div>
          <p className="mt-3 text-caption text-muted">
            La etiqueta siempre es visible: el placeholder nunca hace de label.
            El error se asocia con <code>aria-describedby</code> y marca{" "}
            <code>aria-invalid</code>; dice qué pasó y cómo resolverlo.
          </p>
        </Section>

        {/* ── Chips ── */}
        <Section id="chips" title="OptionChips" source="§3.2 · el wizard entero">
          <div className="space-y-6 rounded-lg border border-line bg-surface p-5">
            <OptionChips
              label="¿Cuánto tiempo llevas en Estados Unidos?"
              options={TIEMPO_EN_US}
              value={tiempo}
              onChange={setTiempo}
            />
            <OptionChips
              multiple
              label="¿Qué te interesa? (varias opciones)"
              options={INTERESES}
              value={intereses}
              onChange={setIntereses}
            />
            <OptionChips
              label="Con opciones deshabilitadas"
              options={[
                { value: "a", label: "Disponible" },
                { value: "b", label: "No disponible", disabled: true },
              ]}
              value={null}
              onChange={() => {}}
            />
            <p className="text-caption text-muted">
              Única = <code>radiogroup</code> con roving tabindex (las flechas
              mueven y seleccionan). Múltiple = <code>checkbox</code> con Tab entre
              chips. Seleccionado: borde teal-deep, fondo teal-soft, texto ink.
              Seleccionado ahora: {tiempo ?? "—"} · {intereses.join(", ") || "—"}
            </p>
          </div>
        </Section>

        {/* ── Combobox ── */}
        <Section id="combobox" title="Combobox con búsqueda" source="Anexo C.1">
          <div className="rounded-lg border border-line bg-surface p-5">
            <div className="max-w-sm">
              <Combobox
                label="Estado"
                placeholder="Escribe para buscar…"
                items={ESTADOS}
                groupLabels={GRUPOS_ESTADOS}
                value={estado}
                onChange={setEstado}
                help="Busca escribiendo; los acentos no importan. Guardamos el código ISO."
              />
            </div>
            <p className="mt-4 text-caption text-muted">
              Obligatorio para estados y países: 52 entradas en un{" "}
              <code>&lt;select&gt;</code> nativo son inusables en móvil. Flechas
              para navegar, Enter para elegir, Escape para cerrar;{" "}
              <code>aria-activedescendant</code> mantiene el foco en el input.
              Valor actual: <code>{estado ?? "—"}</code>
            </p>
            <div className="mt-5 max-w-sm">
              <Combobox
                label="Estado (con error)"
                items={ESTADOS}
                groupLabels={GRUPOS_ESTADOS}
                value={null}
                onChange={() => {}}
                error="Elige un estado para ver los trámites que te corresponden."
              />
            </div>
          </div>
        </Section>

        {/* ── Badges ── */}
        <Section id="badges" title="Badge" source="§2.5">
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface p-5">
            <Badge variant="teal">Teal</Badge>
            <Badge variant="amber">Recomendado para ti</Badge>
            <Badge variant="navy">Navy</Badge>
            <Badge variant="neutral">Pronto</Badge>
          </div>
          <p className="mt-3 text-caption text-muted">
            El ámbar puro solo existe como fondo de badge, con texto navy encima
            (8.2:1). El teal puro nunca lleva texto: el badge teal usa teal-soft.
          </p>
        </Section>

        {/* ── Progreso ── */}
        <Section id="progreso" title="ProgressBar" source="§2.5 · §3.2">
          <div className="space-y-6 rounded-lg border border-line bg-surface p-5">
            <ProgressBar variant="linear" value={paso} max={5} label={`Paso ${paso} de 5`} />
            <ProgressBar variant="steps" value={paso} max={5} label={`Paso ${paso} de 5`} />
            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                onClick={() => setPaso((p) => Math.max(1, p - 1))}
              >
                Atrás
              </Button>
              <Button onClick={() => setPaso((p) => Math.min(5, p + 1))}>
                Siguiente
              </Button>
            </div>
            <p className="text-caption text-muted">
              El teal es la superficie del relleno; el riel es teal-soft. El texto
              &ldquo;Paso X de 5&rdquo; es visible y alimenta{" "}
              <code>aria-valuetext</code>.
            </p>
          </div>
        </Section>

        {/* ── ModuleCard ── */}
        <Section id="module-card" title="ModuleCard" source="§4.4 · §4.5">
          <div className="space-y-6">
            <Case label="hero — recommended (anatomía §4.4)">
              <ModuleCard
                variant="hero"
                state="recommended"
                slug="negocio"
                accentColor={negocio?.accentColor}
                title="Desarrollo Empresarial"
                reason="Porque dijiste que quieres formalizar tu negocio en los próximos 30 días."
                onOpen={() => toast.success("Abriendo Desarrollo Empresarial")}
                onDismiss={() => toast.info("Gracias: eso ayuda a afinar tus recomendaciones")}
              />
            </Case>

            <Case label="grid — available / coming-soon / loading">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <ModuleCard
                  slug="boveda"
                  accentColor={boveda?.accentColor}
                  title="Bóveda Digital y Alertas"
                  description="Guarda tu pasaporte, tus permisos y tus fechas límite en un solo lugar."
                  onOpen={() => toast.info("Abriendo Bóveda Digital")}
                />
                <ModuleCard
                  slug="academia"
                  state="coming-soon"
                  accentColor={academia?.accentColor}
                  title="Academia de Certificaciones"
                  description="Certifícate en impuestos, seguros y bienes raíces."
                  onOpen={() => toast.info("Abriendo Academia")}
                />
                <ModuleCard slug="empleo" state="loading" title="Conexión Laboral" />
              </div>
            </Case>

            <Case label="list — available y recommended">
              <div className="space-y-3">
                <ModuleCard
                  variant="list"
                  slug="empleo"
                  accentColor={empleo?.accentColor}
                  title="Conexión Laboral"
                  description="Cómo funciona el mercado laboral y dónde están las vacantes reales."
                  onOpen={() => toast.info("Abriendo Conexión Laboral")}
                />
                <ModuleCard
                  variant="list"
                  state="recommended"
                  slug="negocio"
                  accentColor={negocio?.accentColor}
                  title="Desarrollo Empresarial"
                  description="Crea tu LLC en Utah paso a paso."
                  onOpen={() => toast.info("Abriendo Desarrollo Empresarial")}
                />
              </div>
            </Case>
          </div>
          <p className="mt-3 text-caption text-muted">
            El acento del módulo es solo la superficie suave detrás del icono;
            el icono va en <code>text-ink</code> y en gris cuando es{" "}
            <code>coming-soon</code>. La tarjeta de grid y de lista es accionable
            entera; la hero tiene sus dos botones porque anidar controles rompe el
            teclado. &ldquo;No es lo que busco&rdquo; nunca se esconde: es la señal
            más honesta que recibe el motor.
          </p>
        </Section>

        {/* ── Modal ── */}
        <Section id="modal" title="Modal" source="§2.5 · <dialog> nativo">
          <div className="flex flex-wrap gap-3 rounded-lg border border-line bg-surface p-5">
            <Button variant="secondary" onClick={() => setModalOpen(true)}>
              Abrir modal
            </Button>
            <Button variant="secondary" onClick={() => setSheetOpen(true)}>
              Abrir fullscreen-mobile
            </Button>
          </div>
          <p className="mt-3 text-caption text-muted">
            Focus trap, Escape y clic en el fondo cierran; el cuerpo tiene scroll
            propio y el título queda asociado con <code>aria-labelledby</code>.
            La variante <code>fullscreen-mobile</code> ocupa la pantalla por debajo
            de 640px y se centra con radius-xl en escritorio.
          </p>

          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Cancelar tu membresía"
            footer={
              <>
                <Button variant="ghost" onClick={() => setModalOpen(false)}>
                  Mejor no
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    setModalOpen(false);
                    toast.error("Ejemplo: aquí iría el error o la confirmación");
                  }}
                >
                  Cancelar membresía
                </Button>
              </>
            }
          >
            <p className="text-body text-muted">
              Conservas el acceso hasta el final del periodo que ya pagaste.
              Puedes volver cuando quieras, aunque el precio congelado se pierde.
            </p>
          </Modal>

          <Modal
            open={sheetOpen}
            onClose={() => setSheetOpen(false)}
            title="¿Qué necesitas de este módulo?"
            variant="fullscreen-mobile"
            footer={
              <Button onClick={() => setSheetOpen(false)}>Avísame cuando esté listo</Button>
            }
          >
            <div className="space-y-4">
              <p className="text-body text-muted">
                Cuéntanoslo con tus palabras. Es lo primero que vamos a construir.
              </p>
              <Input label="Lo primero que necesito" placeholder="Renovar mi permiso de trabajo" />
              <div className="h-64 rounded-sm border border-dashed border-line p-3 text-caption text-muted">
                Relleno para comprobar el scroll interno.
              </div>
            </div>
          </Modal>
        </Section>

        {/* ── Toasts ── */}
        <Section id="toasts" title="Toast" source="§2.5 · aria-live polite">
          <div className="flex flex-wrap gap-3 rounded-lg border border-line bg-surface p-5">
            <Button variant="secondary" onClick={() => toast.success("Tus datos quedaron guardados")}>
              success
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                toast.error("No pudimos guardar los cambios. Revisa tu conexión y vuelve a intentarlo.")
              }
            >
              error
            </Button>
            <Button variant="secondary" onClick={() => toast.info("Tu sesión sigue activa")}>
              info
            </Button>
          </div>
          <p className="mt-3 text-caption text-muted">
            Se apilan en cola, se cierran solos a los 5 s y la cuenta atrás se
            pausa al pasar el mouse o al enfocar el aviso.
          </p>
        </Section>

        {/* ── Skeleton ── */}
        <Section id="skeleton" title="Skeleton" source="§2.5">
          <div className="grid grid-cols-1 gap-5 rounded-lg border border-line bg-surface p-5 sm:grid-cols-3">
            <Case label="card">
              <Skeleton variant="card" />
            </Case>
            <Case label="text">
              <Skeleton variant="text" lines={4} />
            </Case>
            <Case label="avatar">
              <Skeleton variant="avatar" />
            </Case>
          </div>
        </Section>

        {/* ── EmptyState ── */}
        <Section id="empty" title="EmptyState" source="§2.5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-line bg-surface">
              <EmptyState
                icon={<Inbox />}
                title="Todavía no hay documentos"
                description="Sube tu pasaporte o tu permiso y te avisamos antes de cada vencimiento."
                action={<Button>Subir un documento</Button>}
              />
            </div>
            <div className="rounded-lg border border-line bg-surface">
              <EmptyState
                icon={<Compass />}
                title="Sin resultados"
                description="Prueba con otra palabra o revisa todos los módulos."
              />
            </div>
          </div>
        </Section>
      </div>

      <footer className="mt-12 border-t border-line pt-6 text-caption text-muted">
        ANDEX-UI-2026-V1 · Tokens en <code>app/globals.css</code> · Componentes en{" "}
        <code>components/ui</code> y <code>components/</code>. Toda decisión visual
        no escrita en el PRD se resuelve con criterio sobrio y se documenta.
      </footer>
    </main>
  );
}
