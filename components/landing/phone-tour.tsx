"use client";

/**
 * RECORRIDO DEL PRODUCTO — el teléfono del hero, narrado.
 *
 * Una demostración, no una galería. En medio minuto el visitante ve las
 * preguntas que le vamos a hacer, el panel que recibe a cambio y la
 * comunidad que hay dentro. Cada paso responde a una objeción concreta antes
 * de que la formule.
 *
 * Decisiones que sostienen el conjunto:
 *
 *  · **La narración va FUERA del teléfono.** Dentro sería un cartel dentro
 *    de la interfaz —algo que el producto real no tiene— y restaría
 *    credibilidad justo donde hace falta.
 *  · **Es CSS y SVG.** ~5 KB frente a los megas de un vídeo, nítido a
 *    cualquier densidad, hereda los tokens (modo oscuro gratis) y no queda
 *    desfasado cuando cambie la interfaz.
 *  · **Se puede controlar.** Se pausa al pasar el ratón o al enfocar, y los
 *    puntos permiten saltar a cualquier paso. Quien quiera leer, lee.
 *  · **Con `prefers-reduced-motion` no rota solo**: se queda en el panel, que
 *    es el paso que más vende, y los puntos siguen funcionando.
 */

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Bell,
  Home,
  Briefcase,
  Building2,
  Calendar,
  Check,
  FolderLock,
  GraduationCap,
  MapPin,
  Plane,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import type { TourDict } from "@/lib/i18n/dictionaries/tour";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;
/**
 * Duración de cada paso. Suman ~24 s: bastante para leerlo todo sin que
 * nadie se quede esperando. El panel y la comunidad duran más porque tienen
 * más que leer; la bienvenida es un respiro corto.
 */
const DURATIONS = [3400, 3600, 4000, 3400, 5200, 4800];
const TILE_ICONS = [FolderLock, Briefcase, TrendingUp, Users, GraduationCap, Plane];

export type PhoneTourProps = {
  copy: TourDict;
  className?: string;
};

// ─── Piezas compartidas del teléfono ─────────────────────

/** Barra superior de la app. Igual en todos los pasos: es la app, no un cartel. */
function AppBar({ chip }: { chip: string }) {
  return (
    <div className="flex items-center justify-between px-4 pb-2.5 pt-[2.6rem]">
      <span className="font-heading text-caption font-bold tracking-[0.14em] text-ink">
        ANDEX
      </span>
      <span className="flex items-center gap-1.5">
        <span className="rounded-full bg-teal-soft px-2 py-0.5 text-[0.625rem] font-semibold text-teal-deep">
          {chip}
        </span>
        <Bell aria-hidden="true" className="size-3.5 text-muted" />
        <span className="flex size-5 items-center justify-center rounded-full bg-navy text-[0.5625rem] font-bold text-white">
          M
        </span>
      </span>
    </div>
  );
}

/** Cabecera de un paso del registro: barra de progreso y pregunta. */
function StepHeader({
  progress,
  question,
  help,
  filled,
}: {
  progress: string;
  question: string;
  help: string;
  /** Proporción 0–1 de la barra. */
  filled: number;
}) {
  return (
    <>
      <p className="text-[0.5625rem] font-semibold uppercase tracking-wider text-muted">
        {progress}
      </p>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-line">
        <motion.div
          className="h-full rounded-full bg-teal"
          initial={{ width: 0 }}
          animate={{ width: `${filled * 100}%` }}
          transition={{ duration: 0.8, ease: EASE }}
        />
      </div>
      <p className="mt-3 font-heading text-[0.9375rem] font-bold leading-tight text-ink">
        {question}
      </p>
      <p className="mt-1 text-[0.625rem] leading-snug text-muted">{help}</p>
    </>
  );
}

// ─── Pantalla 1 · La bifurcación ─────────────────────────

// ─── Pantalla 0 · La bienvenida ──────────────────────────

/**
 * Apertura de la app. Fondo navy —rompe a propósito con el crema de todas
 * las demás pantallas— y La Ruta dibujándose sola: dos caminos que nacen
 * separados y acaban en el mismo nodo.
 *
 * Es el elemento firma del sistema (§2.8) haciendo aquí un trabajo real:
 * cuenta la promesa de marca (dos poblaciones, un destino) sin una sola
 * frase publicitaria. El teal es el camino de quien ya está aquí; el ámbar,
 * el de quien viene en camino.
 */
function ScreenWelcome({ s }: { s: TourDict["steps"]["welcome"] }) {
  return (
    <div className="-mx-4 flex h-full flex-col items-center justify-center bg-navy px-6 text-center">
      <div className="relative w-full max-w-[13rem] pt-4">
        <svg viewBox="0 0 240 150" fill="none" aria-hidden="true" className="w-full">
          {/* Rama de quien ya está aquí */}
          <motion.path
            d="M 22 24 C 22 84, 72 120, 120 120"
            stroke="var(--teal)"
            strokeWidth={2.5}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            initial={{ strokeDashoffset: 1 }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 1.1, delay: 0.25, ease: EASE }}
          />
          {/* Rama de quien viene en camino */}
          <motion.path
            d="M 218 24 C 218 84, 168 120, 120 120"
            stroke="var(--amber)"
            strokeWidth={2.5}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            initial={{ strokeDashoffset: 1 }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 1.1, delay: 0.4, ease: EASE }}
          />
          {/* Nodos de origen */}
          <motion.circle
            cx={22}
            cy={24}
            r={4.5}
            fill="var(--navy)"
            stroke="var(--teal)"
            strokeWidth={2.5}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.18, type: "spring", stiffness: 400, damping: 16 }}
            style={{ transformOrigin: "22px 24px" }}
          />
          <motion.circle
            cx={218}
            cy={24}
            r={4.5}
            fill="var(--navy)"
            stroke="var(--amber)"
            strokeWidth={2.5}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.33, type: "spring", stiffness: 400, damping: 16 }}
            style={{ transformOrigin: "218px 24px" }}
          />
          {/* Convergencia: el halo respira una vez cuando llegan los caminos */}
          <motion.circle
            cx={120}
            cy={120}
            r={18}
            fill="var(--teal)"
            opacity={0.2}
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.3, 1] }}
            transition={{ delay: 1.3, duration: 0.75, ease: EASE }}
            style={{ transformOrigin: "120px 120px" }}
          />
          <motion.circle
            cx={120}
            cy={120}
            r={7.5}
            fill="var(--teal)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.32, type: "spring", stiffness: 320, damping: 15 }}
            style={{ transformOrigin: "120px 120px" }}
          />
        </svg>

        {/* Etiquetas de cada camino. Van ENCIMA del nodo de origen, nunca a
            su lado: los trazos descienden desde ahí y tachaban el texto. */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="absolute left-0 top-0 whitespace-nowrap text-left text-[0.5rem] font-semibold uppercase leading-none tracking-wider text-teal"
        >
          {s.pathTop}
        </motion.span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.72, duration: 0.5 }}
          className="absolute right-0 top-0 whitespace-nowrap text-right text-[0.5rem] font-semibold uppercase leading-none tracking-wider text-amber"
        >
          {s.pathBottom}
        </motion.span>
      </div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.55, duration: 0.55, ease: EASE }}
        className="mt-5 font-heading text-[1.375rem] font-bold tracking-[0.18em] text-white"
      >
        {s.brand}
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.75, duration: 0.5 }}
        className="mt-1 text-[0.625rem] text-white/70"
      >
        {s.tagline}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.05, duration: 0.5, ease: EASE }}
        className="mt-7 border-t border-white/15 pt-4"
      >
        <p className="text-[0.8125rem] font-semibold text-white">{s.greeting}</p>
        <p className="mt-0.5 text-[0.625rem] text-white/60">{s.hint}</p>
      </motion.div>
    </div>
  );
}

/** Botón de avance: hace que un paso del registro parezca una pantalla real. */
function NextButton({ label, delay }: { label: string; delay: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: EASE }}
      className="mb-3 mt-auto block rounded-sm bg-teal-deep py-2 text-center text-[0.6875rem] font-semibold text-on-accent"
    >
      {label}
    </motion.span>
  );
}

function ScreenBranch({
  s,
  next,
}: {
  s: TourDict["steps"]["branch"];
  next: string;
}) {
  return (
    <div className="flex h-full flex-col">
      <StepHeader progress={s.progress} question={s.question} help={s.help} filled={0.2} />
      <div className="mt-4 space-y-2">
        {s.options.map((opt, i) => {
          const active = i === s.chosen;
          return (
            <motion.div
              key={opt.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.12, duration: 0.4, ease: EASE }}
              className={cn(
                "flex items-start gap-2 rounded-md border-2 p-2.5",
                active
                  ? "border-teal-deep bg-teal-soft"
                  : "border-line bg-surface",
              )}
            >
              <span
                className={cn(
                  "mt-px flex size-4 shrink-0 items-center justify-center rounded-full border-2",
                  active ? "border-teal-deep bg-teal-deep" : "border-line",
                )}
              >
                {active ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.1, type: "spring", stiffness: 400, damping: 18 }}
                  >
                    <Check aria-hidden="true" className="size-2.5 text-on-accent" />
                  </motion.span>
                ) : null}
              </span>
              <span className="min-w-0">
                <span className="block text-[0.6875rem] font-semibold leading-tight text-ink">
                  {opt.title}
                </span>
                <span className="mt-0.5 block text-[0.5625rem] text-muted">{opt.body}</span>
              </span>
            </motion.div>
          );
        })}
      </div>
      <NextButton label={next} delay={1.35} />
    </div>
  );
}

// ─── Pantalla 2 · Los intereses ──────────────────────────

function ScreenInterests({
  s,
  next,
}: {
  s: TourDict["steps"]["interests"];
  next: string;
}) {
  return (
    <div className="flex h-full flex-col">
      <StepHeader progress={s.progress} question={s.question} help={s.help} filled={0.8} />
      <div className="mt-3.5 flex flex-wrap gap-1.5">
        {s.options.map((opt, i) => {
          const pick = s.chosen.indexOf(i);
          const active = pick !== -1;
          return (
            <motion.span
              key={opt}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.05, duration: 0.3 }}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[0.5625rem] font-medium",
                active
                  ? "border-teal-deep bg-teal-soft text-teal-deep"
                  : "border-line bg-surface text-muted",
              )}
            >
              {active ? (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    // Se marcan en secuencia: se ve a alguien eligiendo.
                    delay: 0.9 + pick * 0.55,
                    type: "spring",
                    stiffness: 420,
                    damping: 18,
                  }}
                >
                  <Check aria-hidden="true" className="size-2.5" />
                </motion.span>
              ) : null}
              {opt}
            </motion.span>
          );
        })}
      </div>
      <NextButton label={next} delay={2.1} />
    </div>
  );
}

// ─── Pantalla 3 · El objetivo ────────────────────────────

function ScreenGoal({ s }: { s: TourDict["steps"]["goal"] }) {
  return (
    <div className="flex h-full flex-col">
      <StepHeader progress={s.progress} question={s.question} help={s.help} filled={1} />
      <div className="mt-3.5 space-y-1.5">
        {s.options.map((opt, i) => {
          const active = i === s.chosen;
          return (
            <motion.div
              key={opt}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.09, duration: 0.35 }}
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-2.5 py-2 text-[0.625rem]",
                active
                  ? "border-teal-deep bg-teal-soft font-semibold text-teal-deep"
                  : "border-line bg-surface text-muted",
              )}
            >
              {active ? <Check aria-hidden="true" className="size-2.5 shrink-0" /> : null}
              {opt}
            </motion.div>
          );
        })}
      </div>
      <motion.span
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3, duration: 0.4, ease: EASE }}
        className="mt-auto mb-3 block rounded-sm bg-teal-deep py-2 text-center text-[0.6875rem] font-semibold text-on-accent"
      >
        {s.cta}
      </motion.span>
    </div>
  );
}

// ─── Pantalla 4 · El panel ───────────────────────────────

function ScreenPanel({ s }: { s: TourDict["steps"]["panel"] }) {
  return (
    <div className="flex h-full flex-col">
      <p className="text-[0.625rem] text-muted">{s.greeting}</p>
      <p className="mt-0.5 font-heading text-[0.9375rem] font-bold leading-tight text-ink">
        {s.headline}
      </p>

      <div className="mt-2.5 rounded-md border border-line bg-surface px-2.5 py-2">
        <p className="text-[0.5625rem] font-semibold uppercase tracking-wider text-muted">
          {s.goalLabel}
        </p>
        <p className="mt-0.5 text-[0.6875rem] text-ink">{s.goal}</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16, duration: 0.4, ease: EASE }}
        className="mt-2.5 rounded-lg border border-teal-deep bg-surface p-2.5 shadow-sm"
      >
        <span className="inline-flex items-center gap-1 rounded-full bg-amber px-1.5 py-0.5 text-[0.5rem] font-bold uppercase tracking-wider text-on-highlight">
          <Star aria-hidden="true" className="size-2" />
          {s.badge}
        </span>
        <div className="mt-2 flex items-start gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-sm bg-teal-soft text-teal-deep">
            <Building2 aria-hidden="true" className="size-3.5" />
          </span>
          <div className="min-w-0">
            <p className="font-heading text-[0.75rem] font-semibold leading-tight text-ink">
              {s.cardTitle}
            </p>
            <p className="mt-0.5 text-[0.625rem] leading-snug text-muted">
              {s.cardReason}
            </p>
          </div>
        </div>
        <span className="mt-2 block rounded-sm bg-teal-deep py-1.5 text-center text-[0.625rem] font-semibold text-on-accent">
          {s.cardCta}
        </span>
      </motion.div>

      <p className="mt-3 text-[0.5625rem] font-semibold uppercase tracking-wider text-muted">
        {s.gridLabel}
      </p>
      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
        {s.tiles.map((tile, i) => {
          const Icon = TILE_ICONS[i % TILE_ICONS.length];
          return (
            <motion.div
              key={tile}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26 + i * 0.05, duration: 0.32 }}
              className="flex items-center gap-1.5 rounded-md border border-line bg-surface px-2 py-1.5"
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded-[0.25rem] bg-teal-soft text-teal-deep">
                <Icon aria-hidden="true" className="size-2.5" />
              </span>
              <span className="truncate text-[0.5625rem] text-ink">{tile}</span>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.62, duration: 0.4, ease: EASE }}
        className="mb-3 mt-auto flex items-start gap-1.5 rounded-md border border-line bg-amber-soft px-2 py-2"
      >
        <Bell aria-hidden="true" className="mt-px size-3 shrink-0 text-amber-deep" />
        <span className="text-[0.5625rem] font-medium leading-snug text-ink">
          {s.alert}
        </span>
      </motion.div>
    </div>
  );
}

// ─── Pantalla 5 · La comunidad ───────────────────────────

function ScreenCommunity({ s }: { s: TourDict["steps"]["community"] }) {
  return (
    <div className="flex h-full flex-col">
      <p className="font-heading text-[0.9375rem] font-bold leading-tight text-ink">
        {s.title}
      </p>
      <p className="mt-0.5 text-[0.625rem] text-muted">{s.subtitle}</p>

      <div className="mt-2.5 space-y-1.5">
        {s.events.map((ev, i) => (
          <motion.div
            key={ev.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.12, duration: 0.4, ease: EASE }}
            className="flex items-start gap-2 rounded-md border border-line bg-surface p-2"
          >
            {/* Bloque de fecha: el lenguaje de un calendario real */}
            <span className="flex size-9 shrink-0 flex-col items-center justify-center rounded-sm bg-teal-soft leading-none">
              <span className="text-[0.4375rem] font-bold uppercase tracking-wide text-teal-deep">
                {ev.day}
              </span>
              <span className="mt-px font-heading text-[0.75rem] font-bold text-teal-deep">
                {ev.date}
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1">
                <span className="truncate text-[0.6875rem] font-semibold text-ink">
                  {ev.title}
                </span>
                <span className="shrink-0 rounded-full bg-amber px-1.5 py-px text-[0.4375rem] font-bold uppercase tracking-wide text-on-highlight">
                  {ev.tag}
                </span>
              </span>
              <span className="mt-0.5 flex items-center gap-1 text-[0.5625rem] text-muted">
                <Calendar aria-hidden="true" className="size-2.5 shrink-0" />
                <span className="truncate">{ev.meta}</span>
              </span>
            </span>
          </motion.div>
        ))}
      </div>

      <p className="mt-3 text-[0.5625rem] font-semibold uppercase tracking-wider text-muted">
        {s.directoryLabel}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {s.directory.map((item, i) => (
          <motion.span
            key={item}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.42 + i * 0.07, duration: 0.3 }}
            className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2 py-1 text-[0.5625rem] text-ink"
          >
            <MapPin aria-hidden="true" className="size-2.5 text-teal-deep" />
            {item}
          </motion.span>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.66, duration: 0.4, ease: EASE }}
        className="mb-3 mt-auto rounded-md border border-line bg-teal-soft p-2"
      >
        <p className="flex items-center gap-1 text-[0.5625rem] font-bold uppercase tracking-wider text-teal-deep">
          <Sparkles aria-hidden="true" className="size-2.5" />
          {s.familyLabel}
        </p>
        <p className="mt-1 text-[0.5625rem] text-ink">{s.family.join(" · ")}</p>
      </motion.div>
    </div>
  );
}

// ─── El recorrido ────────────────────────────────────────

export function PhoneTour({ copy, className }: PhoneTourProps) {
  const reduced = useReducedMotion();
  const { steps } = copy;
  // Con movimiento reducido se abre en el panel: es el paso que más vende.
  // Con movimiento reducido se abre en el panel: es el paso que más vende.
  const [index, setIndex] = useState(reduced ? 4 : 0);
  const [paused, setPaused] = useState(false);
  const total = 6;

  const captions = [
    steps.welcome,
    steps.branch,
    steps.interests,
    steps.goal,
    steps.panel,
    steps.community,
  ];

  useEffect(() => {
    if (reduced || paused) return;
    const id = setTimeout(
      () => setIndex((i) => (i + 1) % total),
      DURATIONS[index],
    );
    return () => clearTimeout(id);
  }, [index, paused, reduced, total]);

  const goTo = useCallback((i: number) => {
    setIndex(i);
    setPaused(true);
  }, []);

  const current = captions[index];

  return (
    <div
      className={cn("mx-auto w-full max-w-[19.5rem]", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div role="img" aria-label={copy.ariaLabel} className="relative">
        {/* Halo: superficie teal, jamás con texto encima (§2.1.1) */}
        <div
          aria-hidden="true"
          className="absolute -inset-10 -z-10 rounded-full bg-teal-soft opacity-70 blur-3xl"
        />

        {/* Botones laterales, por detrás del chasis */}
        <span aria-hidden="true" className="mock-btn left-[-3px] top-[13%] h-8" />
        <span aria-hidden="true" className="mock-btn left-[-3px] top-[22%] h-12" />
        <span aria-hidden="true" className="mock-btn left-[-3px] top-[32%] h-12" />
        <span aria-hidden="true" className="mock-btn right-[-3px] top-[24%] h-16" />

        {/* Chasis: dos biseles para dar volumen al canto metálico */}
        <div className="mock-frame relative rounded-[2.75rem] p-[3px] shadow-lg">
          <div className="rounded-[2.6rem] bg-navy p-[9px]">
            <div className="relative aspect-[9/19.5] overflow-hidden rounded-[2.1rem] bg-page">
              {/* Isla dinámica */}
              <div
                aria-hidden="true"
                className="absolute left-1/2 top-[0.6rem] z-30 h-[1.55rem] w-[5.4rem] -translate-x-1/2 rounded-full bg-navy"
              >
                <span className="absolute right-2.5 top-1/2 size-2 -translate-y-1/2 rounded-full bg-white/10" />
              </div>

              {index === 0 ? null : <AppBar chip={copy.chip} />}

              <div
                className={cn(
                  "relative overflow-hidden px-4",
                  index === 0 ? "h-full" : "h-[calc(100%-6.4rem)]",
                )}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={index}
                    initial={reduced ? false : { opacity: 0, x: 22 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduced ? undefined : { opacity: 0, x: -22 }}
                    transition={{ duration: 0.4, ease: EASE }}
                    className="h-full"
                  >
                    {index === 0 ? <ScreenWelcome s={steps.welcome} /> : null}
                    {index === 1 ? (
                      <ScreenBranch s={steps.branch} next={copy.nextLabel} />
                    ) : null}
                    {index === 2 ? (
                      <ScreenInterests s={steps.interests} next={copy.nextLabel} />
                    ) : null}
                    {index === 3 ? <ScreenGoal s={steps.goal} /> : null}
                    {index === 4 ? <ScreenPanel s={steps.panel} /> : null}
                    {index === 5 ? <ScreenCommunity s={steps.community} /> : null}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Barra de pestañas y asa de inicio. En la bienvenida no
                  aparece: la app todavía se está abriendo. */}
              <div
                className={cn(
                  "absolute inset-x-0 bottom-0 border-t border-line bg-surface pb-2.5 pt-2",
                  index === 0 && "hidden",
                )}
              >
                <div className="flex items-end justify-around px-5">
                  {[Home, FolderLock, Briefcase, Users].map((Icon, i) => {
                    // En los pasos del registro aún no hay pestañas activas;
                    // en el panel manda Inicio y en comunidad, Comunidad.
                    const activeTab = index === 4 ? 0 : index === 5 ? 3 : -1;
                    return (
                      <span
                        key={i}
                        className={cn(
                          "flex flex-col items-center gap-0.5",
                          i === activeTab ? "text-teal-deep" : "text-disabled",
                        )}
                      >
                        <Icon aria-hidden="true" className="size-3.5" />
                        <span
                          className={cn(
                            "h-0.5 w-4 rounded-full transition-colors",
                            i === activeTab ? "bg-teal-deep" : "bg-transparent",
                          )}
                        />
                      </span>
                    );
                  })}
                </div>
                <span
                  aria-hidden="true"
                  className="mx-auto mt-1.5 block h-[3px] w-[6.5rem] rounded-full bg-ink/25"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Narración: fuera del teléfono ─────────────────
          Dentro sería un cartel que la app real no tiene, y restaría
          credibilidad justo donde más falta hace. */}
      <div className="mt-6 min-h-[5.5rem]">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <p className="text-caption font-bold uppercase tracking-widest text-teal-deep">
              {current.eyebrow}
            </p>
            <p className="mt-1.5 text-body text-ink">{current.caption}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Puntos de paso: informan y además permiten saltar */}
      <div className="mt-4 flex items-center gap-2">
        {captions.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={copy.goToStep
              .replace("{n}", String(i + 1))
              .replace("{total}", String(total))}
            aria-current={i === index ? "true" : undefined}
            className="group flex h-11 items-center"
          >
            <span
              className={cn(
                "block h-1 rounded-full transition-all duration-300",
                i === index
                  ? "w-8 bg-teal-deep"
                  : "w-4 bg-line group-hover:bg-muted",
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
