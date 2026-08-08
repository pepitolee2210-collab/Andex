"use client";

/**
 * DASHBOARD ADAPTATIVO (§4) — el corazón del MVP.
 *
 * Principio §4.1: "El dashboard no le dice al usuario quién es. Le muestra por
 * dónde empezar." La adaptación es JERÁRQUICA, nunca restrictiva (§0.4): los 7
 * módulos siempre están, siempre son accesibles y siempre se ven completos.
 * Lo único que cambia es a qué le da protagonismo la pantalla.
 *
 * Los 11 elementos adaptativos de §4.2 y dónde viven:
 *   1. Modo del dashboard ...... `profile.locationContext` gobierna todo el archivo
 *   2. Saludo .................. <DashboardHeader>
 *   3. Hero card ............... <HeroArea>
 *   4. Orden del grid .......... <ModulesGrid> (scores de `user_module_ranking`)
 *   5. Contenido de cada módulo  `score.contentVariant` → títulos §4.2.1
 *   6. Enlaces externos ........ <ContextualSidebar> (scope estado/país)
 *   7. Sidebar contextual ...... <ContextualSidebar topSlugs={#1, #2}>
 *   8. Objetivo de 30 días ..... <GoalCard>
 *   9. Sugerencia secundaria ... <SecondarySuggestion> (módulo #2, tira horizontal)
 *  10. "Para tu familia" ....... <FamilySection> (solo si seekingFor ≠ 'self')
 *  11. Banner "¿Ya llegaste?" .. <ArrivalFlow> (solo en pre_arrival)
 */

import { useState } from "react";
import { ArrowRight, Users } from "lucide-react";
import { ROUTES } from "@/lib/config";
import { formatReason } from "@/lib/i18n";
import { moduleById } from "@/lib/catalogs/modules";
import { track } from "@/lib/analytics/track";
import type { ModuleScore } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { ModuleCard } from "@/components/module-card";
import { ArrivalFlow } from "./arrival-flow";
import { ContextualSidebar } from "./contextual-sidebar";
import { GoalCard } from "./goal-card";
import { usePanel } from "./panel-context";
import { MODULES_ANCHOR } from "./panel-shell";
import { fallbackScores, HERO_DISMISS_LIMIT } from "./ranking";
import { moduleDescription, moduleTitle, scopeName } from "./panel-utils";

export function Dashboard() {
  const { loading, profile, scores, heroEntry, heroModuleId } = usePanel();
  /** §3.2.3 — la bienvenida tras "Ya llegué" merece su propia pantalla. */
  const [showWelcome, setShowWelcome] = useState(false);

  // El shell ya pinta el esqueleto de carga (§4.5, estado `loading`).
  if (loading || !profile) return null;

  const ordered: ModuleScore[] =
    scores.length > 0 ? scores : fallbackScores(profile.locationContext);

  // La sugerencia secundaria es el módulo siguiente al que está en la hero
  // card, no el #2 fijo: si el usuario descartó el #1, el #2 subió a hero y
  // repetirlo aquí sería mostrar la misma tarjeta dos veces.
  const secondary = heroEntry
    ? (ordered.find((entry) => entry.moduleId !== heroModuleId) ?? null)
    : null;

  if (showWelcome) {
    return <ArrivalWelcome onContinue={() => setShowWelcome(false)} />;
  }

  const topSlugs = [heroEntry ?? ordered[0], secondary ?? ordered[1]]
    .filter((entry): entry is ModuleScore => Boolean(entry))
    .map((entry) => moduleById(entry.moduleId).slug);

  return (
    <div className="mx-auto w-full max-w-6xl xl:grid xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start xl:gap-6">
      <div className="min-w-0 space-y-6">
        <DashboardHeader />

        {/* 8 — objetivo de 30 días, editable. Va pegado al saludo porque §4.2
            define el saludo como "nombre + referencia al objetivo declarado":
            se cumple sin duplicar el texto en dos sitios. */}
        <GoalCard />

        {/* 11 — solo en modo pre_arrival (§3.2.3). */}
        <ArrivalFlow onArrived={() => setShowWelcome(true)} />

        {/* 3 — hero card, o su equivalente para los casos borde de §4.7. */}
        <HeroArea />

        {/* 9 — sugerencia secundaria: módulo #2, en tira horizontal.
            Con la hero card oculta (§4.7) desaparece también: lo que queda
            es "el grid plano", sin jerarquía por encima. */}
        {secondary ? <SecondarySuggestion entry={secondary} /> : null}

        {/* 4 — los 7 módulos, ordenados por score. */}
        <ModulesGrid ordered={ordered} />

        {/* 10 — "Para tu familia". */}
        <FamilySection />
      </div>

      {/* 6 y 7 — sidebar contextual: a la derecha en ≥1440, apilado debajo
          en anchos menores. Una sola instancia, sin DOM duplicado. */}
      <aside className="mt-6 min-w-0 xl:mt-0 xl:sticky xl:top-20">
        <ContextualSidebar topSlugs={topSlugs} />
      </aside>
    </div>
  );
}

// ── 1 y 2 — Modo y saludo (§4.2.1) ───────────────────────

function DashboardHeader() {
  const { dict, lang, profile } = usePanel();
  if (!profile) return null;

  const p = dict.panel;
  const scope = scopeName(profile, lang);
  const name = profile.firstName?.trim();

  // Los dos modos, con su copy exacto de §4.2.1:
  //   in_us       → "Tu prioridad en Utah este mes"
  //   pre_arrival → "Tu camino desde Colombia a Estados Unidos"
  const subtitle =
    profile.locationContext === "in_us"
      ? scope
        ? p.subtitle.inUs(scope)
        : p.subtitle.inUsNoState
      : scope
        ? p.subtitle.preArrival(scope)
        : p.subtitle.preArrivalNoCountry;

  return (
    <header>
      <p className="text-body-lg text-muted">
        {name ? p.greeting(name) : p.greetingNoName}
      </p>
      <h1 className="mt-1 font-heading text-h1 text-ink">{subtitle}</h1>
    </header>
  );
}

// ── 3 — Hero card (§4.4) y casos borde (§4.7) ────────────

function HeroArea() {
  const { dict, lang, profile, heroEntry, resumeStep, readOnly, dismissHero } =
    usePanel();
  if (!profile) return null;

  const hero = dict.panel.hero;

  // §4.7 — perfil incompleto (abandonó a mitad de la entrevista): se ofrece
  // retomar donde quedó, pero puede seguir explorando por su cuenta.
  if (resumeStep !== null) {
    return (
      <PromptCard
        title={hero.resumeTitle}
        body={hero.resumeBody(resumeStep)}
        cta={hero.resumeCta}
        href={ROUTES.entrevista}
      />
    );
  }

  // §4.7 — usuario que saltó el onboarding: orden por defecto (ya lo produce
  // el motor con solo el contexto) y hero card GENÉRICA con CTA a completar
  // el perfil. Nunca se le bloquea nada (§0.4).
  if (!profile.onboardingCompleted) {
    return (
      <PromptCard
        title={hero.genericTitle}
        body={hero.genericBody}
        cta={hero.genericCta}
        href={ROUTES.entrevista}
      />
    );
  }

  // §4.7 — descartada 3 veces: se oculta 7 días y queda el grid plano.
  // `heroEntry` ya es null en ese caso, y también salta lo que se descartó hoy.
  const entry = heroEntry;
  if (!entry) return null;


  const heroId = entry.moduleId;
  const meta = moduleById(heroId);
  const title = moduleTitle(dict, heroId, entry.contentVariant);

  async function handleDismiss() {
    const total = await dismissHero(heroId);
    toast.success(
      total >= HERO_DISMISS_LIMIT ? hero.dismissedThriceToast : hero.dismissedToast,
    );
  }

  return (
    <ModuleCard
      slug={meta.slug}
      title={title}
      variant="hero"
      state="recommended"
      accentColor={meta.accentColor}
      // El motor devuelve un ReasonCode; el copy lo resuelve i18n (D3).
      reason={formatReason(entry.reason, lang, { moduleTitle: title })}
      href={ROUTES.modulo(meta.slug)}
      // `module_opened` NO se emite aquí: lo emite la pantalla del módulo al
      // abrirse, para contar igual de bien las entradas desde el sidebar, el
      // tab bar o un enlace directo (§7.5: su proporción es la precisión real
      // del motor, así que no puede depender del punto de entrada).
      onOpen={() => track("hero_card_clicked", { module_id: entry.moduleId })}
      // "No es lo que busco" es el mecanismo de corrección del usuario y la
      // señal más honesta que recibe el motor (§4.4): nunca se esconde.
      // Solo desaparece en modo de solo lectura, porque es una escritura.
      onDismiss={readOnly ? undefined : handleDismiss}
      recommendedLabel={dict.common.badges.recommended}
      openLabel={hero.start}
      dismissLabel={hero.dismiss}
      dismissIconLabel={hero.dismissAria}
    />
  );
}

/** Tarjeta de la hero genérica y de la reanudación (§4.7). Sin badge ámbar:
 *  no es una recomendación del motor y no debe parecerlo. */
function PromptCard({
  title,
  body,
  cta,
  href,
}: {
  title: string;
  body: string;
  cta: string;
  href: string;
}) {
  return (
    <section className="rounded-xl border border-line bg-surface p-6 shadow-sm">
      <h2 className="font-heading text-h2 text-ink">{title}</h2>
      <p className="mt-2 text-body text-muted">{body}</p>
      <Button href={href} className="mt-5">
        {cta}
        <ArrowRight aria-hidden="true" className="size-4" />
      </Button>
    </section>
  );
}

// ── 9 — Sugerencia secundaria (módulo #2, tira horizontal) ──

function SecondarySuggestion({ entry }: { entry: ModuleScore }) {
  const { dict } = usePanel();
  const meta = moduleById(entry.moduleId);

  return (
    <section aria-labelledby="sugerencia-secundaria">
      <h2
        id="sugerencia-secundaria"
        className="mb-2 text-caption font-semibold uppercase tracking-wide text-muted"
      >
        {dict.panel.grid.secondaryLabel}
      </h2>
      <ModuleCard
        slug={meta.slug}
        title={moduleTitle(dict, entry.moduleId, entry.contentVariant)}
        variant="list"
        state={meta.status === "live" ? "available" : "coming-soon"}
        accentColor={meta.accentColor}
        description={moduleDescription(dict, entry.moduleId)}
        href={ROUTES.modulo(meta.slug)}
        comingSoonLabel={dict.common.badges.soon}
      />
    </section>
  );
}

// ── 4 y 5 — Grid de los 7 módulos ────────────────────────

function ModulesGrid({ ordered }: { ordered: ModuleScore[] }) {
  const { dict } = usePanel();
  const g = dict.panel.grid;

  return (
    <section id={MODULES_ANCHOR} aria-labelledby="titulo-modulos" className="scroll-mt-20">
      <h2 id="titulo-modulos" className="font-heading text-h2 text-ink">
        {g.title}
      </h2>
      <p className="mt-1 text-body text-muted">{g.subtitle}</p>

      {/* §2.4 — 2 columnas por defecto en mobile, 3 en el feed de escritorio.
          Los 7 siempre presentes: el ranking ordena, no filtra (§0.4). */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {ordered.map((entry) => {
          const meta = moduleById(entry.moduleId);
          return (
            <ModuleCard
              key={entry.moduleId}
              slug={meta.slug}
              title={moduleTitle(dict, entry.moduleId, entry.contentVariant)}
              variant="grid"
              state={meta.status === "live" ? "available" : "coming-soon"}
              accentColor={meta.accentColor}
              description={moduleDescription(dict, entry.moduleId)}
              href={ROUTES.modulo(meta.slug)}
              comingSoonLabel={dict.common.badges.soon}
            />
          );
        })}
      </div>
    </section>
  );
}

// ── 10 — "Para tu familia" (§4.2, solo si seekingFor ≠ 'self') ──

function FamilySection() {
  const { dict, profile } = usePanel();
  if (!profile || profile.seekingFor === "self") return null;

  const f = dict.panel.family;
  // M2 es el módulo que refuerza el FAMILY_BOOST del motor (§3.3.1 paso 8):
  // el contenido de preparación de quien todavía está fuera vive ahí.
  const meta = moduleById(2);

  return (
    <section
      aria-labelledby="para-tu-familia"
      className="rounded-lg border border-line bg-surface-alt p-4"
    >
      <h2
        id="para-tu-familia"
        className="flex items-center gap-2 font-heading text-h3 text-ink"
      >
        <Users aria-hidden="true" className="size-5 text-muted" />
        {f.title}
      </h2>
      <p className="mt-1 text-body text-muted">{f.subtitle}</p>
      <Button href={ROUTES.modulo(meta.slug)} variant="secondary" className="mt-4">
        {f.cta}
      </Button>
    </section>
  );
}

// ── §3.2.3 — Pantalla de bienvenida tras "Ya llegué" ─────

function ArrivalWelcome({ onContinue }: { onContinue: () => void }) {
  const { dict, lang, profile, heroEntry } = usePanel();
  if (!profile) return null;

  const b = dict.panel.arrivalBanner;
  const scope = scopeName(profile, lang);
  const entry = heroEntry;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="font-heading text-h1 text-ink">
        {scope ? b.welcomeTitle(scope) : dict.panel.subtitle.inUsNoState}
      </h1>
      <p className="mt-2 text-body-lg text-muted">{b.welcomeSubtitle}</p>

      {entry ? (
        <div className="mt-6">
          <ModuleCard
            slug={moduleById(entry.moduleId).slug}
            title={moduleTitle(dict, entry.moduleId, entry.contentVariant)}
            variant="hero"
            state="recommended"
            accentColor={moduleById(entry.moduleId).accentColor}
            reason={formatReason(entry.reason, lang, {
              moduleTitle: moduleTitle(dict, entry.moduleId, entry.contentVariant),
            })}
            href={ROUTES.modulo(moduleById(entry.moduleId).slug)}
            onOpen={() => track("hero_card_clicked", { module_id: entry.moduleId })}
            recommendedLabel={dict.common.badges.recommended}
            openLabel={dict.panel.hero.start}
          />
        </div>
      ) : null}

      <Button variant="ghost" onClick={onContinue} className="mt-6">
        {b.welcomeCta}
      </Button>
    </div>
  );
}
