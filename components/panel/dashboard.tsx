"use client";

/**
 * PANEL — la pantalla de inicio, con la forma del sistema de diseño.
 *
 * Antes esto era un feed de escritorio: saludo, tarjeta de objetivo, hero
 * card, tira de "también te puede servir", rejilla de siete tarjetas
 * iguales y una columna lateral con enlaces oficiales. Seis bloques que
 * decían lo mismo con seis formas distintas.
 *
 * El diseño lo reordena en BALDOSAS y en dos bloques, que son un par y
 * hay que leerlos juntos:
 *
 *   · **Tu plan incluye** .... los SIETE módulos. Primero los que ya abren
 *                              y detrás los que faltan, con su insignia de
 *                              «En construcción» — no están fuera del plan,
 *                              sólo todavía no listos
 *   · **Fuera de tu plan** ... Tienda e Inversiones, con su límite escrito
 *
 * Uno dice qué se compró y el otro dónde acaba. Ese contraste es lo que
 * evita la sorpresa de descubrir un cobro que no se esperaba, que con este
 * público no es un detalle.
 *
 * Arriba de todo, una sola tarjeta navy con LA recomendación y su porqué;
 * abajo, el objetivo de 30 días y el aviso de no-afiliación.
 *
 * ── Qué NO cambia ──
 *
 * La adaptación sigue siendo jerárquica, nunca restrictiva (§0.4): los 7
 * módulos siguen estando todos, siempre accesibles. El motor decide el
 * ORDEN dentro de cada bloque; el bloque sólo dice si el módulo abre hoy.
 * La telemetría (`hero_card_clicked`, `module_opened`) y el control de
 * acceso por suscripción se quedan donde estaban.
 *
 * Los 11 elementos adaptativos de §4.2 y dónde viven ahora:
 *   1. Modo del dashboard ...... `profile.locationContext` gobierna todo el archivo
 *   2. Saludo .................. <DashboardHeader> (titular)
 *   3. Hero card ............... <HeroArea> → tarjeta navy
 *   4. Orden de las baldosas ... <ModuleBlocks> (scores de `user_module_ranking`)
 *   5. Contenido de cada módulo  `score.contentVariant` → títulos §4.2.1
 *   6/7. Enlaces y sidebar ..... RETIRADOS de esta pantalla (ver nota abajo)
 *   8. Objetivo de 30 días ..... <GoalCard>
 *   9. Sugerencia secundaria ... absorbida por el orden de «Lo que usas»
 *  10. "Para tu familia" ....... <FamilySection> (solo si seekingFor ≠ 'self')
 *  11. Banner "¿Ya llegaste?" .. <ArrivalFlow> (solo en pre_arrival)
 *
 * Sobre 6 y 7: `<ContextualSidebar>` está pensado para una columna de
 * 320px a la derecha, y aquí no hay ninguna — el armazón es una sola
 * columna de 414px como máximo. Apilado debajo añadía cinco tarjetas que
 * el diseño del panel no tiene. El componente sigue en el repositorio
 * para cuando exista la versión de escritorio; lo que sí se conserva aquí
 * es el aviso de no-afiliación, que cierra la pantalla.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AppWindow,
  Briefcase,
  Building2,
  ChevronRight,
  GraduationCap,
  Info,
  Landmark,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { ROUTES } from "@/lib/config";
import { formatReason } from "@/lib/i18n";
import { MODULES, moduleById } from "@/lib/catalogs/modules";
import { track } from "@/lib/analytics/track";
import type { Lang, ModuleId, ModuleScore, ModuleSlug } from "@/lib/types";
import { toast } from "@/components/ui/toaster";
import {
  Glyph,
  KitBadge,
  KitButton,
  KitCard,
  KitNotice,
  ListGroup,
  ListRow,
  RecommendationCard,
  ScreenHeader,
  SectionLabel,
  StatePanel,
  Tile,
  TileGrid,
  type IconComponent,
} from "@/components/ui/kit";
import { ArrivalFlow } from "./arrival-flow";
import { GoalCard } from "./goal-card";
import { usePanel } from "./panel-context";
import { MODULES_ANCHOR } from "./panel-shell";
import { fallbackScores, HERO_DISMISS_LIMIT } from "./ranking";
import { moduleDescription, moduleTitle, scopeName } from "./panel-utils";

/**
 * El icono de cada módulo en la baldosa, con su nombre de Lucide en
 * kebab-case: es lo que el CSS mira para darle su gesto (el escudo se
 * sella, el birrete se lanza, el avión despega). Sin `name` el icono
 * simplemente no se mueve, y es un fallo que no se ve.
 *
 * Son los iconos que el sistema de diseño asigna a cada módulo en esta
 * pantalla, y coinciden con los de la barra de pestañas. `MODULES` del
 * catálogo guarda además el `iconName` del seed §7.4, que en algunos
 * casos no es un nombre de Lucide válido (`graduation`, `building`), así
 * que no se puede pasar tal cual.
 */
const MODULE_GLYPH: Record<ModuleSlug, { name: string; icon: IconComponent }> = {
  boveda: { name: "shield", icon: ShieldCheck },
  migracion: { name: "landmark", icon: Landmark },
  finanzas: { name: "wallet", icon: Wallet },
  negocio: { name: "building-2", icon: Building2 },
  comunidad: { name: "users", icon: Users },
  academia: { name: "graduation-cap", icon: GraduationCap },
  empleo: { name: "briefcase", icon: Briefcase },
};

/**
 * La baldosa apagada lleva el icono DESNUDO, sin la ficha de 36px: es lo
 * que la distingue de un módulo que sí abre. `Tile` siempre envuelve el
 * icono en `.rowicon`, así que aquí se le quita el fondo y el tamaño.
 */
const ICONO_DESNUDO =
  "[&_.rowicon]:h-auto [&_.rowicon]:w-auto [&_.rowicon]:bg-transparent [&_.rowicon]:text-disabled";

/** «martes 8 de enero». Es formato, no copy: lo resuelve `Intl`. */
function todayLabel(lang: Lang, now: Date = new Date()): string {
  return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "es-419", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
    .format(now)
    // El sobretítulo del diseño va sin coma: «martes 8 de enero».
    .replace(/,/g, "");
}

/**
 * El titular de la tarjeta navy se pierde sin esto, y cuesta un rato verlo.
 *
 * `globals.css` fija `h1,h2,h3,h4 { color: var(--text) }` en la capa base.
 * `.card-invert` pone el color en el DIV y cuenta con que el `<h2>` lo
 * herede — pero una regla escrita sobre el propio elemento gana siempre a
 * la herencia, sin importar la capa. Resultado: titular navy sobre navy,
 * invisible, y un hueco donde debería estar el texto.
 *
 * El arreglo de verdad va en `components/ui/kit.tsx` o en `globals.css`,
 * y los dos están fuera de mi alcance en esta tanda. Esto lo repara desde
 * fuera con una utilidad, que gana a la capa base.
 */
const TITULAR_SOBRE_NAVY = "[&_h2]:[color:var(--text-on-invert)]";

/** El galón de la derecha de una fila. */
function Chevron() {
  return (
    <Glyph
      name="chevron-right"
      icon={ChevronRight}
      size={18}
      strokeWidth={2}
      className="text-disabled"
    />
  );
}

export function Dashboard() {
  const { loading, profile, scores } = usePanel();
  /** §3.2.3 — la bienvenida tras "Ya llegué" merece su propia pantalla. */
  const [showWelcome, setShowWelcome] = useState(false);

  // El shell ya pinta el esqueleto de carga (§4.5, estado `loading`).
  if (loading || !profile) return null;

  const ordered: ModuleScore[] =
    scores.length > 0 ? scores : fallbackScores(profile.locationContext);

  if (showWelcome) {
    return <ArrivalWelcome onContinue={() => setShowWelcome(false)} />;
  }

  return (
    <div className="min-w-0">
      <DashboardHeader />

      {/* 11 — solo en modo pre_arrival (§3.2.3). */}
      <ArrivalFlow onArrived={() => setShowWelcome(true)} />

      {/* 3 — la recomendación, o su equivalente para los casos borde de §4.7. */}
      <HeroArea />

      {/* 4 y 5 — los 7 módulos, y lo que se paga aparte. */}
      <ModuleBlocks ordered={ordered} />

      {/* 10 — "Para tu familia". */}
      <FamilySection />

      {/* 8 — objetivo de 30 días, editable. */}
      <GoalCard />

      {/* §6 — el aviso de no-afiliación cierra la pantalla que toca trámites. */}
      <NoAfiliacion />
    </div>
  );
}

// ── 1 y 2 — Modo y saludo (§4.2.1) ───────────────────────

/**
 * El sobretítulo dice dónde estás y qué día es; el titular saluda. Es la
 * inversión del feed viejo, donde el saludo era el renglón pequeño y el
 * titular repetía el modo del panel: aquí el nombre es lo primero que se
 * lee, y el contexto queda encima en pequeño.
 */
function DashboardHeader() {
  const { dict, lang, profile } = usePanel();
  if (!profile) return null;

  const p = dict.panel;
  const scope = scopeName(profile, lang);
  const name = profile.firstName?.trim();
  const fecha = todayLabel(lang);

  return (
    <ScreenHeader
      overline={scope ? p.header.overline(scope, fecha) : fecha}
      title={name ? p.greeting(name) : p.greetingNoName}
    />
  );
}

// ── 3 — La recomendación (§4.4) y casos borde (§4.7) ─────

function HeroArea() {
  const { dict, lang, profile, heroEntry, resumeStep, readOnly, dismissHero } =
    usePanel();
  const router = useRouter();
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
  // el motor con solo el contexto) y tarjeta GENÉRICA con CTA a completar
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

  // §4.7 — descartada 3 veces: se oculta 7 días y quedan sólo las baldosas.
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
    <RecommendationCard
      className={`mt-[22px] ${TITULAR_SOBRE_NAVY}`}
      eyebrow={hero.eyebrow}
      title={title}
      // El motor devuelve un ReasonCode; el copy lo resuelve i18n (D3).
      reason={formatReason(entry.reason, lang, { moduleTitle: title })}
      action={hero.start}
      // "No es lo que busco" es el mecanismo de corrección del usuario y la
      // señal más honesta que recibe el motor (§4.4): nunca se esconde.
      // Solo desaparece en modo de solo lectura, porque es una escritura.
      dismiss={readOnly ? undefined : hero.dismiss}
      onAction={() => {
        // `module_opened` NO se emite aquí: lo emite la pantalla del módulo al
        // abrirse, para contar igual de bien las entradas desde las baldosas,
        // la barra de pestañas o un enlace directo (§7.5).
        track("hero_card_clicked", { module_id: heroId });
        router.push(ROUTES.modulo(meta.slug));
      }}
      onDismiss={readOnly ? undefined : handleDismiss}
    />
  );
}

/**
 * La tarjeta de la hero genérica y de la reanudación (§4.7). Blanca, no
 * navy: no es una recomendación del motor y no debe parecerlo.
 */
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
  const router = useRouter();
  return (
    <KitCard className="mt-[22px]">
      <StatePanel title={title} body={body}>
        <KitButton size="sm" className="mt-5" onClick={() => router.push(href)}>
          {cta}
        </KitButton>
      </StatePanel>
    </KitCard>
  );
}

// ── 4 y 5 — Los 7 módulos, en tres bloques ───────────────

/**
 * El orden dentro de cada bloque lo sigue poniendo el motor. Si el ranking
 * llegara incompleto —un perfil viejo, un cálculo a medias—, los módulos
 * que falten se añaden al final en el ORDEN CANÓNICO del catálogo: los 7
 * están siempre, pase lo que pase (§0.4).
 */
function orderedModuleIds(ordered: ModuleScore[]): ModuleId[] {
  const ranked = ordered.map((entry) => entry.moduleId);
  const missing = MODULES.filter((m) => !ranked.includes(m.id)).map((m) => m.id);
  return [...ranked, ...missing];
}

function ModuleBlocks({ ordered }: { ordered: ModuleScore[] }) {
  const { dict, profile } = usePanel();
  if (!profile) return null;

  const g = dict.panel.grid;
  const p = dict.panel.paidApart;
  const ids = orderedModuleIds(ordered);
  const variantOf = new Map(ordered.map((e) => [e.moduleId, e.contentVariant]));
  const variant = (id: ModuleId) => variantOf.get(id) ?? profile.locationContext;

  const vivos = ids.filter((id) => moduleById(id).status === "live");
  const pronto = ids.filter((id) => moduleById(id).status !== "live");

  return (
    <>
      <section
        id={MODULES_ANCHOR}
        aria-labelledby="bloque-lo-que-usas"
        className="scroll-mt-20"
      >
        <SectionLabel as="h2" id="bloque-lo-que-usas">
          {g.usedLabel}
        </SectionLabel>
        {/* LOS SIETE, JUNTOS.
            Antes iban en dos bloques: los que abren y, al final de la
            pantalla, «Se abren durante el piloto». Eso partía en dos lo
            que la suscripción cubre y dejaba cuatro módulos leyéndose como
            si no fueran parte del plan — cuando sí lo son, sólo que
            todavía no abren.

            Ahora están los siete bajo «Tu plan incluye», en orden: primero
            los que ya funcionan, y detrás los que faltan con su insignia
            de «En construcción». Se ve lo que se paga; se ve qué parte
            está lista. */}
        <TileGrid>
          {vivos.map((id, i) => {
            const meta = moduleById(id);
            const glyph = MODULE_GLYPH[meta.slug];
            return (
              <Tile
                key={id}
                iconName={glyph.name}
                icon={glyph.icon}
                // La ficha se pinta en teal SÓLO una vez en toda la pantalla,
                // en el módulo mejor puntuado de los que YA abren. Si todas
                // fueran de color, ninguna destacaría. No se usa el módulo de
                // la recomendación porque puede ser uno que todavía no abre,
                // y entonces no habría ninguna baldosa marcada.
                iconTone={i === 0 ? "accent" : "quiet"}
                name={moduleTitle(dict, id, variant(id))}
                meta={moduleDescription(dict, id)}
                href={ROUTES.modulo(meta.slug)}
              />
            );
          })}

          {pronto.map((id) => {
            const meta = moduleById(id);
            const glyph = MODULE_GLYPH[meta.slug];
            return (
              <Tile
                key={id}
                quiet
                className={ICONO_DESNUDO}
                iconName={glyph.name}
                icon={glyph.icon}
                name={moduleTitle(dict, id, variant(id))}
                foot={<KitBadge tone="building">{g.buildingBadge}</KitBadge>}
                href={ROUTES.modulo(meta.slug)}
              />
            );
          })}
        </TileGrid>
      </section>

      <section aria-labelledby="bloque-se-paga-aparte">
        <SectionLabel as="h2" id="bloque-se-paga-aparte">
          {p.label}
        </SectionLabel>
        <TileGrid>
          <Tile
            iconName="app-window"
            icon={AppWindow}
            name={p.store}
            meta={p.storeMeta}
            href={ROUTES.tienda}
          />
          <Tile
            iconName="trending-up"
            icon={TrendingUp}
            name={p.investments}
            meta={p.investmentsMeta}
            href={ROUTES.inversiones}
          />
        </TileGrid>
        {/* El límite se dice aquí mismo, no en otra pantalla. */}
        <p className="mt-3 text-label text-disabled">{p.note}</p>
      </section>

    </>
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
    <section aria-labelledby="bloque-para-tu-familia">
      <SectionLabel as="h2" id="bloque-para-tu-familia">
        {f.title}
      </SectionLabel>
      <ListGroup>
        <ListRow
          iconName="users"
          icon={Users}
          title={f.cta}
          meta={f.subtitle}
          trail={<Chevron />}
          href={ROUTES.modulo(meta.slug)}
        />
      </ListGroup>
    </section>
  );
}

// ── §6 — El aviso que cierra la pantalla ─────────────────

function NoAfiliacion() {
  const { dict } = usePanel();
  return (
    <KitNotice iconName="info" icon={Info} className="mt-2.5">
      {dict.common.legal.govDisclaimer}
    </KitNotice>
  );
}

// ── §3.2.3 — Pantalla de bienvenida tras "Ya llegué" ─────

function ArrivalWelcome({ onContinue }: { onContinue: () => void }) {
  const { dict, lang, profile, heroEntry } = usePanel();
  const router = useRouter();
  if (!profile) return null;

  const b = dict.panel.arrivalBanner;
  const scope = scopeName(profile, lang);
  const entry = heroEntry;
  const title = entry
    ? moduleTitle(dict, entry.moduleId, entry.contentVariant)
    : "";

  return (
    <div className="min-w-0">
      <ScreenHeader
        title={scope ? b.welcomeTitle(scope) : dict.panel.subtitle.inUsNoState}
        sub={b.welcomeSubtitle}
      />

      {entry ? (
        <RecommendationCard
          className={`mt-[22px] ${TITULAR_SOBRE_NAVY}`}
          eyebrow={dict.panel.hero.eyebrow}
          title={title}
          reason={formatReason(entry.reason, lang, { moduleTitle: title })}
          action={dict.panel.hero.start}
          onAction={() => {
            track("hero_card_clicked", { module_id: entry.moduleId });
            router.push(ROUTES.modulo(moduleById(entry.moduleId).slug));
          }}
        />
      ) : null}

      <KitButton kind="ghost" size="sm" className="mt-6" onClick={onContinue}>
        {b.welcomeCta}
      </KitButton>
    </div>
  );
}
