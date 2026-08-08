/**
 * Helpers PUROS de la micro-entrevista (§3.2). Sin React, sin i18n:
 * solo reglas de coherencia de datos y construcción de los objetos que
 * consumen el motor (§3.3.1) y la capa de datos.
 *
 * Vive aquí y no en lib/ porque es lógica de esta pantalla; lib/ es de
 * otros dueños (ver docs/BRIEF-AGENTES.md §3).
 */

import type {
  InterestTag,
  Lang,
  LocationContext,
  OnboardingDraft,
  ProfileInput,
  SituationTag,
  StoredProfile,
} from "@/lib/types";
import {
  IN_US_ONLY_INTERESTS,
  PRE_ARRIVAL_ONLY_INTERESTS,
  interestsForBranch,
} from "@/lib/catalogs/interests";
import { COUNTRY_NOT_LISTED } from "@/lib/catalogs/countries";
import { sanitizeFreeText } from "@/lib/utils";

/** §3.2.1 regla 3: todo texto libre del wizard, máximo 120 caracteres. */
export const FREE_TEXT_MAX = 120;

/** Longitudes de las columnas de `users` (§7.2 / 0001_schema.sql). */
const NAME_MAX = 100;
const PHONE_MAX = 20;

export const TOTAL_STEPS = 5;

/** Intereses que solo existen en una de las dos ramas (§3.2 paso 4). */
export function branchOnlyInterests(
  branch: LocationContext,
): readonly InterestTag[] {
  return branch === "in_us" ? IN_US_ONLY_INTERESTS : PRE_ARRIVAL_ONLY_INTERESTS;
}

/**
 * ¿Hay algo que se perdería al abandonar `branch`? (§3.2.2: la confirmación
 * solo tiene sentido si de verdad se van a borrar datos escritos).
 *
 * Cuenta el ámbito geográfico y los chips de la rama, pero también el paso 3
 * (las situaciones son distintas en cada rama) y los intereses/objetivo que
 * solo existen en esa rama.
 */
export function hasBranchDataToLose(
  draft: OnboardingDraft,
  branch: LocationContext,
): boolean {
  const scope =
    branch === "in_us"
      ? Boolean(draft.stateUS) || Boolean(draft.timeInUS)
      : Boolean(draft.countryOfResidence) ||
        Boolean(draft.countryOther) ||
        Boolean(draft.nationality) ||
        Boolean(draft.travelPlan);

  const situation =
    Boolean(draft.situation) ||
    Boolean(draft.situationOther) ||
    draft.situationDeclined === true;

  const only = branchOnlyInterests(branch);
  const interests = (draft.interests ?? []).some((tag) =>
    (only as readonly string[]).includes(tag),
  );
  const goal =
    draft.immediateGoal != null &&
    draft.immediateGoal !== "custom" &&
    (only as readonly string[]).includes(draft.immediateGoal);

  return scope || situation || interests || goal;
}

/**
 * Cambia de rama limpiando lo que ya no aplica (§3.2.2, regla dura: nunca
 * conviven estado de EE. UU. y país extranjero).
 *
 * Además del ámbito geográfico se limpia el paso 3 (los enums de situación
 * son disjuntos entre ramas) y se filtran intereses y objetivo a los que
 * existen en la rama nueva, **conservando el orden de selección** (D14).
 */
export function switchBranch(
  draft: OnboardingDraft,
  next: LocationContext,
): OnboardingDraft {
  const allowed = interestsForBranch(next);
  const interests = (draft.interests ?? []).filter((tag) =>
    allowed.includes(tag),
  );

  const goal = draft.immediateGoal;
  const keepGoal =
    goal === "custom" || (goal != null && interests.includes(goal));

  return {
    ...draft,
    locationContext: next,
    // Rama A
    stateUS: next === "in_us" ? (draft.stateUS ?? null) : null,
    timeInUS: next === "in_us" ? (draft.timeInUS ?? null) : null,
    // Rama B
    countryOfResidence:
      next === "pre_arrival" ? (draft.countryOfResidence ?? null) : null,
    countryOther: next === "pre_arrival" ? (draft.countryOther ?? null) : null,
    nationality: next === "pre_arrival" ? (draft.nationality ?? null) : null,
    travelPlan: next === "pre_arrival" ? (draft.travelPlan ?? null) : null,
    // Paso 3: los enums de situación no se comparten entre ramas
    situation: null,
    situationOther: null,
    situationDeclined: false,
    interests,
    immediateGoal: keepGoal ? goal : null,
    immediateGoalCustom: keepGoal ? (draft.immediateGoalCustom ?? null) : null,
  };
}

/**
 * Opciones del PASO 5: se generan a partir de los intereses marcados en el
 * paso 4 (§3.2 paso 5). `other` no entra: no es un objetivo, es una señal de
 * investigación (§3.2.1) y el motor no le asigna módulo.
 *
 * Si el usuario no marcó ningún interés utilizable se ofrecen todos los de su
 * rama — el copy `step5.emptyInterestsHint` explica ese caso.
 */
export function goalOptionsFor(draft: OnboardingDraft): {
  options: InterestTag[];
  fromInterests: boolean;
} {
  const branch = draft.locationContext ?? "in_us";
  const picked = (draft.interests ?? []).filter((tag) => tag !== "other");
  if (picked.length > 0) return { options: picked, fromInterests: true };
  return {
    options: interestsForBranch(branch).filter((tag) => tag !== "other"),
    fromInterests: false,
  };
}

/** Texto libre listo para persistir (§3.2.1 regla 5). Vacío → null (regla 4). */
export function cleanFreeText(
  value: string | null | undefined,
  max = FREE_TEXT_MAX,
): string | null {
  if (!value) return null;
  const cleaned = sanitizeFreeText(value, max);
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Entrada del motor (§3.3.1). `locationContext` es el único dato imposible de
 * omitir (§3.2 regla 6): sin él no hay perfil que rankear.
 */
export function buildProfileInput(draft: OnboardingDraft): ProfileInput | null {
  const context = draft.locationContext;
  if (!context) return null;

  return {
    locationContext: context,
    stateUS: context === "in_us" ? (draft.stateUS ?? null) : null,
    countryOfResidence:
      context === "pre_arrival" ? (draft.countryOfResidence ?? null) : null,
    timeInUS: context === "in_us" ? (draft.timeInUS ?? null) : null,
    travelPlan: context === "pre_arrival" ? (draft.travelPlan ?? null) : null,
    // "Prefiero no responder" no es un tag del enum: viaja como situación nula
    // + bandera aparte, igual que en `StoredProfile`.
    situation: draft.situationDeclined ? null : (draft.situation ?? null),
    seekingFor: draft.seekingFor ?? "self",
    interests: draft.interests ?? [],
    immediateGoal: draft.immediateGoal ?? null,
  };
}

export type BuildProfileOptions = {
  userId: string;
  lang: Lang;
  /** Paso en el que saltó (§3.2 regla 6); null si completó los 5. */
  skippedAtStep: number | null;
  nowIso: string;
};

/**
 * Perfil persistible. Aplica una última vez la coherencia de §3.2.2 (por si
 * un borrador antiguo trae campos de las dos ramas) y sanea todo texto libre.
 */
export function buildStoredProfile(
  draft: OnboardingDraft,
  context: LocationContext,
  { userId, lang, skippedAtStep, nowIso }: BuildProfileOptions,
): StoredProfile {
  const inUs = context === "in_us";

  return {
    userId,
    email: (draft.email ?? "").trim(),
    firstName: cleanFreeText(draft.firstName, NAME_MAX) ?? "",
    lastName: cleanFreeText(draft.lastName, NAME_MAX),
    phone: cleanFreeText(draft.phone, PHONE_MAX),
    phoneCountryCode: draft.phoneCountryCode ?? null,

    locationContext: context,
    stateUS: inUs ? (draft.stateUS ?? null) : null,
    city: null, // §3.2 paso 2: la ciudad se pide al abrir M5, no en el wizard
    timeInUS: inUs ? (draft.timeInUS ?? null) : null,
    countryOfResidence: inUs ? null : (draft.countryOfResidence ?? null),
    // Patrón "Otro" (§3.2.1 regla 2): el texto libre vive en su propia
    // columna y solo existe cuando el país elegido es la salida 'XX'.
    countryOther:
      !inUs && draft.countryOfResidence === COUNTRY_NOT_LISTED
        ? cleanFreeText(draft.countryOther)
        : null,
    nationality: inUs ? null : (draft.nationality ?? null),
    travelPlan: inUs ? null : (draft.travelPlan ?? null),
    estimatedArrivalDate: null, // §3.2.3: se captura en "Ya llegué"

    situation: draft.situationDeclined ? null : (draft.situation ?? null),
    situationOther: draft.situation === "other" ? cleanFreeText(draft.situationOther) : null,
    situationDeclined: draft.situationDeclined === true,
    seekingFor: draft.seekingFor ?? "self",
    interests: draft.interests ?? [],
    interestsOther: (draft.interests ?? []).includes("other")
      ? cleanFreeText(draft.interestsOther)
      : null,
    immediateGoal: draft.immediateGoal ?? null,
    immediateGoalCustom:
      draft.immediateGoal === "custom" ? cleanFreeText(draft.immediateGoalCustom) : null,

    onboardingCompleted: skippedAtStep === null,
    onboardingSkippedAtStep: skippedAtStep,
    preferredLanguage: lang,

    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

/**
 * Inversa de `buildStoredProfile`: reconstruye el borrador a partir del perfil
 * ya guardado.
 *
 * Existe para "Volver a mis respuestas" del paywall (§3.4.2). Al terminar la
 * entrevista el borrador se borra, así que sin esto el usuario que vuelve a
 * revisar sus respuestas encontraría un formulario EN BLANCO — y §3.4.7 es
 * explícito en que volver no obliga a repetir la entrevista.
 *
 * `situationDeclined` se conserva porque "Prefiero no responder" es una
 * respuesta, no la ausencia de una (§3.2 paso 3).
 */
export function draftFromProfile(profile: StoredProfile): OnboardingDraft {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    phone: profile.phone,
    phoneCountryCode: profile.phoneCountryCode,

    locationContext: profile.locationContext,
    stateUS: profile.stateUS,
    timeInUS: profile.timeInUS,
    countryOfResidence: profile.countryOfResidence,
    countryOther: profile.countryOther,
    nationality: profile.nationality,
    travelPlan: profile.travelPlan,

    situation: profile.situation,
    situationOther: profile.situationOther,
    situationDeclined: profile.situationDeclined,
    seekingFor: profile.seekingFor,

    interests: profile.interests,
    interestsOther: profile.interestsOther,

    immediateGoal: profile.immediateGoal,
    immediateGoalCustom: profile.immediateGoalCustom,
  };
}

/** Type guard barato para leer valores de chips sin castear a ciegas. */
export function isOneOf<T extends string>(
  value: string,
  allowed: readonly T[],
): value is T {
  return (allowed as readonly string[]).includes(value);
}

/** Situación seleccionada tal como la ven los chips ('declined' incluido). */
export function selectedSituationValue(draft: OnboardingDraft): string | null {
  if (draft.situationDeclined) return "declined";
  return (draft.situation as SituationTag | "other" | null | undefined) ?? null;
}
