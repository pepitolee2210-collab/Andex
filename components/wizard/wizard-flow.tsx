"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  Lang,
  LocationContext,
  OnboardingDraft,
  WizardState,
  WizardStep,
} from "@/lib/types";
import { getDictionary } from "@/lib/i18n";
import { ROUTES, SESSION_KEYS } from "@/lib/config";
import { getDataStore } from "@/lib/data";
import { track } from "@/lib/analytics/track";
import { rankModules } from "@/lib/recommendation-engine";
import { useSessionUser } from "@/lib/auth/client";
import { COUNTRY_NOT_LISTED, countryByCode } from "@/lib/catalogs/countries";
import { cn, isValidEmail } from "@/lib/utils";
import { RouteBar } from "@/components/route-bar";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toaster";
import { StepBasics } from "./step-basics";
import { StepLocation } from "./step-location";
import { StepSituation } from "./step-situation";
import { StepInterests } from "./step-interests";
import { StepGoal } from "./step-goal";
import {
  TOTAL_STEPS,
  buildProfileInput,
  buildStoredProfile,
  draftFromProfile,
  switchBranch,
} from "./draft-utils";

/**
 * MICRO-ENTREVISTA — orquestador de los 5 pasos (§3.2).
 *
 * Reglas de UX del wizard implementadas aquí:
 *  1. Guardado parcial en cada paso (`saveWizardState`) y reanudación.
 *  2. Barra de progreso siempre visible con "Paso X de 5". Ambas ramas tienen
 *     5 pasos: la bifurcación NO alarga el camino.
 *  3. Botón atrás siempre disponible (en el paso 1 vuelve a la landing).
 *  4. Un paso = una pantalla.
 *  5. Solo nombre, correo y `location_context` bloquean el avance.
 *  6. "Prefiero explorar por mi cuenta" desde el paso 3; NUNCA en el 2.
 *  7. La IP preselecciona, jamás autoenvía.
 *  8. Todo queda guardado para poder cambiarlo luego desde /perfil.
 *
 * La Ruta (§2.8) aparece UNA sola vez por pantalla, con el nodo del paso
 * actual; como es `aria-hidden`, el conteo accesible lo da la ProgressBar.
 *
 * §9: las respuestas NUNCA viajan en la URL. La navegación entre pasos es
 * estado en memoria + borrador en la capa de datos.
 */

const MEMBERSHIP_ROUTE = ROUTES.membresia;

type StepErrors = {
  firstName?: string;
  email?: string;
  location?: string;
  /** D28: el ámbito geográfico del paso 2 también es obligatorio. */
  stateUS?: string;
  country?: string;
};

/**
 * `useSessionUser` es un stub congelado que lanza hasta que el agente de Auth
 * lo implemente (lib/auth/client.ts). La entrevista solo lo usa para precargar
 * nombre y correo, así que degrada a "sin sesión" en vez de romper la pantalla.
 * Al aterrizar Auth, este envoltorio puede borrarse sin tocar nada más.
 */
function useOptionalSessionUser(): { id: string; email: string; firstName: string } | null {
  try {
    return useSessionUser().user;
  } catch {
    return null;
  }
}

function readLandingBranch(): LocationContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEYS.landingBranch);
    return raw === "in_us" || raw === "pre_arrival" ? raw : null;
  } catch {
    return null;
  }
}

export type WizardFlowProps = {
  lang: Lang;
  /** ISO del país detectado por IP (`lib/geo`). Solo preselecciona. */
  geoCountry: string | null;
  /** Rama sugerida por IP, para los eventos de §7.5. */
  suggestedBranch: LocationContext | null;
};

export function WizardFlow({ lang, geoCountry, suggestedBranch }: WizardFlowProps) {
  const dict = getDictionary(lang);
  const w = dict.wizard;
  const router = useRouter();
  const sessionUser = useOptionalSessionUser();

  const [ready, setReady] = useState(false);
  const [step, setStep] = useState<WizardStep>(1);
  const [maxStepReached, setMaxStepReached] = useState<WizardStep>(1);
  const [draft, setDraft] = useState<OnboardingDraft>({});
  const [errors, setErrors] = useState<StepErrors>({});
  const [skipOpen, setSkipOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const startedAtRef = useRef<string>(new Date().toISOString());
  const startedMsRef = useRef<number>(Date.now());
  const stepStartMsRef = useRef<number>(Date.now());
  const draftRef = useRef<OnboardingDraft>(draft);
  const stepRef = useRef<WizardStep>(step);
  const maxStepRef = useRef<WizardStep>(maxStepReached);
  const readyRef = useRef(false);
  const finishedRef = useRef(false);
  const abandonedRef = useRef(false);
  const branchEventRef = useRef(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  draftRef.current = draft;
  stepRef.current = step;
  maxStepRef.current = maxStepReached;
  readyRef.current = ready;

  /** Rama precargada: la de la landing manda; si no, la sugerencia por IP. */
  const prefilledBranchRef = useRef<LocationContext | null>(null);

  // ── Guardado parcial (regla 1) ────────────────────────────
  const persist = useCallback(
    async (loud: boolean) => {
      // Tras cerrar la entrevista el borrador ya se borró: un autoguardado
      // rezagado no puede resucitarlo.
      if (finishedRef.current) return;
      const state: WizardState = {
        currentStep: stepRef.current,
        maxStepReached: maxStepRef.current,
        draft: draftRef.current,
        startedAt: startedAtRef.current,
        updatedAt: new Date().toISOString(),
      };
      try {
        await getDataStore().saveWizardState(state);
      } catch {
        if (loud) toast.error(w.toasts.saveFailed);
      }
    },
    [w.toasts.saveFailed],
  );

  /** Preselección por IP del país de residencia (rama B). Nunca autoenvía. */
  const withGeoDefaults = useCallback(
    (next: OnboardingDraft): OnboardingDraft => {
      if (next.locationContext !== "pre_arrival") return next;
      if (next.countryOfResidence) return next;
      const country = countryByCode(geoCountry);
      if (!country || country.code === "US") return next;
      return { ...next, countryOfResidence: country.code };
    },
    [geoCountry],
  );

  // ── Hidratación: retoma donde quedó (regla 1) ─────────────
  useEffect(() => {
    let cancelled = false;
    const landing = readLandingBranch();

    void (async () => {
      const saved = await getDataStore()
        .getWizardState()
        .catch(() => null);
      if (cancelled) return;

      if (saved) {
        // §3.1.1: la landing precarga el paso 2 solo si aún no hay respuesta.
        const restored = withGeoDefaults({
          ...saved.draft,
          locationContext: saved.draft.locationContext ?? landing ?? null,
          seekingFor: saved.draft.seekingFor ?? "self",
        });
        prefilledBranchRef.current =
          saved.draft.locationContext ?? landing ?? suggestedBranch;
        startedAtRef.current = saved.startedAt;
        // Nunca se retoma más allá del paso 2 sin la bifurcación resuelta
        // (regla 6): los pasos 3–5 dependen de la rama.
        const resumeStep: WizardStep =
          !restored.locationContext && saved.currentStep > 2 ? 2 : saved.currentStep;
        setDraft(restored);
        setStep(resumeStep);
        setMaxStepReached(
          saved.maxStepReached >= resumeStep ? saved.maxStepReached : resumeStep,
        );
        toast.info(w.toasts.resumed);
      } else {
        // Sin borrador puede haber DOS situaciones muy distintas:
        //
        //  (a) Alguien que ya terminó la entrevista y vuelve a revisar sus
        //      respuestas desde el paywall (§3.4.2 "Volver a mis respuestas").
        //      El borrador se borró al terminar, pero el perfil sigue ahí:
        //      hay que rehidratar desde él. §3.4.7 es explícito en que volver
        //      NO obliga a repetir la entrevista.
        //  (b) Alguien que empieza de cero.
        //
        // Distinguirlas importa también para la analítica: emitir
        // `onboarding_started` en el caso (a) inflaría la "tasa de inicio"
        // de §0.6 con gente que ya había terminado.
        const profile = await getDataStore()
          .getProfile()
          .catch(() => null);
        if (cancelled) return;

        if (profile) {
          prefilledBranchRef.current = profile.locationContext;
          setDraft(draftFromProfile(profile));
          setStep(1);
          setMaxStepReached(5); // ya respondió todo: puede saltar a cualquier paso
          toast.info(w.toasts.resumed);
        } else {
          prefilledBranchRef.current = landing ?? suggestedBranch;
          const initial = withGeoDefaults({
            locationContext: landing ?? null,
            phoneCountryCode: countryByCode(geoCountry)?.dialCode ?? null,
            seekingFor: "self",
          });
          setDraft(initial);
          track("onboarding_started");
        }
      }

      stepStartMsRef.current = Date.now();
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Precarga desde la sesión (nombre y correo) ────────────
  useEffect(() => {
    if (!ready || !sessionUser) return;
    setDraft((current) => {
      const next = { ...current };
      let changed = false;
      if (!next.firstName && sessionUser.firstName) {
        next.firstName = sessionUser.firstName;
        changed = true;
      }
      if (!next.email && sessionUser.email) {
        next.email = sessionUser.email;
        changed = true;
      }
      return changed ? next : current;
    });
  }, [ready, sessionUser]);

  // ── Autoguardado al cambiar campos relevantes (regla 1) ───
  useEffect(() => {
    if (!ready || finishedRef.current) return;
    const id = window.setTimeout(() => {
      void persist(false);
    }, 600);
    return () => window.clearTimeout(id);
  }, [draft, step, ready, persist]);

  // ── Abandono (§7.5) ──────────────────────────────────────
  useEffect(() => {
    const fire = () => {
      if (!readyRef.current || finishedRef.current || abandonedRef.current) return;
      abandonedRef.current = true;
      track("onboarding_abandoned", {
        last_step: stepRef.current,
        branch: draftRef.current.locationContext ?? null,
      });
    };
    window.addEventListener("pagehide", fire);
    return () => {
      window.removeEventListener("pagehide", fire);
      fire();
    };
  }, []);

  // ── Foco al encabezado del paso (un paso = una pantalla) ──
  const firstRenderRef = useRef(true);
  useEffect(() => {
    if (!ready) return;
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    headingRef.current?.focus();
    window.scrollTo({ top: 0 });
  }, [step, ready]);

  // ── Edición del borrador ─────────────────────────────────
  const patch = useCallback((values: Partial<OnboardingDraft>) => {
    setDraft((current) => ({ ...current, ...values }));
    // El error desaparece en cuanto el dato es válido: no se castiga al
    // usuario mientras corrige (§2.7).
    setErrors((current) => {
      const next = { ...current };
      if (next.firstName && (values.firstName ?? "").trim()) next.firstName = undefined;
      if (next.email && isValidEmail(values.email ?? "")) next.email = undefined;
      if (next.stateUS && values.stateUS) next.stateUS = undefined;
      if (next.country && values.countryOfResidence) next.country = undefined;
      return next;
    });
  }, []);

  /** §3.2.2 — cambio de rama ya confirmado: limpia lo incoherente. */
  const selectBranch = useCallback(
    (next: LocationContext) => {
      setDraft((current) => withGeoDefaults(switchBranch(current, next)));
      setErrors((current) => ({
        ...current,
        location: undefined,
        stateUS: undefined,
        country: undefined,
      }));
      branchEventRef.current = true;
      const prefilled = prefilledBranchRef.current;
      track("location_branch_selected", {
        context: next,
        was_ip_prefilled: prefilled !== null,
        changed_from_prefill: prefilled !== null && prefilled !== next,
      });
    },
    [withGeoDefaults],
  );

  // ── Validación (regla 5: solo lo imprescindible bloquea) ──
  function validate(target: WizardStep): boolean {
    if (target === 1) {
      const next: StepErrors = {};
      if (!(draft.firstName ?? "").trim()) next.firstName = w.step1.firstName.error;
      if (!isValidEmail(draft.email ?? "")) next.email = w.step1.email.error;
      setErrors(next);
      return Object.keys(next).length === 0;
    }
    if (target === 2) {
      // Regla 6 + D28: sin rama no hay dashboard que adaptar, y sin ámbito
      // geográfico no hay consulado, DMV ni referencia local que servir.
      // 'XX' ("Mi país no está en la lista") cuenta como respuesta.
      if (!draft.locationContext) {
        setErrors({ location: w.step2.error });
        return false;
      }
      if (draft.locationContext === "in_us" && !draft.stateUS) {
        setErrors({ stateUS: w.step2.inUs.stateError });
        return false;
      }
      if (draft.locationContext === "pre_arrival" && !draft.countryOfResidence) {
        setErrors({ country: w.step2.preArrival.countryError });
        return false;
      }
    }
    setErrors({});
    return true;
  }

  function focusFirstInvalid() {
    window.requestAnimationFrame(() => {
      const el = sectionRef.current?.querySelector<HTMLElement>(
        '[aria-invalid="true"], [role="alert"]',
      );
      el?.focus?.();
      el?.scrollIntoView({ block: "center" });
    });
  }

  /** Eventos de campo que solo se conocen al cerrar el paso (§7.5). */
  function emitFieldEvents(target: WizardStep) {
    const d = draftRef.current;
    if (target === 2 && d.locationContext && !branchEventRef.current) {
      // El usuario aceptó la rama precargada sin tocarla (§3.1.1).
      branchEventRef.current = true;
      const prefilled = prefilledBranchRef.current;
      track("location_branch_selected", {
        context: d.locationContext,
        was_ip_prefilled: prefilled !== null,
        changed_from_prefill: false,
      });
    }
    if (target === 2 && d.countryOfResidence === COUNTRY_NOT_LISTED) {
      track("other_option_used", {
        field_name: "country",
        has_text: Boolean((d.countryOther ?? "").trim()),
      });
    }
    if (target === 3 && d.situation === "other") {
      track("other_option_used", {
        field_name: "situation",
        has_text: Boolean((d.situationOther ?? "").trim()),
      });
    }
    if (target === 4 && (d.interests ?? []).includes("other")) {
      track("other_option_used", {
        field_name: "interests",
        has_text: Boolean((d.interestsOther ?? "").trim()),
      });
    }
    if (target === 5 && d.immediateGoal === "custom") {
      track("other_option_used", {
        field_name: "immediate_goal",
        has_text: Boolean((d.immediateGoalCustom ?? "").trim()),
      });
    }
  }

  function completeStep(target: WizardStep) {
    emitFieldEvents(target);
    track("onboarding_step_completed", {
      step: target,
      duration_ms: Date.now() - stepStartMsRef.current,
      branch: draftRef.current.locationContext ?? null,
    });
  }

  // ── Cierre: perfil + ranking + paywall ───────────────────
  const finish = useCallback(
    async (skippedAtStep: number | null) => {
      const current = draftRef.current;
      const context = current.locationContext;
      if (!context) {
        // Imposible por diseño (el paso 2 bloquea), pero nunca se persiste
        // un perfil sin la bifurcación: sin ella no hay nada que adaptar.
        setStep(2);
        setErrors({ location: w.step2.error });
        return;
      }

      setSubmitting(true);
      finishedRef.current = true;
      const store = getDataStore();

      try {
        const profile = buildStoredProfile(current, context, {
          userId: sessionUser?.id ?? "",
          lang,
          skippedAtStep,
          nowIso: new Date().toISOString(),
        });

        const input = buildProfileInput(current);
        const scores = input ? rankModules(input) : [];

        await store.saveProfile(profile);
        await store.saveRanking({
          scores,
          behavior: [],
          computedAt: new Date().toISOString(),
        });
        await store.clearWizardState();
        try {
          // La rama de la landing ya cumplió su función (§3.1.1): a partir de
          // aquí manda el perfil, no una elección suelta de sessionStorage.
          window.sessionStorage.removeItem(SESSION_KEYS.landingBranch);
        } catch {
          /* sessionStorage bloqueado: no es crítico */
        }

        if (scores.length > 0) {
          track("ranking_computed", {
            top_module_id: scores[0].moduleId,
            top_score: scores[0].score,
            location_context: context,
          });
        }

        if (skippedAtStep === null) {
          track("onboarding_completed", {
            duration_ms: Date.now() - startedMsRef.current,
            interests_count: (current.interests ?? []).length,
            location_context: context,
          });
        } else {
          track("onboarding_skipped", { at_step: skippedAtStep });
        }

        router.push(MEMBERSHIP_ROUTE);
      } catch {
        finishedRef.current = false;
        setSubmitting(false);
        toast.error(w.toasts.saveFailed);
      }
    },
    [lang, router, sessionUser, w.step2.error, w.toasts.saveFailed],
  );

  function goNext() {
    if (!validate(step)) {
      focusFirstInvalid();
      return;
    }
    completeStep(step);

    if (step === TOTAL_STEPS) {
      void finish(null);
      return;
    }

    const next = (step + 1) as WizardStep;
    setStep(next);
    setMaxStepReached((current) => (next > current ? next : current));
    stepRef.current = next;
    maxStepRef.current = next > maxStepRef.current ? next : maxStepRef.current;
    stepStartMsRef.current = Date.now();
    void persist(true);
  }

  function goBack() {
    if (step === 1) {
      router.push(ROUTES.landing);
      return;
    }
    const previous = (step - 1) as WizardStep;
    setErrors({});
    setStep(previous);
    stepRef.current = previous;
    stepStartMsRef.current = Date.now();
    void persist(false);
  }

  // ── Render ───────────────────────────────────────────────
  const branch = draft.locationContext ?? null;

  const heading = (() => {
    switch (step) {
      case 1:
        return { title: w.step1.title, subtitle: w.step1.subtitle };
      case 2:
        return { title: w.step2.title, subtitle: w.step2.subtitle };
      case 3:
        return {
          title: branch === "pre_arrival" ? w.step3.titlePreArrival : w.step3.titleInUs,
          subtitle: w.step3.subtitle,
        };
      case 4:
        return { title: w.step4.title, subtitle: w.step4.subtitle };
      default:
        return { title: w.step5.title, subtitle: w.step5.subtitle };
    }
  })();

  if (!ready) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-4">
        <p aria-live="polite" className="text-body text-muted">
          {dict.common.actions.loading}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pb-10 pt-6 sm:px-6">
      {/* La Ruta: una sola vez por pantalla (§2.8). Es aria-hidden, así que el
          conteo accesible lo pone la barra de progreso. */}
      <div className="flex flex-col gap-4">
        <RouteBar step={step} context={branch ?? undefined} />
        <ProgressBar
          value={step}
          max={TOTAL_STEPS}
          label={w.progress.label(step, TOTAL_STEPS)}
          ariaLabel={w.progress.aria(step, TOTAL_STEPS)}
        />
      </div>

      <div ref={sectionRef} className="flex flex-1 flex-col pt-7">
        {submitting ? (
          <div className="flex flex-1 flex-col justify-center gap-2 py-10" aria-live="polite">
            <h1 className="font-heading text-h2 text-ink">{w.done.title}</h1>
            <p className="text-body text-muted">{w.done.body}</p>
          </div>
        ) : (
          <>
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="font-heading text-h1 text-ink outline-none"
            >
              {heading.title}
            </h1>
            <p className="mt-2 text-body-lg text-muted">{heading.subtitle}</p>

            <div className="mt-6 flex-1">
              {step === 1 ? (
                <StepBasics
                  dict={w}
                  lang={lang}
                  draft={draft}
                  onPatch={patch}
                  errors={{ firstName: errors.firstName, email: errors.email }}
                  geoCountry={geoCountry}
                />
              ) : null}

              {step === 2 ? (
                <StepLocation
                  dict={w}
                  lang={lang}
                  draft={draft}
                  onPatch={patch}
                  onSelectBranch={selectBranch}
                  errors={{
                    location: errors.location,
                    stateUS: errors.stateUS,
                    country: errors.country,
                  }}
                  geoCountry={geoCountry}
                />
              ) : null}

              {step === 3 && branch ? (
                <StepSituation
                  dict={w}
                  lang={lang}
                  branch={branch}
                  draft={draft}
                  onPatch={patch}
                />
              ) : null}

              {step === 4 && branch ? (
                <StepInterests
                  dict={w}
                  lang={lang}
                  branch={branch}
                  draft={draft}
                  onPatch={patch}
                />
              ) : null}

              {step === 5 ? (
                <StepGoal dict={w} lang={lang} draft={draft} onPatch={patch} />
              ) : null}
            </div>
          </>
        )}
      </div>

      {/* Navegación: atrás SIEMPRE disponible (regla 3). */}
      <div className={cn("mt-8 flex flex-col gap-4", submitting && "invisible")}>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={goBack} disabled={submitting}>
            {w.nav.back}
          </Button>
          <Button
            className="flex-1"
            size="lg"
            onClick={goNext}
            loading={submitting}
            loadingLabel={dict.common.actions.loading}
          >
            {step === TOTAL_STEPS ? w.nav.finish : w.nav.next}
          </Button>
        </div>

        {/* Regla 6: desde el paso 3, nunca en el 2. */}
        {step >= 3 ? (
          <button
            type="button"
            onClick={() => setSkipOpen(true)}
            className="mx-auto inline-flex min-h-11 items-center rounded-md px-3 text-body text-muted underline underline-offset-4 transition-colors hover:text-ink"
          >
            {w.nav.skip}
          </button>
        ) : null}
      </div>

      <Modal
        open={skipOpen}
        onClose={() => setSkipOpen(false)}
        title={w.nav.skipConfirmTitle}
        closeLabel={w.nav.skipConfirmCancel}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSkipOpen(false)}>
              {w.nav.skipConfirmCancel}
            </Button>
            <Button
              onClick={() => {
                setSkipOpen(false);
                void finish(step);
              }}
            >
              {w.nav.skipConfirmAccept}
            </Button>
          </>
        }
      >
        <p className="text-body text-ink">{w.nav.skipConfirmBody}</p>
      </Modal>
    </main>
  );
}
