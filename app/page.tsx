import { cookies } from "next/headers";

import { COOKIES, PRICES, ROUTES } from "@/lib/config";
import { MODULES } from "@/lib/catalogs/modules";
import { getGeoHint, suggestedContext } from "@/lib/geo";
import { imagenesLanding } from "@/lib/landing-images";
import { getDictionary } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import type { LocationContext } from "@/lib/types";
import { formatUsd } from "@/lib/utils";

import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { SectionSeam } from "@/components/motion/section-seam";
import { BranchProvider } from "@/components/landing/branch-context";
import { MobileCtaBar } from "@/components/landing/mobile-cta-bar";
import { SectionViewTracker } from "@/components/landing/section-view-tracker";
import { TopBanner } from "@/components/landing/top-banner";
import { SiteNav } from "@/components/landing/site-nav";
import { SectionHero } from "@/components/landing/section-hero";
import { SectionTrustBar } from "@/components/landing/section-trust-bar";
import { SectionFounder } from "@/components/landing/section-founder";
import { SectionEnglish } from "@/components/landing/section-english";
import { SectionShowcase } from "@/components/landing/section-showcase";
import { SectionPricing } from "@/components/landing/section-pricing";
import { SectionFaq } from "@/components/landing/section-faq";
import { SectionClosing } from "@/components/landing/section-closing";
import { SiteFooter } from "@/components/landing/site-footer";

/**
 * LANDING PAGE — la estructura del documento maestro.
 *
 * El orden y el contenido salen de «ANDEX_MASTER_SPECIFICATION_DOCUMENT.md»,
 * sección 3. Los números son los suyos:
 *
 *   S0. Cinta superior ..... piloto y tarifa congelada
 *   S1. Navegación ......... Soluciones · Módulos · Inglés en Vivo · Membresía
 *   S2. Portada ............ «El camino que ya recorrí»
 *   S3. Respaldo ........... cinco hechos comprobables, con su límite
 *   S4. El fundador ........ la cita que sostiene el titular
 *   S5. Los siete módulos .. maestro-detalle en escritorio, lista en móvil
 *   S6. Inglés en vivo ..... destacada por el terreno, navy sobre crema
 *   S8. Membresía .......... el precio antes de pedir un dato de pago
 *   S9. Preguntas .......... acordeón, uno abierto a la vez
 *   S10. Cierre y pie
 *
 * ── Lo que NO está, y por qué ──
 *
 * · **S7, servicios directos con 20% OFF**: fuera por decisión del producto.
 *   El descuento se sigue nombrando donde es un beneficio del plan —portada,
 *   tabla de precios y FAQ—, pero no tiene sección propia.
 * · **El escáner gratis, las cifras comprobables, los cuatro problemas y las
 *   reseñas**: no están en el documento, así que salen de la página. Los
 *   componentes siguen en el repositorio y vuelven con una línea. El que más
 *   pesa es el escáner: era la única parte de la página donde el producto
 *   DEMOSTRABA en vez de contar, y sin registro.
 *
 * Se retiraron antes —y siguen en el repositorio— `SectionTrust`,
 * `SectionCompare`, `ModuleWheel`, `SectionModules`, `SectionServices` y
 * `SectionPurpose`.
 *
 * NOTA HISTÓRICA — diez secciones.
 *
 * La decisión de fondo: el hero DEMUESTRA en vez de describir. A la
 * izquierda la promesa y la acción; a la derecha el producto recorriendo sus
 * pantallas. Y más abajo, la rejilla de módulos se reordena en vivo al
 * elegir rama — la promesa central del producto ocurriendo delante del
 * visitante, no contada en un párrafo (§3.1.1).
 *
 * Movimiento: Lenis + GSAP ScrollTrigger + Motion, todo en carga diferida y
 * apagado por completo bajo `prefers-reduced-motion` (§2.5). El scroll suave
 * no se aplica en táctil: el gesto nativo del móvil es mejor y no gasta
 * batería en el Android de gama baja al que apunta el producto.
 */

type LandingSearchParams = { ctx?: string | string[] };

function parseContext(raw: string | string[] | undefined): LocationContext | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === "in_us" || value === "pre_arrival" ? value : null;
}

/**
 * Secciones observadas para `landing_section_viewed` (§7.5 / D24). El valor
 * es a la vez el `id` en el DOM y la propiedad `section` del evento: una
 * sola cadena por sección, imposible de desincronizar.
 */
/*
 * Solo los `id` que existen de verdad en la pagina. Los de la version
 * anterior —confianza, comparativa, frentes, servicios, comunidad— apuntaban
 * a secciones que el rediseno sustituyo: el observador no los encontraba y
 * esas metricas llevaban tiempo sin registrar nada, sin que nada fallara.
 */
const TRACKED_SECTIONS = [
  "respaldo",
  "fundador",
  "modulos",
  "ingles",
  "precios",
  "faq",
  "cierre",
] as const;

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<LandingSearchParams>;
}) {
  const [lang, params, cookieStore, geo] = await Promise.all([
    getLang(),
    searchParams,
    cookies(),
    getGeoHint(),
  ]);

  /* Sólo entran las que existen en `public/`: una imagen que todavía no
     está pintaría el icono de roto en mitad de la sección. */
  const imagenes = imagenesLanding();

  const dict = getDictionary(lang);
  const t = dict.landing;
  const branch = parseContext(params.ctx);

  // Solo sugiere; jamás decide (§3.2 regla UX 7). Su único uso es alimentar
  // `was_ip_prefilled` / `changed_from_prefill` de §7.5.
  const ipSuggestion = suggestedContext(geo);

  const themeCookie = cookieStore.get(COOKIES.theme)?.value;
  const initialTheme =
    themeCookie === "dark" || themeCookie === "light" ? themeCookie : "system";

  const modules = MODULES.map((m) => ({
    id: m.id,
    slug: m.slug,
    titleInUs: dict.common.modules.titles[m.id].in_us,
    titlePreArrival: dict.common.modules.titles[m.id].pre_arrival,
    body: t.modules.items[m.id].body,
    /* Las cuatro cosas concretas que se pueden hacer en cada módulo. Se
       toma la variante `in_us` porque la landing es pública y todavía no
       se sabe si quien mira ya llegó o está por venir. */
    features: dict.modules.byModule[m.id].in_us.features,
  }));

  // Los importes se resuelven aquí, no en el diccionario: el precio es
  // hipótesis a validar (decisión abierta #1 del PRD) y con la cifra
  // incrustada en el copy probar otro obligaría a editar dos idiomas (D17).
  const pricing = {
    ...t.pricing,
    monthly: {
      ...t.pricing.monthly,
      price: t.pricing.monthly.price(formatUsd(PRICES.monthly.usd)),
    },
    annual: {
      ...t.pricing.annual,
      price: t.pricing.annual.price(formatUsd(PRICES.annual.usd)),
      equivalent: t.pricing.annual.equivalent(
        formatUsd(PRICES.annual.monthlyEquivalentUsd),
      ),
      savings: t.pricing.annual.savings(formatUsd(PRICES.annual.savingsUsd)),
    },
  };

  return (
    <BranchProvider initialBranch={branch} ipSuggestion={ipSuggestion} lang={lang}>
      {/* Red de seguridad de las animaciones de entrada.
          Motion sirve los elementos con `opacity:0` en línea y los revela al
          entrar en pantalla. Si el JavaScript no llega —bloqueado, caído, o
          simplemente lento en el Android de gama baja al que apunta el
          producto— el visitante vería la página casi en blanco. Esta regla
          la devuelve entera y visible en ese caso. */}
      <noscript>
        <style
          dangerouslySetInnerHTML={{
            __html:
              "[style*='opacity:0'],[style*='opacity: 0']{opacity:1!important;transform:none!important}",
          }}
        />
      </noscript>

      <SmoothScroll />
      <SectionViewTracker sections={TRACKED_SECTIONS} />

      <TopBanner
        text={t.banner.text}
        ctaLabel={t.banner.cta}
        closeLabel={dict.common.actions.close}
      />

      <SiteNav
        copy={t.nav}
        lang={lang}
        initialTheme={initialTheme}
        langAriaLabel={dict.common.lang.ariaSwitch}
        themeAriaLabel={dict.common.theme.ariaSwitch}
        themeLabels={{
          light: dict.common.theme.light,
          dark: dict.common.theme.dark,
          system: dict.common.theme.system,
        }}
      />

      <main id="contenido">
        {/* La PORTADA del sistema de diseño: fondo navy a sangre, la promesa
            y su límite juntos, y el escáner gratis como primera acción. El
            subtítulo es la frase que ya decía qué es ANDEX (`hero.title`) y
            el aviso de no-afiliación es el mismo de la cinta de confianza:
            uno solo, escrito una vez. */}
        <SectionHero
          copy={{
            brand: dict.common.brand.name,
            badge: t.hero.badge,
            titleLines: t.hero.titleLines,
            title: t.hero.title,
            titleAccent: t.hero.titleAccent,
            body: t.hero.body,
            trustPoints: t.hero.trustPoints,
            accountCta: t.hero.cta,
            ctaHint: t.hero.ctaHint,
            tourLabel: t.hero.tourLabel,
            disclaimer: t.trust.disclaimer,
            tour: dict.tour,
            fotoAlt: t.hero.fotoAlt,
          }}
          foto={imagenes.henryTelefono[0] ?? null}
          accountHref={ROUTES.bienvenida}
        />

        {/* ── S3 · Respaldo y seguridad ──
            La costura pinta el color de la sección de abajo sobre la de
            arriba, así que necesita el navy detrás: la portada no está sobre
            el fondo de página. */}
        {/* Las costuras pasan a ARCO: es la forma del isotipo a escala de
            página, y es lo que hace que la landing deje de leerse como una
            pila de bandas rectas. La de la portada necesita el navy detrás
            porque la sección de arriba no está sobre el fondo de página. */}
        <div className="bg-navy-body">
          <SectionSeam to="navy-deep" shape="arco" />
        </div>
        <SectionTrustBar copy={t.trustBar} images={imagenes.comunidad} />

        {/* ── S4 · La historia del fundador ──
            Sostiene el titular de la portada. «El camino que ya recorrí» sin
            esto es un eslogan; aquí se dice qué camino. */}
        <div className="bg-navy-deep">
          <SectionSeam to="page" shape="arco" />
        </div>
        <SectionFounder copy={t.founder} images={imagenes.fundador} />

        {/* ── S5 · Los siete módulos ── */}
        <SectionSeam to="navy-body" shape="arco" />
        <SectionShowcase
          copy={t.showcase}
          modules={modules.map((m) => ({
            id: m.id,
            slug: m.slug,
            name: m.titleInUs,
            body: m.body,
            features: m.features,
          }))}
        />

        {/* ── S6 · Inglés laboral en vivo ──
            Destacada por el terreno: navy en mitad de una página crema. El
            salto tonal la separa sin marco ni etiqueta de «nuevo». */}
        <SectionEnglish copy={t.english} images={imagenes.ingles} />

        {/* ── S8 · Membresía y precios ──
            La S7 del documento —servicios directos con 20% OFF— se deja
            fuera por decisión del producto. El descuento sigue nombrado
            donde es un beneficio del plan: la portada, esta tabla y la FAQ. */}
        <div className="bg-navy-body">
          <SectionSeam to="page" shape="arco" />
        </div>
        <SectionPricing
          copy={pricing}
          monthlyHref={`${ROUTES.pago}?plan=monthly`}
          annualHref={`${ROUTES.pago}?plan=annual`}
        />

        {/* ── S9 · Preguntas frecuentes ── */}
        <SectionSeam to="navy-body" shape="arco" />
        <SectionFaq
          eyebrow={t.faq.eyebrow}
          title={t.faq.title}
          items={t.faq.items}
        />

        {/* ── S10 · Cierre ── */}
        <SectionClosing
          title={t.closing.title}
          subtitle={t.closing.subtitle}
          ctaLabel={t.closing.cta}
          hint={t.closing.hint}
          ctaHref={ROUTES.bienvenida}
        />
      </main>

      {/* Solo móvil: el CTA del hero desaparece enseguida y el siguiente
          queda muy abajo. Esta barra acompaña el resto del recorrido. */}
      <MobileCtaBar
        label={t.hero.cta}
        hint={t.closing.hint}
        href={ROUTES.bienvenida}
      />

      <SiteFooter
        brand={dict.common.brand.name}
        tagline={t.footer.tagline}
        columns={t.footer.columns}
        links={t.footer.links}
        disclaimer={t.footer.disclaimer}
        rights={t.footer.rights(new Date().getFullYear())}
      />
    </BranchProvider>
  );
}
