import { cookies } from "next/headers";

import { COOKIES, PRICES, ROUTES } from "@/lib/config";
import { MODULES } from "@/lib/catalogs/modules";
import { getGeoHint, suggestedContext } from "@/lib/geo";
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
import { SectionVision } from "@/components/landing/section-vision";
import { SectionNeeds } from "@/components/landing/section-needs";
import { SectionScanner } from "@/components/landing/section-scanner";
import { SectionShowcase } from "@/components/landing/section-showcase";
import { SectionReviews } from "@/components/landing/section-reviews";
import { SectionPricing } from "@/components/landing/section-pricing";
import { SectionFaq } from "@/components/landing/section-faq";
import { SectionClosing } from "@/components/landing/section-closing";
import { SiteFooter } from "@/components/landing/site-footer";

/**
 * LANDING PAGE — la estructura de las maquetas.
 *
 *   1. Hero .............. la promesa y «Comenzar viaje»
 *   2. Qué es ANDEX ...... con cuatro cifras COMPROBABLES
 *   3. Lo que no funciona  cuatro situaciones, dos por dos
 *   4. El escáner ........ gratis y sin registro
 *   5. Los siete módulos . maestro-detalle en escritorio, lista en móvil
 *   6. El precio ......... antes de pedir un dato de pago
 *   7. Reseñas ........... vacía hoy, y dice por qué
 *   8. Preguntas ......... a dos columnas
 *   9. El cierre
 *
 * Se retiraron de la página —los archivos siguen en el repositorio—
 * `SectionTrust`, `SectionCompare`, `ModuleWheel`, `SectionModules`,
 * `SectionServices` y `SectionPurpose`: las cuatro primeras las sustituyen
 * las secciones nuevas, y las dos últimas (misión, visión, Starbiz) son
 * contenido real que la maqueta no contempla y que hay que decidir dónde
 * va — no se borran a la ligera.
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
const TRACKED_SECTIONS = [
  "hero",
  "confianza",
  "comparativa",
  "probar",
  "frentes",
  "modulos",
  "servicios",
  "comunidad",
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
            titleLines: t.portada.titleLines,
            title: t.portada.title,
            subtitle: t.hero.title,
            promiseLines: t.portada.promiseLines,
            scanCta: t.portada.scanCta,
            accountCta: t.portada.accountCta,
            disclaimer: t.trust.disclaimer,
            tour: dict.tour,
          }}
          scanHref="#probar"
          accountHref={ROUTES.registro}
        />

        {/* La costura pinta el color de la sección de abajo sobre el de la de
            arriba, así que necesita el navy detrás: la portada ya no está
            sobre el fondo de página. */}
        <div className="bg-navy">
          <SectionSeam to="surface" />
        </div>
        {/* ── Qué es ANDEX, con cifras que se pueden comprobar ── */}
        <SectionVision copy={t.vision} />

        {/* ── Lo que hoy no funciona ──
            Va después del qué y antes del cómo: primero que alguien se
            reconozca en el problema, luego enseñarle la herramienta. */}
        <SectionSeam to="surface" />
        <SectionNeeds copy={t.needs} />

        {/* ── El escáner, gratis y sin registro ──
            No está en las maquetas y se queda a propósito: es la única
            parte de la página donde el producto DEMUESTRA en vez de
            contar, y ocurre sin pedir un solo dato. Quitarlo sería
            cambiar la prueba por una promesa. */}
        <SectionSeam to="page" />
        <SectionScanner
          copy={t.liveScanner}
          scanCopy={dict.boveda.scan}
          ctaHref={ROUTES.registro}
        />

        {/* ── Los siete módulos, uno a uno ── */}
        <SectionSeam to="surface" />
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

        {/* ── El precio, antes de pedir un dato de pago ──
            Tampoco está en las maquetas, y también se queda: es un producto
            de suscripción y esconder el precio hasta el registro es
            exactamente lo que hace desconfiar a quien ya fue estafado. */}
        <SectionSeam to="teal-soft" />
        <SectionPricing
          copy={pricing}
          monthlyHref={ROUTES.registro}
          annualHref={ROUTES.registro}
        />

        {/* ── Reseñas ──
            Hoy sale vacía a propósito: no hay ninguna real todavía. */}
        <SectionSeam to="page" />
        <SectionReviews copy={t.reviews} />

        <SectionSeam to="page" />
        <SectionFaq
          eyebrow={t.faq.eyebrow}
          title={t.faq.title}
          items={t.faq.items}
        />

        <SectionSeam to="navy" shape="wedge" />
        <SectionClosing
          title={t.closing.title}
          subtitle={t.closing.subtitle}
          ctaLabel={t.closing.cta}
          hint={t.closing.hint}
          ctaHref={ROUTES.registro}
        />
      </main>

      {/* Solo móvil: el CTA del hero desaparece enseguida y el siguiente
          queda muy abajo. Esta barra acompaña el resto del recorrido. */}
      <MobileCtaBar
        label={t.hero.cta}
        hint={t.closing.hint}
        href={ROUTES.registro}
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
