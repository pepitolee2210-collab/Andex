"use client";

import { useMemo, useState } from "react";
import type { Lang, OnboardingDraft } from "@/lib/types";
import type { WizardDict } from "@/lib/i18n";
import { countriesGrouped, countryByCode, dialCodeOptions } from "@/lib/catalogs/countries";
import { Combobox, type ComboboxItem } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";

/**
 * PASO 1 — Datos básicos (§3.2).
 *
 * Nombre y correo son obligatorios; apellido y teléfono no (§3.2 regla 5).
 * El código de país del teléfono se **preselecciona por IP y queda siempre
 * editable** (regla 7: se sugiere, el usuario confirma) — nunca se autoenvía
 * ni se bloquea.
 *
 * Se persiste el código telefónico (`+52`), que es lo que espera la columna
 * `users.phone_country_code VARCHAR(5)`. El país concreto solo se usa para
 * pintar la etiqueta: varios países comparten prefijo (+1, +7…), así que el
 * combobox se indexa por ISO para no repetir valores.
 */

export type StepBasicsProps = {
  dict: WizardDict;
  lang: Lang;
  draft: OnboardingDraft;
  onPatch: (patch: Partial<OnboardingDraft>) => void;
  errors: { firstName?: string; email?: string };
  /** ISO del país detectado por IP (`lib/geo`), o null si no hay señal. */
  geoCountry: string | null;
};

export function StepBasics({
  dict,
  lang,
  draft,
  onPatch,
  errors,
  geoCountry,
}: StepBasicsProps) {
  const t = dict.step1;

  const dialItems = useMemo<ComboboxItem[]>(() => {
    const quick = new Set(countriesGrouped().quickAccess.map((c) => c.code));
    return dialCodeOptions().map((c) => ({
      value: c.code,
      label: `${lang === "es" ? c.nameEs : c.nameEn} ${c.dialCode}`,
      group: quick.has(c.code) ? "latam" : "rest",
    }));
  }, [lang]);

  const geoDial = countryByCode(geoCountry)?.dialCode ?? null;

  // País mostrado en el selector: el detectado por IP si su prefijo coincide
  // con lo guardado; si no, el primero del catálogo con ese prefijo.
  const [phoneIso, setPhoneIso] = useState<string | null>(() => {
    const saved = draft.phoneCountryCode;
    if (!saved) return countryByCode(geoCountry)?.code ?? null;
    if (geoDial === saved) return countryByCode(geoCountry)?.code ?? null;
    return dialCodeOptions().find((c) => c.dialCode === saved)?.code ?? null;
  });
  const [phoneTouched, setPhoneTouched] = useState(false);

  const showPrefillHint =
    !phoneTouched && geoDial !== null && draft.phoneCountryCode === geoDial;

  return (
    <div className="flex flex-col gap-5">
      <Input
        label={t.firstName.label}
        placeholder={t.firstName.placeholder}
        value={draft.firstName ?? ""}
        onChange={(e) => onPatch({ firstName: e.target.value })}
        error={errors.firstName}
        autoComplete="given-name"
        required
      />

      <Input
        label={`${t.lastName.label} · ${t.lastName.optional}`}
        placeholder={t.lastName.placeholder}
        value={draft.lastName ?? ""}
        onChange={(e) => onPatch({ lastName: e.target.value })}
        autoComplete="family-name"
      />

      <Input
        type="email"
        label={t.email.label}
        placeholder={t.email.placeholder}
        help={t.email.help}
        value={draft.email ?? ""}
        onChange={(e) => onPatch({ email: e.target.value })}
        error={errors.email}
        autoComplete="email"
        inputMode="email"
        required
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <Combobox
          className="sm:w-64 sm:shrink-0"
          label={t.phone.countryCodeLabel}
          placeholder={t.phone.countryCodeLabel}
          items={dialItems}
          value={phoneIso}
          groupLabels={dict.step2.preArrival.countryGroups}
          emptyText={dict.step2.preArrival.countryEmpty}
          help={showPrefillHint ? t.phone.prefilledHint : undefined}
          onChange={(iso) => {
            setPhoneTouched(true);
            setPhoneIso(iso);
            onPatch({ phoneCountryCode: countryByCode(iso)?.dialCode ?? null });
          }}
        />

        <Input
          type="tel"
          className="sm:min-w-0 sm:flex-1"
          label={`${t.phone.label} · ${t.phone.optional}`}
          placeholder={t.phone.placeholder}
          help={t.phone.help}
          value={draft.phone ?? ""}
          onChange={(e) => onPatch({ phone: e.target.value })}
          autoComplete="tel-national"
          inputMode="tel"
          maxLength={20}
        />
      </div>
    </div>
  );
}
