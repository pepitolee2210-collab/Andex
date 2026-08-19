"use client";

/**
 * PERFIL — la pantalla del sistema de diseño (`ui_kits/app/screens.jsx`,
 * componente `Perfil`).
 *
 * ── Qué cambió, y por qué ──
 *
 * Antes esto era un formulario de siete bloques abiertos a la vez —cuatro
 * campos, dos comboboxes, tres tiras de fichas, el objetivo, la membresía y
 * el cierre de sesión—, con una barra pegajosa de "Guardar cambios" al pie.
 * Dos problemas reales:
 *
 *   1. La barra pegajosa vivía a `bottom-2` con `z-10`, y la barra de cinco
 *      pestañas del armazón va a `bottom-0` con `z-30`. El botón de guardar
 *      quedaba DEBAJO de las pestañas: el verificador visual lo cazaba en
 *      cada pasada ("pulsable TAPADO por una barra fija"). Ya no existe esa
 *      barra: cada bloque se edita en su propia hoja y el botón vive en el
 *      pie de esa hoja, donde nada lo tapa.
 *   2. Con todo abierto a la vez, la pantalla no decía qué guarda ANDEX de
 *      ti; había que leerse el formulario entero para averiguarlo.
 *
 * Ahora Perfil es una LISTA, como en el diseño: cada fila dice qué guarda y
 * qué hay dentro, y se abre sola. La lógica es la misma de antes —el
 * recálculo del ranking al guardar (§3.2 regla 8), la confirmación textual
 * al cambiar de rama (§3.2.2), el orden de intereses de D14, la membresía de
 * §3.4.6/§3.4.7 y el cierre de sesión—, sólo cambia la forma.
 *
 * ── El control de tema ──
 *
 * Vive aquí, en su propio grupo, con dos opciones y ninguna tercera. No hay
 * "según mi dispositivo" a propósito: el sistema de diseño lo escribe con
 * todas las letras —"no sigue al sistema ni a la hora"— porque la app se usa
 * bajo sol directo y de noche en la misma media hora, y si alguien lo eligió,
 * no se le mueve. Escribe la cookie `andex_theme`, que es lo que el armazón
 * ya lee; aquí no se toca nada del armazón.
 */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Compass,
  Languages,
  ListOrdered,
  Lock,
  LogOut,
  MapPin,
  SunMoon,
  Target,
  User,
  Users,
} from "lucide-react";
import { COOKIES, ROUTES } from "@/lib/config";
import { signOut } from "@/lib/auth/client";
import { track } from "@/lib/analytics/track";
import { goalLabel, interestOptionLabel, situationLabel } from "@/lib/i18n";
import { interestsForBranch } from "@/lib/catalogs/interests";
import { situationsForContext } from "@/lib/catalogs/situations";
import { COUNTRY_NOT_LISTED } from "@/lib/catalogs/countries";
import type {
  InterestTag,
  LocationContext,
  SeekingFor,
  SituationTag,
  StoredProfile,
  TimeInUSTag,
  TravelPlanTag,
} from "@/lib/types";
import { sanitizeFreeText } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { Modal } from "@/components/ui/modal";
import { OptionChips } from "@/components/ui/option-chips";
import { toast } from "@/components/ui/toaster";
import {
  Glyph,
  KitBadge,
  KitCard,
  KitNotice,
  ListGroup,
  ListRow,
  ScreenHeader,
  SectionLabel,
  Segmented,
  StatePanel,
} from "@/components/ui/kit";
import { GoalCard } from "./goal-card";
import { usePanel } from "./panel-context";
import { SubscriptionCard } from "./subscription-card";
import {
  countryComboboxItems,
  daysBetween,
  scopeName,
  stateComboboxItems,
} from "./panel-utils";

const FREE_TEXT_MAX = 120;
const NAME_MAX = 100;
const YEAR_S = 60 * 60 * 24 * 365;

const TIME_TAGS: readonly TimeInUSTag[] = [
  "menos_6_meses",
  "6m_2a",
  "2a_5a",
  "mas_5a",
  "no_responde",
];
const TRAVEL_TAGS: readonly TravelPlanTag[] = [
  "fecha_confirmada",
  "este_ano",
  "explorando",
  "no_se",
];
const SEEKING: readonly SeekingFor[] = ["self", "family", "both"];

/** Las hojas de detalle. Cada fila de la lista abre exactamente una. */
type Detail =
  | "account"
  | "language"
  | "location"
  | "situation"
  | "interests"
  | "goal"
  | "family";

/** Las hojas que escriben en el perfil llevan pie con Guardar. */
const SAVES: ReadonlySet<Detail> = new Set<Detail>([
  "account",
  "location",
  "situation",
  "interests",
  "family",
]);

/** Campos del perfil editables desde esta pantalla. */
type Draft = Pick<
  StoredProfile,
  | "firstName"
  | "lastName"
  | "phone"
  | "stateUS"
  | "countryOfResidence"
  | "countryOther"
  | "nationality"
  | "timeInUS"
  | "travelPlan"
  | "situation"
  | "situationOther"
  | "situationDeclined"
  | "seekingFor"
  | "interests"
  | "interestsOther"
>;

function draftFrom(profile: StoredProfile): Draft {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    phone: profile.phone,
    stateUS: profile.stateUS,
    countryOfResidence: profile.countryOfResidence,
    countryOther: profile.countryOther,
    nationality: profile.nationality,
    timeInUS: profile.timeInUS,
    travelPlan: profile.travelPlan,
    situation: profile.situation,
    situationOther: profile.situationOther,
    situationDeclined: profile.situationDeclined,
    seekingFor: profile.seekingFor,
    interests: profile.interests,
    interestsOther: profile.interestsOther,
  };
}

/**
 * D14 — los intereses se guardan en ORDEN DE SELECCIÓN: `[0]` recibe
 * PRIMARY_INTEREST (+30) y el resto OTHER_INTEREST (+15). `OptionChips` en
 * modo múltiple devuelve el orden del catálogo, así que aquí se reconstruye:
 * los que ya estaban conservan su sitio y los nuevos van al final.
 */
function mergeSelectionOrder(previous: InterestTag[], next: string[]): InterestTag[] {
  const nextSet = new Set(next);
  const kept = previous.filter((tag) => nextSet.has(tag));
  const added = next.filter(
    (tag) => !previous.includes(tag as InterestTag),
  ) as InterestTag[];
  return [...kept, ...added];
}

/* ── El tema, sin tercera opción ─────────────────────────── */

type Theme = "light" | "dark";

/**
 * Qué tema hay puesto AHORA. Primero la cookie —es lo que decidió la
 * persona—, y si nunca eligió, lo que se esté viendo: el atributo que puso el
 * armazón o, en su defecto, la preferencia del navegador. Así el control
 * arranca marcando lo que la pantalla enseña, no un valor por defecto que
 * contradice lo que se ve.
 */
function readTheme(): Theme {
  if (typeof document === "undefined") return "light";
  const cookie = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${COOKIES.theme}=(light|dark)`),
  );
  if (cookie) return cookie[1] as Theme;
  const attr = document.documentElement.dataset.theme;
  if (attr === "light" || attr === "dark") return attr;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function writeTheme(next: Theme) {
  document.documentElement.setAttribute("data-theme", next);
  document.cookie = `${COOKIES.theme}=${next}; path=/; max-age=${YEAR_S}; samesite=lax`;
  // El servidor queda en sync para el siguiente render; sin red no pasa nada,
  // porque la cookie local ya está escrita y el atributo ya está puesto.
  fetch(`/api/prefs?theme=${next}&back=/`, { keepalive: true }).catch(() => {
    /* sin conexión el tema ya cambió en este dispositivo */
  });
}

/** El galón de la derecha: esta fila lleva a algún sitio. */
function Trail() {
  return (
    <Glyph
      name="chevron-right"
      icon={ChevronRight}
      size={18}
      strokeWidth={2}
      className="shrink-0 text-disabled"
    />
  );
}

export function PerfilView() {
  const { dict, lang, loading, profile, readOnly, saveProfile, applyTransition } =
    usePanel();
  const router = useRouter();

  const [draft, setDraft] = useState<Draft | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [pendingBranch, setPendingBranch] = useState<LocationContext | null>(null);
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    if (profile) setDraft(draftFrom(profile));
  }, [profile]);

  // El tema real sólo se conoce en el cliente (cookie o preferencia del
  // navegador): se lee tras montar para no pintar el control mintiendo.
  useEffect(() => {
    setTheme(readTheme());
  }, []);

  const interestOptions = useMemo(
    () =>
      profile
        ? interestsForBranch(profile.locationContext).map((tag) => ({
            value: tag,
            label: interestOptionLabel(tag, lang),
          }))
        : [],
    [profile, lang],
  );

  if (loading) return null;

  /**
   * PERFIL VACÍO — quien pagó y todavía no contestó la entrevista.
   *
   * El embudo nuevo —bienvenida → pago → cuenta → comunidad— deja entrar sin
   * perfil a propósito (§3.2 regla 6: la entrevista se puede saltar). Antes
   * esta pantalla devolvía `null` en ese caso, así que tocar "Perfil" abría
   * una pantalla EN BLANCO. Ahora dice qué falta y ofrece contestarlo, sin
   * obligar: el resto de la app sigue abierto.
   */
  if (!profile || !draft) {
    const h = dict.panel.hero;
    return (
      <div className="mx-auto w-full max-w-2xl px-5 pb-10 pt-6 sm:px-6">
        <ScreenHeader title={dict.perfil.title} />
        <KitCard className="mt-[22px]">
          <StatePanel icon={User} title={h.genericTitle} body={h.genericBody}>
            <Button href={ROUTES.entrevista} className="mt-5">
              {h.genericCta}
            </Button>
          </StatePanel>
        </KitCard>
      </div>
    );
  }

  const t = dict.perfil;
  const context = profile.locationContext;
  const inUs = context === "in_us";

  function patch(values: Partial<Draft>) {
    setDraft((current) => (current ? { ...current, ...values } : current));
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(draftFrom(profile));

  /** Cerrar sin guardar deja el perfil como estaba: el borrador se descarta. */
  function closeDetail() {
    setDetail(null);
    setDraft(draftFrom(profile!));
  }

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    const ok = await saveProfile({
      firstName: sanitizeFreeText(draft.firstName, NAME_MAX),
      lastName: draft.lastName ? sanitizeFreeText(draft.lastName, NAME_MAX) : null,
      phone: draft.phone ? sanitizeFreeText(draft.phone, 20) : null,
      stateUS: draft.stateUS,
      countryOfResidence: draft.countryOfResidence,
      countryOther:
        draft.countryOfResidence === COUNTRY_NOT_LISTED
          ? sanitizeFreeText(draft.countryOther ?? "", FREE_TEXT_MAX) || null
          : null,
      nationality: draft.nationality,
      timeInUS: draft.timeInUS,
      travelPlan: draft.travelPlan,
      situation: draft.situationDeclined ? null : draft.situation,
      situationOther:
        draft.situation === "other"
          ? sanitizeFreeText(draft.situationOther ?? "", FREE_TEXT_MAX) || null
          : null,
      situationDeclined: draft.situationDeclined,
      seekingFor: draft.seekingFor,
      interests: draft.interests,
      interestsOther: draft.interests.includes("other")
        ? sanitizeFreeText(draft.interestsOther ?? "", FREE_TEXT_MAX) || null
        : null,
    });
    setSaving(false);
    // §3.2 regla 8 / §4.7 — el toast confirma que el plan se recalculó.
    if (ok) {
      setDetail(null);
      toast.success(t.toasts.recalculated);
    } else {
      toast.error(t.toasts.saveFailed);
    }
  }

  /** §3.2.2 — cambio de rama: confirmación textual antes de borrar nada. */
  async function confirmBranchChange() {
    const next = pendingBranch;
    setPendingBranch(null);
    if (!next || !profile) return;

    const from = profile.locationContext;
    const createdAt = profile.createdAt;
    const updated = await applyTransition({
      toContext: next,
      stateUS: next === "in_us" ? (draft?.stateUS ?? undefined) : undefined,
      countryOfResidence:
        next === "pre_arrival" ? (draft?.countryOfResidence ?? undefined) : undefined,
      trigger: "profile",
    });

    if (!updated) {
      toast.error(t.toasts.saveFailed);
      return;
    }
    track("location_context_changed", {
      from,
      to: next,
      trigger_source: "profile",
      days_since_signup: daysBetween(createdAt, new Date()),
    });
    toast.success(t.toasts.recalculated);
  }

  async function handleSignOut() {
    await signOut();
    router.push(ROUTES.landing);
  }

  const situationValue = draft.situationDeclined
    ? "declined"
    : (draft.situation ?? null);

  /* ── Lo que dice cada fila sin abrirla ─────────────────── */

  const fullName = `${profile.firstName} ${profile.lastName ?? ""}`.trim();
  const initials =
    [profile.firstName, profile.lastName]
      .filter((part): part is string => Boolean(part && part.trim()))
      .map((part) => part.trim()[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || fullName.slice(0, 2).toUpperCase();

  const created = new Date(profile.createdAt);
  const since = Number.isNaN(created.getTime())
    ? ""
    : new Intl.DateTimeFormat(lang === "en" ? "en-US" : "es-419", {
        month: "long",
        year: "numeric",
      }).format(created);
  const scope = scopeName(profile, lang);
  const identityMeta = scope
    ? t.identity.meta(scope, since)
    : t.identity.metaNoScope(since);

  const branchLabel = inUs ? t.location.inUsLabel : t.location.preArrivalLabel;
  const locationMeta = scope
    ? `${branchLabel} · ${scope}`
    : `${branchLabel} · ${t.rows.locationEmpty}`;

  const situationMeta = profile.situationDeclined
    ? situationLabel("declined", context, lang)
    : profile.situation
      ? situationLabel(profile.situation, context, lang)
      : t.rows.situationEmpty;

  const interestsMeta =
    profile.interests.length > 0
      ? t.rows.interestsCount(profile.interests.length)
      : t.rows.interestsEmpty;

  const goalMeta =
    profile.immediateGoal === "custom"
      ? (profile.immediateGoalCustom ?? "").trim() || t.rows.goalEmpty
      : profile.immediateGoal
        ? goalLabel(profile.immediateGoal, lang)
        : t.rows.goalEmpty;

  /* ── Las hojas de detalle ──────────────────────────────── */

  const DETAIL_TITLES: Record<Detail, string> = {
    account: t.rows.account,
    language: t.rows.language,
    location: t.rows.location,
    situation: t.rows.situation,
    interests: t.rows.interests,
    goal: t.rows.goal,
    family: t.rows.family,
  };

  function detailBody(which: Detail): ReactNode {
    if (!draft) return null;

    if (which === "account") {
      return (
        <div className="space-y-5">
          <Input
            label={t.account.firstNameLabel}
            value={draft.firstName}
            maxLength={NAME_MAX}
            disabled={readOnly}
            onChange={(e) => patch({ firstName: e.target.value })}
          />
          <Input
            label={t.account.lastNameLabel}
            value={draft.lastName ?? ""}
            maxLength={NAME_MAX}
            disabled={readOnly}
            onChange={(e) => patch({ lastName: e.target.value })}
          />
          <Input
            label={t.account.emailLabel}
            type="email"
            value={profile!.email}
            help={t.account.emailHelp}
            disabled
            readOnly
          />
          <Input
            label={t.account.phoneLabel}
            type="tel"
            value={draft.phone ?? ""}
            maxLength={20}
            disabled={readOnly}
            onChange={(e) => patch({ phone: e.target.value })}
          />
        </div>
      );
    }

    if (which === "language") {
      // Sigue siendo un enlace a /api/prefs: el idioma se resuelve en el
      // servidor y funciona sin JavaScript (§3.1.1).
      return (
        <div>
          <LanguageToggle
            lang={lang}
            backPath={ROUTES.perfil}
            ariaLabel={dict.common.lang.ariaSwitch}
          />
          <p className="mt-3 text-body text-muted">{t.preferences.languageHelp}</p>
        </div>
      );
    }

    if (which === "location") {
      return (
        <div className="space-y-5">
          <OptionChips
            label={t.location.contextLabel}
            value={context}
            onChange={(value) => {
              if (readOnly || value === context) return;
              // La confirmación sustituye a esta hoja en vez de apilarse
              // encima: dos diálogos a la vez es una trampa de foco.
              setDetail(null);
              setPendingBranch(value as LocationContext);
            }}
            options={[
              { value: "in_us", label: t.location.inUsLabel },
              { value: "pre_arrival", label: t.location.preArrivalLabel },
            ]}
          />

          {inUs ? (
            <>
              <Combobox
                label={t.location.stateLabel}
                placeholder={dict.wizard.step2.inUs.statePlaceholder}
                items={stateComboboxItems(lang)}
                value={draft.stateUS}
                onChange={(value) => patch({ stateUS: value })}
                disabled={readOnly}
                emptyText={dict.wizard.step2.inUs.stateEmpty}
                groupLabels={dict.wizard.step2.inUs.stateGroups}
                help={dict.wizard.step2.inUs.stateHelp}
              />
              <OptionChips
                label={t.location.timeLabel}
                value={draft.timeInUS}
                onChange={(value) => patch({ timeInUS: value as TimeInUSTag })}
                options={TIME_TAGS.map((tag) => ({
                  value: tag,
                  label: dict.wizard.step2.timeOptions[tag],
                  disabled: readOnly,
                }))}
              />
            </>
          ) : (
            <>
              <Combobox
                label={t.location.countryLabel}
                placeholder={dict.wizard.step2.preArrival.countryPlaceholder}
                items={countryComboboxItems(
                  lang,
                  dict.wizard.step2.preArrival.countryNotListed,
                )}
                value={draft.countryOfResidence}
                onChange={(value) => patch({ countryOfResidence: value })}
                disabled={readOnly}
                emptyText={dict.wizard.step2.preArrival.countryEmpty}
                groupLabels={dict.wizard.step2.preArrival.countryGroups}
                help={dict.wizard.step2.preArrival.countryHelp}
              />
              {draft.countryOfResidence === COUNTRY_NOT_LISTED ? (
                <Input
                  label={dict.wizard.step2.preArrival.countryNotListed}
                  placeholder={dict.wizard.step2.preArrival.countryNotListedPlaceholder}
                  value={draft.countryOther ?? ""}
                  maxLength={FREE_TEXT_MAX}
                  disabled={readOnly}
                  onChange={(e) => patch({ countryOther: e.target.value })}
                />
              ) : null}
              <Combobox
                label={t.location.nationalityLabel}
                placeholder={dict.wizard.step2.preArrival.nationalityPlaceholder}
                items={countryComboboxItems(lang, "").filter(
                  (item) => item.value !== COUNTRY_NOT_LISTED,
                )}
                value={draft.nationality}
                onChange={(value) => patch({ nationality: value })}
                disabled={readOnly}
                emptyText={dict.wizard.step2.preArrival.countryEmpty}
                groupLabels={dict.wizard.step2.preArrival.countryGroups}
                help={dict.common.optionalLabel}
              />
              <OptionChips
                label={t.location.travelPlanLabel}
                value={draft.travelPlan}
                onChange={(value) => patch({ travelPlan: value as TravelPlanTag })}
                options={TRAVEL_TAGS.map((tag) => ({
                  value: tag,
                  label: dict.wizard.step2.travelPlanOptions[tag],
                  disabled: readOnly,
                }))}
              />
            </>
          )}
        </div>
      );
    }

    if (which === "situation") {
      return (
        <div className="space-y-5">
          <OptionChips
            label={t.rows.situation}
            hideLabel
            value={situationValue}
            onChange={(value) => {
              if (value === "declined") {
                patch({ situationDeclined: true, situation: null, situationOther: null });
                return;
              }
              patch({
                situationDeclined: false,
                situation: value as SituationTag | "other",
              });
            }}
            options={situationsForContext(context).map((option) => ({
              value: option.tag,
              label: situationLabel(option.tag, context, lang),
              disabled: readOnly,
            }))}
          />
          {draft.situation === "other" && !draft.situationDeclined ? (
            <Input
              label={dict.wizard.other.label}
              placeholder={dict.wizard.other.placeholder}
              help={dict.wizard.other.help}
              value={draft.situationOther ?? ""}
              maxLength={FREE_TEXT_MAX}
              disabled={readOnly}
              onChange={(e) => patch({ situationOther: e.target.value })}
            />
          ) : null}
        </div>
      );
    }

    if (which === "interests") {
      return (
        <div className="space-y-5">
          <p className="text-body text-muted">{t.interests.help}</p>
          <OptionChips
            multiple
            label={t.rows.interests}
            hideLabel
            value={draft.interests}
            onChange={(value) =>
              patch({ interests: mergeSelectionOrder(draft.interests, value) })
            }
            options={interestOptions.map((option) => ({
              ...option,
              disabled: readOnly,
            }))}
          />

          {draft.interests.includes("other") ? (
            <Input
              label={dict.wizard.other.label}
              placeholder={dict.wizard.other.placeholder}
              help={dict.wizard.other.help}
              value={draft.interestsOther ?? ""}
              maxLength={FREE_TEXT_MAX}
              disabled={readOnly}
              onChange={(e) => patch({ interestsOther: e.target.value })}
            />
          ) : null}

          {draft.interests.length > 1 ? (
            <div>
              <SectionLabel as="h3">{t.interests.orderTitle}</SectionLabel>
              <ListGroup as="ul">
                {draft.interests.map((tag, index) => (
                  <li key={tag} className="row">
                    <span className="rowmain">
                      <span className="rowtitle">
                        {interestOptionLabel(tag, lang)}
                      </span>
                    </span>
                    <span className="rowtrail">
                      {index === 0 ? (
                        <KitBadge tone="accent">{t.interests.primaryBadge}</KitBadge>
                      ) : readOnly ? null : (
                        <Button
                          variant="ghost"
                          onClick={() =>
                            patch({
                              interests: [
                                tag,
                                ...draft.interests.filter((other) => other !== tag),
                              ],
                            })
                          }
                        >
                          {t.interests.makePrimary}
                        </Button>
                      )}
                    </span>
                  </li>
                ))}
              </ListGroup>
            </div>
          ) : null}
        </div>
      );
    }

    if (which === "goal") {
      // El MISMO componente del panel, no una copia: así el editor, el
      // recálculo y el toast se comportan igual en los dos sitios.
      return <GoalCard />;
    }

    return (
      <OptionChips
        label={t.rows.family}
        hideLabel
        value={draft.seekingFor}
        onChange={(value) => patch({ seekingFor: value as SeekingFor })}
        options={SEEKING.map((value) => ({
          value,
          label: dict.wizard.step35.options[value],
          disabled: readOnly,
        }))}
      />
    );
  }

  return (
    <div className="mx-auto w-full">
      <ScreenHeader title={t.title} />

      {/* ── Quién eres, y desde cuándo ── */}
      <KitCard className="mt-[18px] flex items-center gap-3.5">
        <span
          aria-hidden="true"
          className="flex size-13 shrink-0 items-center justify-center rounded-full font-extrabold"
          style={{
            background: "var(--navy-50)",
            color: "var(--navy-700)",
            fontSize: "var(--size-body-lg)",
          }}
        >
          {initials}
        </span>
        <div className="min-w-0">
          <p
            className="text-body-lg font-bold text-ink"
            style={{ letterSpacing: "-.018em" }}
          >
            {fullName}
          </p>
          <p className="mt-1 text-muted" style={{ fontSize: 16 }}>
            {identityMeta}
          </p>
        </div>
      </KitCard>

      {/* ── Cuenta ── */}
      <SectionLabel as="h2">{t.sections.account}</SectionLabel>
      <ListGroup>
        <ListRow
          iconName="user"
          icon={User}
          title={t.rows.account}
          meta={t.rows.accountMeta}
          trail={<Trail />}
          onClick={() => setDetail("account")}
        />
        <ListRow
          iconName="languages"
          icon={Languages}
          title={t.rows.language}
          meta={dict.common.lang[lang]}
          trail={<Trail />}
          onClick={() => setDetail("language")}
        />
      </ListGroup>

      {/* ── El tema: su propio grupo, y sin tercera opción ── */}
      <ListGroup className="mt-2.5 px-4 py-[15px]">
        <div className="flex items-start gap-3.5">
          <span className="rowicon tone-quiet">
            <Glyph name="sun-moon" icon={SunMoon} size={19} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="rowtitle">{t.rows.theme}</p>
            <p
              className="mt-1.5 text-muted"
              style={{ fontSize: "var(--size-footnote)", lineHeight: 1.45 }}
            >
              {t.rows.themeHelp}
            </p>
          </div>
        </div>
        <Segmented
          className="mt-3"
          groupLabel={t.rows.themeAria}
          value={theme}
          onChange={(next) => {
            setTheme(next);
            writeTheme(next);
          }}
          items={[
            { key: "light" as Theme, label: t.rows.themeDay },
            { key: "dark" as Theme, label: t.rows.themeNight },
          ]}
        />
      </ListGroup>

      {/* ── Dónde estoy (la bifurcación de §3.2.2) ── */}
      <ListGroup className="mt-2.5">
        <ListRow
          iconName="map-pin"
          icon={MapPin}
          title={t.rows.location}
          meta={locationMeta}
          trail={<Trail />}
          onClick={() => setDetail("location")}
        />
      </ListGroup>

      {/* ── Tu plan: lo que ordena el panel ── */}
      <SectionLabel as="h2">{t.sections.plan}</SectionLabel>
      <ListGroup>
        <ListRow
          iconName="compass"
          icon={Compass}
          title={t.rows.situation}
          meta={situationMeta}
          trail={<Trail />}
          onClick={() => setDetail("situation")}
        />
        <ListRow
          iconName="list-ordered"
          icon={ListOrdered}
          title={t.rows.interests}
          meta={interestsMeta}
          trail={<Trail />}
          onClick={() => setDetail("interests")}
        />
        <ListRow
          iconName="target"
          icon={Target}
          title={t.rows.goal}
          meta={goalMeta}
          trail={<Trail />}
          onClick={() => setDetail("goal")}
        />
        <ListRow
          iconName="users"
          icon={Users}
          title={t.rows.family}
          meta={dict.wizard.step35.options[profile.seekingFor]}
          trail={<Trail />}
          onClick={() => setDetail("family")}
        />
      </ListGroup>

      {/* ── Suscripción (§3.4.6 y §3.4.7) ── */}
      <SubscriptionCard />

      {/* ── Tus datos ── */}
      <SectionLabel as="h2">{t.sections.data}</SectionLabel>
      <ListGroup>
        <ListRow
          iconName="log-out"
          icon={LogOut}
          title={t.rows.logout}
          meta={t.rows.logoutMeta}
          onClick={handleSignOut}
        />
      </ListGroup>

      {/* La promesa de cifrado dice su límite en la misma frase. */}
      <KitNotice className="mt-3" iconName="lock" icon={Lock}>
        {t.vaultNotice}
      </KitNotice>

      {/* ── La hoja de detalle ── */}
      <Modal
        open={detail !== null}
        onClose={closeDetail}
        title={detail ? DETAIL_TITLES[detail] : t.title}
        closeLabel={dict.common.aria.closeModal}
        variant="fullscreen-mobile"
        footer={
          detail && SAVES.has(detail) && !readOnly ? (
            <>
              <Button variant="ghost" onClick={closeDetail}>
                {dict.common.actions.cancel}
              </Button>
              <Button
                onClick={handleSave}
                disabled={!dirty}
                loading={saving}
                loadingLabel={dict.common.actions.loading}
              >
                {t.account.save}
              </Button>
            </>
          ) : undefined
        }
      >
        {detail ? detailBody(detail) : null}
      </Modal>

      {/* §3.2.2 — confirmación TEXTUAL antes de cambiar de rama. */}
      <Modal
        open={pendingBranch !== null}
        onClose={() => setPendingBranch(null)}
        title={t.location.changeBranchTitle}
        closeLabel={t.location.changeBranchCancel}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingBranch(null)}>
              {t.location.changeBranchCancel}
            </Button>
            <Button onClick={confirmBranchChange}>
              {t.location.changeBranchAccept}
            </Button>
          </>
        }
      >
        <p className="text-body text-ink">{t.location.changeBranchBody}</p>
      </Modal>
    </div>
  );
}
