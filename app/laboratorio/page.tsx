"use client";

/**
 * LABORATORIO — las tres librerías, funcionando dentro de este proyecto.
 *
 * No es una pantalla de producto: es la prueba de que lo elegido sirve
 * aquí, en un teléfono, antes de construir nada encima. Cada bloque dice
 * de dónde sale y qué hubo que cambiar para que funcione sin ratón.
 */

import { useEffect, useRef, useState } from "react";
import { ThinkingOrb, type OrbState } from "thinking-orbs";
import { AnimatedIcon } from "@/components/motion/animated-icon";
import { Appear } from "@/components/motion/appear";
import { ShieldCheckIcon } from "@/components/icons/shield-check";
import { ScanTextIcon } from "@/components/icons/scan-text";
import { SparklesIcon } from "@/components/icons/sparkles";
import { GavelIcon } from "@/components/icons/gavel";
import { GraduationCapIcon } from "@/components/icons/graduation-cap";
import { UsersIcon } from "@/components/icons/users";
import { BellIcon } from "@/components/icons/bell";
import { SettingsIcon } from "@/components/icons/settings";

const APPS = [
  { slug: "boveda", nombre: "Bóveda", icon: ShieldCheckIcon, acc: "var(--acc-boveda)" },
  { slug: "escaner", nombre: "Escáner", icon: ScanTextIcon, acc: "var(--acc-escaner)" },
  { slug: "ia", nombre: "Asistente", icon: SparklesIcon, acc: "var(--acc-ia)" },
  { slug: "legal", nombre: "X Legal", icon: GavelIcon, acc: "var(--acc-legal)" },
  { slug: "ingles", nombre: "Inglés", icon: GraduationCapIcon, acc: "var(--acc-ingles)" },
  { slug: "comunidad", nombre: "Comunidad", icon: UsersIcon, acc: "var(--acc-comunidad)" },
  { slug: "avisos", nombre: "Avisos", icon: BellIcon, acc: "var(--acc-ia)" },
  { slug: "ajustes", nombre: "Ajustes", icon: SettingsIcon, acc: "var(--os-muted)" },
];

const ESTADOS: { estado: OrbState; para: string }[] = [
  { estado: "searching", para: "buscando en tus documentos" },
  { estado: "solving", para: "el escáner enderezando la foto" },
  { estado: "listening", para: "el asistente esperando tu pregunta" },
  { estado: "working", para: "generando tu PDF" },
];

const FILTROS = ["Todos", "Vence pronto", "Sin fecha"];

export default function Laboratorio() {
  const [filtro, setFiltro] = useState(0);
  const [docs, setDocs] = useState(12);
  const [aviso, setAviso] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [marcado, setMarcado] = useState(false);
  const [paso, setPaso] = useState(2);
  const reloj = useRef<number | null>(null);

  useEffect(() => () => { if (reloj.current) window.clearTimeout(reloj.current); }, []);

  const mostrarAviso = () => {
    setAviso(true);
    if (reloj.current) window.clearTimeout(reloj.current);
    reloj.current = window.setTimeout(() => setAviso(false), 2200);
  };

  const copiar = () => {
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 1400);
  };

  // El anillo: 40 días restantes sobre una validez de 365.
  const pct = 40 / 365;

  return (
    <main className="shell-os min-h-dvh px-4 pb-24 pt-6">
      <div
        aria-live="polite"
        data-show={aviso ? "true" : "false"}
        className="k-toast k-glass k-glass-hi fixed left-1/2 top-4 z-50 px-4 py-3 text-[0.9375rem]"
      >
        Documento guardado
      </div>

      <header className="mx-auto w-full max-w-md">
        <p className="text-[0.8125rem] uppercase tracking-[0.14em]" style={{ color: "var(--acc-escaner)" }}>
          Laboratorio
        </p>
        <h1 className="mt-1 text-[1.75rem] font-bold leading-tight">
          Las tres librerías, aquí dentro
        </h1>
        <p className="mt-2 text-[0.9375rem]" style={{ color: "var(--os-muted)" }}>
          Todo lo de abajo se dispara con el dedo. Ninguna pieza depende del ratón.
        </p>
      </header>

      <div className="mx-auto mt-8 w-full max-w-md space-y-8">
        {/* ── 1 · Iconos animados ── */}
        <Appear index={0}>
          <section aria-labelledby="lab-iconos" className="k-glass p-4">
            <h2 id="lab-iconos" className="text-[1.0625rem] font-semibold">Iconos · lucide-animated</h2>
            <p className="mt-1 text-[0.875rem]" style={{ color: "var(--os-muted)" }}>
              Vienen atados a <code>mouseenter</code>. Aquí se disparan al tocarlos.
              Tócalos.
            </p>
            <ul className="mt-4 grid grid-cols-4 gap-x-2 gap-y-4">
              {APPS.map((app) => (
                <li key={app.slug}>
                  <button
                    type="button"
                    className="k-press flex w-full flex-col items-center gap-1.5"
                    aria-label={app.nombre}
                  >
                    <span
                      className="flex size-[58px] items-center justify-center rounded-[18px] border"
                      style={{
                        color: app.acc,
                        background: "var(--os-card-hi)",
                        borderColor: "var(--os-edge)",
                      }}
                    >
                      <AnimatedIcon icon={app.icon} size={26} trigger="tap" />
                    </span>
                    <span className="text-[0.75rem]" style={{ color: "var(--os-muted)" }}>
                      {app.nombre}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </Appear>

        {/* ── 2 · Orbes ── */}
        <Appear index={1}>
          <section aria-labelledby="lab-orbes" className="k-glass p-4">
            <h2 id="lab-orbes" className="text-[1.0625rem] font-semibold">Estados · thinking-orbs</h2>
            <p className="mt-1 text-[0.875rem]" style={{ color: "var(--os-muted)" }}>
              Nueve estados en canvas 2D. Sirven para decir <em>qué</em> está pasando,
              no sólo que hay que esperar.
            </p>
            <ul className="mt-4 space-y-3">
              {ESTADOS.map(({ estado, para }) => (
                <li key={estado} className="flex items-center gap-3">
                  <ThinkingOrb state={estado} size={64} theme="dark" aria-label={para} />
                  <div className="min-w-0">
                    <p className="text-[0.9375rem] font-medium">{estado}</p>
                    <p className="text-[0.875rem]" style={{ color: "var(--os-muted)" }}>{para}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </Appear>

        {/* ── 3 · Kinetics, ya traducido al dedo ── */}
        <Appear index={2}>
          <section aria-labelledby="lab-kinetics" className="k-glass p-4">
            <h2 id="lab-kinetics" className="text-[1.0625rem] font-semibold">Movimiento · Kinetics</h2>
            <p className="mt-1 text-[0.875rem]" style={{ color: "var(--os-muted)" }}>
              Curva de la casa: <code>cubic-bezier(0.34, 1.56, 0.64, 1)</code>.
            </p>

            {/* Píldoras */}
            <div className="mt-4 flex flex-wrap gap-2">
              {FILTROS.map((f, i) => (
                <button
                  key={f}
                  type="button"
                  className="k-pill"
                  aria-pressed={filtro === i}
                  style={{ ["--acc" as string]: "var(--acc-boveda)" }}
                  onClick={() => setFiltro(i)}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Anillo de vencimiento */}
            <div className="mt-5 flex items-center gap-4">
              <svg viewBox="0 0 80 80" className="k-ring size-[72px] shrink-0" style={{ ["--pct" as string]: pct }}>
                <circle cx="40" cy="40" r="34" fill="none" stroke="var(--os-edge)" strokeWidth="6" />
                <circle
                  className="prog"
                  cx="40" cy="40" r="34" fill="none"
                  stroke="var(--acc-legal)" strokeWidth="6" strokeLinecap="round"
                />
                <text x="40" y="45" textAnchor="middle" fontSize="19" fontWeight="700" fill="var(--os-ink)">40</text>
              </svg>
              <div className="min-w-0">
                <p className="text-[0.9375rem] font-medium">Permiso de trabajo</p>
                <p className="text-[0.875rem]" style={{ color: "var(--os-muted)" }}>
                  Vence en 40 días
                </p>
              </div>
            </div>

            {/* Pasos */}
            <div className="k-steps mt-5">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPaso(n)}
                    data-active={paso === n}
                    /* 44px, no 36: por debajo de eso el dedo falla. Es la
                       misma regla que ya se aplica en el resto del producto
                       y aquí me la había saltado. */
                    className="step flex size-11 items-center justify-center rounded-full text-[0.875rem] font-semibold"
                    style={{
                      background: n <= paso ? "var(--acc-boveda)" : "var(--os-card-hi)",
                      color: n <= paso ? "var(--on-accent)" : "var(--os-muted)",
                    }}
                    aria-label={`Paso ${n} de 5`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="track mt-3 h-1.5 overflow-hidden rounded-full" style={{ background: "var(--os-edge)" }}>
                <i style={{ ["--p" as string]: (paso - 1) / 4 }} />
              </div>
            </div>

            {/* Marca que se dibuja */}
            <button
              type="button"
              onClick={() => setMarcado((v) => !v)}
              data-checked={marcado}
              className="k-check k-press mt-5 flex min-h-11 items-center gap-3"
            >
              <span
                className="flex size-6 items-center justify-center rounded-md border-2 transition-colors"
                style={{
                  borderColor: marcado ? "var(--acc-boveda)" : "var(--os-edge-hi)",
                  background: marcado ? "var(--acc-boveda)" : "transparent",
                }}
              >
                <svg viewBox="0 0 24 24" className="size-4">
                  <path className="tick" d="M5 13l4 4L19 7" fill="none" stroke="var(--on-accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="text-[0.9375rem]">Ya tengo permiso de trabajo</span>
            </button>

            {/* Copiar + aviso */}
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copiar}
                data-copied={copiado}
                className="k-copy k-press inline-flex min-h-11 items-center gap-2 rounded-xl px-4"
                style={{ background: "var(--os-card-hi)", border: "1px solid var(--os-edge)" }}
              >
                <span className="relative size-5">
                  <svg viewBox="0 0 24 24" className="ic ic-copy size-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 012-2h10" />
                  </svg>
                  <svg viewBox="0 0 24 24" className="ic ic-check size-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {copiado ? "Copiado" : "Copiar enlace"}
              </button>

              <button
                type="button"
                onClick={() => { setDocs((n) => n + 1); mostrarAviso(); }}
                className="k-press inline-flex min-h-11 items-center rounded-xl px-4 font-semibold"
                style={{ background: "var(--acc-boveda)", color: "var(--on-accent)" }}
              >
                Guardar documento
              </button>
            </div>

            {/* El icono que avisa de un cambio real */}
            <div className="mt-5 flex items-center gap-3">
              <span style={{ color: "var(--acc-boveda)" }}>
                <AnimatedIcon icon={ShieldCheckIcon} size={30} trigger="state" watch={docs} />
              </span>
              <p className="text-[0.875rem]" style={{ color: "var(--os-muted)" }}>
                <strong style={{ color: "var(--os-ink)" }}>{docs} documentos</strong> — el escudo
                se anima porque acaba de pasar algo, no porque pases el dedo.
              </p>
            </div>
          </section>
        </Appear>

        {/* ── 4 · Borde vivo ── */}
        <Appear index={3}>
          <div className="k-beam">
            <section className="k-glass k-glass-hi p-4">
              <div className="flex items-center gap-2">
                <span className="relative flex size-2.5">
                  <span className="k-badge absolute inset-0" style={{ ["--acc" as string]: "var(--acc-escaner)" }} />
                  <span className="size-2.5 rounded-full" style={{ background: "var(--acc-escaner)" }} />
                </span>
                <p className="text-[0.8125rem] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--acc-escaner)" }}>
                  La sala está abierta
                </p>
              </div>
              <h2 className="mt-2 text-[1.25rem] font-bold">Inglés para el trabajo</h2>
              <p className="mt-1 text-[0.9375rem]" style={{ color: "var(--os-muted)" }}>
                El borde sólo se enciende cuando hay clase. No es adorno: es información.
              </p>
            </section>
          </div>
        </Appear>

        {/* ── 5 · Respuesta por trozos ── */}
        <Appear index={4}>
          <section aria-labelledby="lab-tokens" className="k-glass p-4">
            <h2 id="lab-tokens" className="text-[1.0625rem] font-semibold">Respuesta del asistente</h2>
            <p className="mt-3 text-[1rem] leading-relaxed">
              {"El I-130 suele tardar entre 10 y 14 meses.".split(" ").map((p, i) => (
                <span key={`${p}-${i}`} className="k-token mr-[0.28em]" style={{ ["--i" as string]: i }}>
                  {p}
                </span>
              ))}
            </p>
            <p className="mt-3 inline-flex rounded-full px-3 py-1.5 text-[0.875rem]"
               style={{ background: "var(--os-card-hi)", color: "var(--os-muted)" }}>
              Fuente: USCIS
            </p>
          </section>
        </Appear>
      </div>
    </main>
  );
}
