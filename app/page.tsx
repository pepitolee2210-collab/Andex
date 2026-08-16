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
import { SectionTrust } from "@/components/landing/section-trust";
import { SectionCompare } from "@/components/landing/section-compare";
import { ModuleWheel } from "@/components/landing/module-wheel";
import { SectionScanner } from "@/components/landing/section-scanner";
import { SectionModules } from "@/components/landing/section-modules";
import { SectionServices } from "@/components/landing/section-services";
import { SectionPurpose } from "@/components/landing/section-purpose";
import { SectionPricing } from "@/components/landing/section-pricing";
import { SectionFaq } from "@/components/landing/section-faq";
import { SectionClosing } from "@/components/landing/section-closing";
import { SiteFooter } from "@/components/landing/site-footer";

/**
 * LANDING PAGE — diez secciones.
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

  // La rueda usa nombres cortos —gira, no se lee despacio— y cada uno lleva
  // al registro: los módulos viven tras el embudo, no son rutas públicas.
  const wheelItems = t.wheel.items.map((label) => ({
    label,
    href: ROUTES.registro,
  }));

  const modules = MODULES.map((m) => ({
    id: m.id,
    slug: m.slug,
    titleInUs: dict.common.modules.titles[m.id].in_us,
    titlePreArrival: dict.common.modules.titles[m.id].pre_arrival,
    body: t.modules.items[m.id].body,
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
        <SectionTrust copy={t.trust} />

        {/* `solucion` es el ancla del nav; la sección explica por qué existe
            ANDEX antes de enseñar el producto. */}
        <SectionSeam to="page" />
        <SectionCompare copy={t.compare} />

        {/* El visitante acaba de reconocer su propio problema en la sección
            anterior. Aquí se le resuelve uno, gratis y sin pedirle nada: es
            la demostración de valor más fuerte de la página, y el sitio
            donde el argumento de la bóveda deja de ser una promesa. */}
        <SectionSeam to="surface" />
        <SectionScanner
          copy={t.liveScanner}
          scanCopy={dict.boveda.scan}
          ctaHref={ROUTES.registro}
        />

        {/* Redoble entre el porqué y el detalle: la rueda nombra los siete
            frentes, y justo debajo la parrilla los explica. Cada palabra es
            un enlace real, así que además hace de acceso rápido. */}
        <SectionSeam to="navy" shape="wedge" />
        <ModuleWheel
          eyebrow={t.wheel.eyebrow}
          title={t.wheel.title}
          listLabel={t.wheel.listLabel}
          items={wheelItems}
        />

        <SectionSeam to="surface-alt" shape="wedge" />
        <SectionModules
          modules={modules}
          defaultVariant="in_us"
          copy={{
            eyebrow: t.modules.eyebrow,
            title: t.modules.title,
            subtitle: t.modules.subtitle,
            reorderedNote: t.modules.reorderedNote,
            ctaLabel: t.modules.cta,
          }}
          ctaHref={ROUTES.registro}
        />

        {/* La entrada al bloque navy es la más marcada de la página:
            aquí cambia el tono del discurso, de producto a gestoría. */}
        <SectionSeam to="navy" shape="wedge" />
        <SectionServices copy={t.services} ctaHref={ROUTES.registro} />

        {/* El nav enlaza esta sección como "Comunidad": es donde viven
            CEO Junior y Padres 3.0. */}
        <SectionSeam to="page" shape="wedge" />
        <SectionPurpose copy={t.purpose} id="comunidad" />

        <SectionSeam to="teal-soft" />
        <SectionPricing
          copy={pricing}
          monthlyHref={ROUTES.registro}
          annualHref={ROUTES.registro}
        />

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
