"use client";

/**
 * PERFIL (§3.2 regla UX 8: "Todo cambiable después desde Perfil, con recálculo
 * del ranking y toast de confirmación"; §4.7 último caso borde).
 *
 * Reglas que se cumplen aquí:
 *  · Cambiar ubicación, situación, intereses, objetivo o "para quién" RECALCULA
 *    el ranking al guardar y lo confirma con un toast.
 *  · Cambiar de RAMA exige la misma confirmación textual de §3.2.2 y limpia los
 *    datos de la rama anterior (regla dura: nunca conviven estado de EE. UU. y
 *    país extranjero). Se registra como transición de contexto (§3.2.3) con
 *    `trigger_source: 'profile'`.
 *  · La membresía se cancela en UN CLIC (§3.4.6) — ver <SubscriptionCard>.
 *  · §3.4.7: con la membresía vencida el panel queda bloqueado, pero ESTA
 *    pantalla sigue accesible y los datos, intactos.
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { ROUTES } from "@/lib/config";
import { signOut } from "@/lib/auth/client";
import { track } from "@/lib/analytics/track";
import { interestOptionLabel, situationLabel } from "@/lib/i18n";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { Modal } from "@/components/ui/modal";
import { OptionChips } from "@/components/ui/option-chips";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { toast } from "@/components/ui/toaster";
import { GoalCard } from "./goal-card";
import { usePanel } from "./panel-context";
import { SubscriptionCard } from "./subscription-card";
import {
  countryComboboxItems,
  daysBetween,
  stateComboboxItems,
} from "./panel-utils";

const FREE_TEXT_MAX = 120;
const NAME_MAX = 100;

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

function Section({
  id,
  title,
  description,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const headingId = `seccion-${id ?? title.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="scroll-mt-20 rounded-lg border border-line bg-surface p-4 shadow-sm sm:p-5"
    >
      <h2 id={headingId} className="font-heading text-h3 text-ink">
        {title}
      </h2>
      {description ? (
        <p className="mt-1 text-body text-muted">{description}</p>
      ) : null}
      <div className="mt-4 space-y-5">{children}</div>
    </section>
  );
}

export function PerfilView() {
  const { dict, lang, loading, profile, readOnly, saveProfile, applyTransition } =
    usePanel();
  const router = useRouter();

  const [draft, setDraft] = useState<Draft | null>(null);
  const [pendingBranch, setPendingBranch] = useState<LocationContext | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) setDraft(draftFrom(profile));
  }, [profile]);

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

  if (loading || !profile || !draft) return null;

  const t = dict.perfil;
  const context = profile.locationContext;
  const inUs = context === "in_us";

  function patch(values: Partial<Draft>) {
    setDraft((current) => (current ? { ...current, ...values } : current));
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(draftFrom(profile));

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
    if (ok) toast.success(t.toasts.recalculated);
    else toast.error(t.toasts.saveFailed);
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

  return (
    <div className="mx-auto w-full max-w-2xl">
      <header>
        <h1 className="font-heading text-h1 text-ink">{t.title}</h1>
        <p className="mt-1 text-body-lg text-muted">{t.subtitle}</p>
        {readOnly ? (
          <p className="mt-3 rounded-sm bg-amber-soft px-3 py-2 text-body text-ink">
            {dict.panel.shell.readOnlyHint}
          </p>
        ) : null}
      </header>

      <div className="mt-6 space-y-4">
        {/* ── Cuenta ── */}
        <Section id="cuenta" title={t.sections.account}>
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
            value={profile.email}
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
        </Section>

        {/* ── Ubicación (la bifurcación) ── */}
        <Section id="ubicacion" title={t.sections.location}>
          <OptionChips
            label={t.location.contextLabel}
            value={context}
            onChange={(value) => {
              if (readOnly || value === context) return;
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
        </Section>

        {/* ── Situación ── */}
        <Section id="situacion" title={t.sections.situation}>
          <OptionChips
            label={t.sections.situation}
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
        </Section>

        {/* ── Intereses (el orden decide el interés principal, D14) ── */}
        <Section id="intereses" title={t.sections.interests} description={t.interests.help}>
          <OptionChips
            multiple
            label={t.sections.interests}
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
              <h3 className="text-label font-medium text-ink">
                {t.interests.orderTitle}
              </h3>
              <ol className="mt-2 space-y-1">
                {draft.interests.map((tag, index) => (
                  <li
                    key={tag}
                    className="flex min-h-11 items-center gap-2 rounded-sm border border-line px-3 py-1.5"
                  >
                    <span className="min-w-0 flex-1 truncate text-body text-ink">
                      {interestOptionLabel(tag, lang)}
                    </span>
                    {index === 0 ? (
                      <Badge variant="teal">{t.interests.primaryBadge}</Badge>
                    ) : readOnly ? null : (
                      <button
                        type="button"
                        onClick={() =>
                          patch({
                            interests: [
                              tag,
                              ...draft.interests.filter((other) => other !== tag),
                            ],
                          })
                        }
                        className="inline-flex min-h-11 shrink-0 items-center rounded-md px-2 text-caption text-muted underline underline-offset-4 transition-colors hover:text-ink"
                      >
                        {t.interests.makePrimary}
                      </button>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </Section>

        {/* ── Objetivo de 30 días ──
            Es EL MISMO componente del dashboard, no una copia: así el editor,
            el recálculo y el toast se comportan igual en los dos sitios. */}
        <GoalCard />

        {/* ── ¿Para quién buscas ayuda? ── */}
        <Section id="familia" title={t.sections.family}>
          <OptionChips
            label={t.sections.family}
            hideLabel
            value={draft.seekingFor}
            onChange={(value) => patch({ seekingFor: value as SeekingFor })}
            options={SEEKING.map((value) => ({
              value,
              label: dict.wizard.step35.options[value],
              disabled: readOnly,
            }))}
          />
        </Section>

        {/* ── Guardar: recálculo + toast (§3.2 regla 8) ── */}
        {readOnly ? null : (
          <div className="sticky bottom-2 z-10 rounded-lg border border-line bg-surface p-3 shadow-md">
            <Button
              fullWidth
              size="lg"
              onClick={handleSave}
              disabled={!dirty}
              loading={saving}
              loadingLabel={dict.common.actions.loading}
            >
              {t.account.save}
            </Button>
          </div>
        )}

        {/* ── Idioma y apariencia ── */}
        <Section id="preferencias" title={t.sections.preferences}>
          <div>
            <p className="mb-2 text-label font-medium text-ink">
              {t.preferences.languageLabel}
            </p>
            <LanguageToggle
              lang={lang}
              backPath={ROUTES.perfil}
              ariaLabel={dict.common.lang.ariaSwitch}
            />
            <p className="mt-1.5 text-caption text-muted">
              {t.preferences.languageHelp}
            </p>
          </div>

          <div>
            <p className="mb-2 text-label font-medium text-ink">
              {t.preferences.themeLabel}
            </p>
            <ThemeToggle
              ariaLabel={dict.common.theme.ariaSwitch}
              labels={{
                light: t.preferences.themeLight,
                dark: t.preferences.themeDark,
                system: t.preferences.themeSystem,
              }}
            />
          </div>
        </Section>

        {/* ── Membresía ── */}
        <SubscriptionCard />

        {/* ── Sesión ── */}
        <Section id="sesion" title={t.sections.danger}>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut aria-hidden="true" className="size-4" />
            {t.danger.logout}
          </Button>
        </Section>
      </div>

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
