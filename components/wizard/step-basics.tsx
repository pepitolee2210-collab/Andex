"use client";

import { useMemo, useState } from "react";
import type { Lang, OnboardingDraft } from "@/lib/types";
import type { WizardDict } from "@/lib/i18n";
import { countryByCode, dialCodeOptions } from "@/lib/catalogs/countries";
import { KitField, KIT_INPUT_CLASS } from "@/components/auth/kit-field";
import { cn } from "@/lib/utils";

/**
 * PASO 1 — Datos básicos (§3.2).
 *
 * Forma del sistema de diseño: los datos van en UNA lista agrupada, un dato
 * por fila, y la nota de para qué sirve cada uno va pegada a su fila. Es lo
 * que manda en esta pantalla: el aviso al lado del dato, no al final.
 *
 * Nombre y correo son obligatorios; apellido y teléfono no (§3.2 regla 5).
 * El código de país del teléfono se **preselecciona por IP y queda siempre
 * editable** (regla 7: se sugiere, el usuario confirma) — nunca se autoenvía
 * ni se bloquea.
 *
 * El selector de código pasó de combobox a `<select>` nativo: dentro de una
 * fila de campo el combobox dibujaba su propia caja con borde y rompía la
 * lista, y en un teléfono el desplegable del sistema se maneja mejor. El
 * dato que se guarda es el mismo (`+52`), que es lo que espera la columna
 * `users.phone_country_code VARCHAR(5)`; el país concreto sólo pinta la
 * etiqueta, porque varios comparten prefijo (+1, +7…).
 */

const FIELD_IDS = {
  firstName: "entrevista-nombre",
  lastName: "entrevista-apellido",
  email: "entrevista-correo",
  phone: "entrevista-telefono",
  phoneCode: "entrevista-codigo-pais",
} as const;

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

  const dialOptions = useMemo(
    () =>
      dialCodeOptions().map((c) => ({
        code: c.code,
        label: `${lang === "es" ? c.nameEs : c.nameEn} ${c.dialCode}`,
      })),
    [lang],
  );

  const geoDial = countryByCode(geoCountry)?.dialCode ?? null;

  // País mostrado en el selector: el detectado por IP si su prefijo coincide
  // con lo guardado; si no, el primero del catálogo con ese prefijo.
  const [phoneIso, setPhoneIso] = useState<string>(() => {
    const saved = draft.phoneCountryCode;
    if (!saved) return countryByCode(geoCountry)?.code ?? "";
    if (geoDial === saved) return countryByCode(geoCountry)?.code ?? "";
    return dialCodeOptions().find((c) => c.dialCode === saved)?.code ?? "";
  });
  const [phoneTouched, setPhoneTouched] = useState(false);

  const showPrefillHint =
    !phoneTouched && geoDial !== null && draft.phoneCountryCode === geoDial;

  return (
    <div className="ax-group">
      <KitField
        id={FIELD_IDS.firstName}
        label={t.firstName.label}
        error={errors.firstName}
      >
        <input
          id={FIELD_IDS.firstName}
          type="text"
          className={cn(KIT_INPUT_CLASS, "w-full")}
          placeholder={t.firstName.placeholder}
          value={draft.firstName ?? ""}
          onChange={(e) => onPatch({ firstName: e.target.value })}
          autoComplete="given-name"
          autoCapitalize="words"
          maxLength={100}
          aria-required="true"
          aria-invalid={errors.firstName ? true : undefined}
          aria-describedby={
            errors.firstName ? `${FIELD_IDS.firstName}-hint` : undefined
          }
        />
      </KitField>

      <KitField
        id={FIELD_IDS.lastName}
        label={`${t.lastName.label} · ${t.lastName.optional}`}
      >
        <input
          id={FIELD_IDS.lastName}
          type="text"
          className={cn(KIT_INPUT_CLASS, "w-full")}
          placeholder={t.lastName.placeholder}
          value={draft.lastName ?? ""}
          onChange={(e) => onPatch({ lastName: e.target.value })}
          autoComplete="family-name"
          autoCapitalize="words"
          maxLength={100}
        />
      </KitField>

      <KitField
        id={FIELD_IDS.email}
        label={t.email.label}
        hint={t.email.help}
        error={errors.email}
      >
        <input
          id={FIELD_IDS.email}
          type="email"
          inputMode="email"
          className={cn(KIT_INPUT_CLASS, "w-full")}
          placeholder={t.email.placeholder}
          value={draft.email ?? ""}
          onChange={(e) => onPatch({ email: e.target.value })}
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={254}
          aria-required="true"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={`${FIELD_IDS.email}-hint`}
        />
      </KitField>

      <KitField
        id={FIELD_IDS.phone}
        label={`${t.phone.label} · ${t.phone.optional}`}
        hint={showPrefillHint ? t.phone.prefilledHint : t.phone.help}
      >
        <div className="flex items-center gap-3">
          <select
            id={FIELD_IDS.phoneCode}
            aria-label={t.phone.countryCodeLabel}
            className={cn(KIT_INPUT_CLASS, "w-[7.5rem] shrink-0 truncate")}
            value={phoneIso}
            onChange={(e) => {
              const iso = e.target.value;
              setPhoneTouched(true);
              setPhoneIso(iso);
              onPatch({ phoneCountryCode: countryByCode(iso)?.dialCode ?? null });
            }}
          >
            {/* Sin señal de IP no se elige país por nadie: la primera opción
                dice qué es y no vale como respuesta. */}
            {phoneIso === "" ? (
              <option value="">{t.phone.countryCodeLabel}</option>
            ) : null}
            {dialOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            id={FIELD_IDS.phone}
            type="tel"
            inputMode="tel"
            className={cn(KIT_INPUT_CLASS, "min-w-0 flex-1")}
            placeholder={t.phone.placeholder}
            value={draft.phone ?? ""}
            onChange={(e) => onPatch({ phone: e.target.value })}
            autoComplete="tel-national"
            maxLength={20}
            aria-describedby={`${FIELD_IDS.phone}-hint`}
          />
        </div>
      </KitField>
    </div>
  );
}
