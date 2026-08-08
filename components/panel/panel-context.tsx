"use client";

/**
 * Estado compartido del panel (§4). Carga perfil, ranking y suscripción UNA
 * vez, resuelve el control de acceso de §3.4.7 y expone las acciones que
 * escriben (todas pasan por `getDataStore()`, nunca por Supabase directo).
 *
 * Es un client component a propósito: en modo demo los datos viven en el
 * navegador (brief §6), así que el servidor no puede verlos.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/config";
import { getDataStore, type LocationTransition, type StoredRanking } from "@/lib/data";
import { hasDashboardAccess } from "@/lib/auth/routing";
import { getDictionary, type Dictionary } from "@/lib/i18n";
import { track } from "@/lib/analytics/track";
import type {
  Lang,
  ModuleBehavior,
  ModuleId,
  ModuleScore,
  StoredProfile,
  SubscriptionInfo,
} from "@/lib/types";
import {
  bumpSessionsWithoutOpen,
  computeScores,
  emptyBehavior,
  fallbackScores,
  hideHeroForAWeek,
  isFirstLoadOfSession,
  markSessionRanked,
  normalizeBehavior,
  positionOf,
  resolveHeroHidden,
  snapshotOpenCounts,
  totalDismissals,
  HERO_DISMISS_LIMIT,
} from "./ranking";

/**
 * §3.4.7 — qué puede hacer el usuario según su suscripción:
 *   full      → todo.
 *   read-only → `past_due`: lee todo, no guarda nada, aviso claro, sin borrar datos.
 *   blocked   → cancelada y vencida: panel bloqueado, cuenta y perfil INTACTOS.
 *   none      → nunca hubo suscripción: se manda a /membresia.
 */
export type PanelAccess = "full" | "read-only" | "blocked" | "none";

export type PanelValue = {
  lang: Lang;
  dict: Dictionary;
  loading: boolean;
  profile: StoredProfile | null;
  scores: ModuleScore[];
  behavior: ModuleBehavior[];
  subscription: SubscriptionInfo | null;
  access: PanelAccess;
  /** Atajo de `access === "read-only"`: bloquea toda escritura de usuario. */
  readOnly: boolean;
  /** §4.7 — hero card oculta durante 7 días tras 3 descartes. */
  heroHidden: boolean;
  /** §4.7 — paso donde quedó la entrevista, si hay borrador sin terminar. */
  resumeStep: number | null;
  /** Módulo que la hero card está recomendando ahora, o null si está oculta. */
  heroEntry: ModuleScore | null;
  /** Id del anterior, para `was_recommended` de `module_opened` (§7.5). */
  heroModuleId: ModuleId | null;

  /** Guarda cambios de perfil y RECALCULA el ranking (§3.2 regla 8, §4.7). */
  saveProfile: (patch: Partial<StoredProfile>) => Promise<boolean>;
  /** "No es lo que busco": −25 y recálculo instantáneo (§3.3.2). */
  dismissHero: (moduleId: ModuleId) => Promise<number>;
  /** Registra la apertura de un módulo y emite `module_opened` (§7.5). */
  openModule: (moduleId: ModuleId) => void;
  /** "Ya llegué" (§3.2.3): migra el contexto y recalcula TODO el ranking. */
  applyTransition: (transition: LocationTransition) => Promise<StoredProfile | null>;
  setSubscription: (subscription: SubscriptionInfo) => void;
};

const PanelContext = createContext<PanelValue | null>(null);

export function usePanel(): PanelValue {
  const value = useContext(PanelContext);
  if (!value) {
    throw new Error("usePanel() debe usarse dentro de <PanelProvider>.");
  }
  return value;
}

function resolveAccess(
  subscription: SubscriptionInfo | null,
  now: Date,
): PanelAccess {
  if (!subscription) return "none";

  const end = new Date(subscription.currentPeriodEnd);
  const expired = !Number.isNaN(end.getTime()) && now.getTime() >= end.getTime();

  // §3.4.7 — cancelación: acceso hasta `current_period_end`; al vencer, panel
  // bloqueado pero cuenta y perfil intactos. Se comprueba antes que
  // `hasDashboardAccess` porque el store demo conserva status 'active' con
  // `cancelAtPeriodEnd`, y ahí la fecha es la única señal fiable.
  if ((subscription.status === "canceled" || subscription.cancelAtPeriodEnd) && expired) {
    return "blocked";
  }
  if (!hasDashboardAccess(subscription, now)) return "blocked";
  if (subscription.status === "past_due") return "read-only";
  return "full";
}

export type PanelProviderProps = {
  lang: Lang;
  children: ReactNode;
};

export function PanelProvider({ lang, children }: PanelProviderProps) {
  const dict = useMemo(() => getDictionary(lang), [lang]);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<StoredProfile | null>(null);
  const [scores, setScores] = useState<ModuleScore[]>([]);
  const [behavior, setBehavior] = useState<ModuleBehavior[]>(emptyBehavior);
  const [subscription, setSubscriptionState] = useState<SubscriptionInfo | null>(null);
  const [access, setAccess] = useState<PanelAccess>("full");
  const [heroHidden, setHeroHidden] = useState(false);
  const [resumeStep, setResumeStep] = useState<number | null>(null);
  /**
   * Módulos que el usuario descartó EN ESTA SESIÓN.
   *
   * El −25 de §3.3.2 no siempre destrona al módulo top: si iba con 100 y el
   * segundo con 59, tras el descarte sigue primero con 75. Pulsar "No es lo
   * que busco" y que reaparezca la misma tarjeta convertiría el botón en una
   * mentira, y §4.4 lo define como "el mecanismo de corrección del usuario".
   * Así que la hero card salta lo descartado durante la sesión, mientras la
   * penalización se acumula en el score persistido. El GRID sigue mostrando
   * los 7 completos: se deja de recomendar, no se oculta nada (§0.4).
   */
  const [sessionDismissed, setSessionDismissed] = useState<ModuleId[]>([]);

  const behaviorRef = useRef<ModuleBehavior[]>(behavior);
  const profileRef = useRef<StoredProfile | null>(profile);
  const scoresRef = useRef<ModuleScore[]>(scores);
  behaviorRef.current = behavior;
  profileRef.current = profile;
  scoresRef.current = scores;

  // ── Carga inicial + re-ranking de sesión (§3.3.2) ─────────
  useEffect(() => {
    let alive = true;
    const store = getDataStore();

    void (async () => {
      const [loadedProfile, loadedSubscription, loadedRanking] = await Promise.all([
        store.getProfile().catch(() => null),
        store.getSubscription().catch(() => null),
        store.getRanking().catch(() => null),
      ]);
      if (!alive) return;

      // Sin perfil no hay contexto de ubicación y el panel no puede adaptarse
      // a nada (§3.2 regla 6): al principio del embudo.
      if (!loadedProfile) {
        router.replace(ROUTES.entrevista);
        return;
      }

      // Sin suscripción, al paywall (§3, embudo).
      const nextAccess = resolveAccess(loadedSubscription, new Date());
      if (nextAccess === "none") {
        router.replace(ROUTES.membresia);
        return;
      }

      // §4.7 — perfil incompleto (abandonó en el paso 3): hay borrador de
      // entrevista sin terminar. Se OFRECE retomar; nunca se obliga
      // (§3.2 regla 6: puede saltar). Es distinto de "saltó el onboarding",
      // que no deja borrador y se resuelve con la hero card genérica.
      let pendingStep: number | null = null;
      if (!loadedProfile.onboardingCompleted) {
        const wizard = await store.getWizardState().catch(() => null);
        if (!alive) return;
        pendingStep = wizard ? wizard.currentStep : null;
      }

      let nextBehavior = normalizeBehavior(loadedRanking?.behavior);
      let nextScores: ModuleScore[];

      if (isFirstLoadOfSession()) {
        // §3.3.2 — el re-ranking corre AL INICIAR SESIÓN, no en tiempo real.
        const previousTop = loadedRanking?.scores?.[0]?.moduleId ?? null;
        nextBehavior = bumpSessionsWithoutOpen(nextBehavior, previousTop);
        nextScores = computeScores(loadedProfile, nextBehavior);
        markSessionRanked();
        const stored: StoredRanking = {
          scores: nextScores,
          behavior: nextBehavior,
          computedAt: new Date().toISOString(),
        };
        await store.saveRanking(stored).catch(() => {
          /* sin persistencia el panel sigue usable con el ranking en memoria */
        });
      } else if (loadedRanking && loadedRanking.scores.length > 0) {
        // Dentro de la misma sesión se lee lo persistido (§3.3.1).
        nextScores = loadedRanking.scores;
      } else {
        nextScores = computeScores(loadedProfile, nextBehavior);
      }

      if (!alive) return;

      if (nextScores.length === 0) {
        nextScores = fallbackScores(loadedProfile.locationContext);
      }

      setProfile(loadedProfile);
      setSubscriptionState(loadedSubscription);
      setAccess(nextAccess);
      setScores(nextScores);
      setBehavior(nextBehavior);
      setResumeStep(pendingStep);
      setHeroHidden(resolveHeroHidden(totalDismissals(nextBehavior)));
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const readOnly = access === "read-only";

  // ── Escrituras ────────────────────────────────────────────

  /** Recalcula desde el perfil y persiste. Base pura + ajuste, una sola vez. */
  const recompute = useCallback(
    async (nextProfile: StoredProfile, nextBehavior: ModuleBehavior[]) => {
      const nextScores = computeScores(nextProfile, nextBehavior);
      setScores(nextScores);
      setBehavior(nextBehavior);
      snapshotOpenCounts(nextBehavior);
      await getDataStore()
        .saveRanking({
          scores: nextScores,
          behavior: nextBehavior,
          computedAt: new Date().toISOString(),
        })
        .catch(() => {
          /* el orden en pantalla ya está bien; se reintenta al recargar */
        });
      if (nextScores.length > 0) {
        track("ranking_computed", {
          top_module_id: nextScores[0].moduleId,
          top_score: nextScores[0].score,
          location_context: nextProfile.locationContext,
        });
      }
      return nextScores;
    },
    [],
  );

  const saveProfile = useCallback(
    async (patch: Partial<StoredProfile>): Promise<boolean> => {
      if (readOnly) return false;
      try {
        const updated = await getDataStore().updateProfile(patch);
        setProfile(updated);
        await recompute(updated, behaviorRef.current);
        return true;
      } catch {
        return false;
      }
    },
    [readOnly, recompute],
  );

  /**
   * §4.4 / §3.3.2 — "No es lo que busco". Resta −25 y recalcula al instante:
   * es la señal más honesta que recibe el motor, así que el usuario tiene que
   * ver el efecto en la misma pantalla.
   */
  const dismissHero = useCallback(
    async (moduleId: ModuleId): Promise<number> => {
      if (readOnly) return totalDismissals(behaviorRef.current);
      const store = getDataStore();
      let moduleDismissals: number;
      try {
        moduleDismissals = await store.registerHeroDismiss(moduleId);
      } catch {
        moduleDismissals =
          (behaviorRef.current.find((b) => b.moduleId === moduleId)?.dismissedCount ??
            0) + 1;
      }

      const nextBehavior = behaviorRef.current.map((b) =>
        b.moduleId === moduleId ? { ...b, dismissedCount: moduleDismissals } : b,
      );
      const total = totalDismissals(nextBehavior);
      setSessionDismissed((current) =>
        current.includes(moduleId) ? current : [...current, moduleId],
      );

      const currentProfile = profileRef.current;
      if (currentProfile) {
        await recompute(currentProfile, nextBehavior);
      } else {
        setBehavior(nextBehavior);
      }

      // §4.7 — a los 3 descartes la hero card se va 7 días y queda el grid plano.
      if (total >= HERO_DISMISS_LIMIT) {
        hideHeroForAWeek();
        setHeroHidden(true);
      }

      track("hero_card_dismissed", { module_id: moduleId, dismiss_count: total });
      return total;
    },
    [readOnly, recompute],
  );

  /**
   * ¿Hay hero card de recomendación en pantalla? No la hay cuando está oculta
   * por §4.7, ni cuando el perfil está incompleto o se saltó la entrevista:
   * en esos dos casos su sitio lo ocupa un CTA a completar el perfil, que no
   * es una recomendación del motor. Importa para `was_recommended` (§7.5):
   * si no recomendamos nada, ninguna apertura puede contarse como acierto.
   */
  const heroSuppressed =
    heroHidden || resumeStep !== null || profile?.onboardingCompleted === false;
  const heroEntry = heroSuppressed
    ? null
    : (scores.find((s) => !sessionDismissed.includes(s.moduleId)) ?? null);
  const heroModuleId = heroEntry?.moduleId ?? null;

  /**
   * §7.5 — `module_opened` es EL evento clave del MVP: la proporción de
   * aperturas con `was_recommended` es la precisión real del motor.
   * `position_in_grid` es 1-based (la posición que el usuario ve).
   */
  const openModule = useCallback(
    (moduleId: ModuleId) => {
      const index = positionOf(scoresRef.current, moduleId);
      track("module_opened", {
        module_id: moduleId,
        position_in_grid: index >= 0 ? index + 1 : null,
        was_recommended: heroModuleId !== null && moduleId === heroModuleId,
      });
      if (readOnly) return;

      // +2 al score con tope +20 (§3.3.2). El contador se persiste ahora; el
      // efecto en el orden se aplica al iniciar la sesión siguiente.
      void getDataStore()
        .registerModuleOpen(moduleId)
        .catch(() => {
          /* nunca bloquear la navegación por un contador */
        });
      setBehavior((current) =>
        current.map((b) =>
          b.moduleId === moduleId
            ? { ...b, openCount: b.openCount + 1, sessionsWithoutOpen: 0 }
            : b,
        ),
      );
    },
    [heroModuleId, readOnly],
  );

  /** §3.2.3 — migración de contexto: recalcula TODO el ranking. */
  const applyTransition = useCallback(
    async (transition: LocationTransition): Promise<StoredProfile | null> => {
      if (readOnly) return null;
      try {
        const updated = await getDataStore().recordLocationTransition(transition);
        setProfile(updated);
        await recompute(updated, behaviorRef.current);
        return updated;
      } catch {
        return null;
      }
    },
    [readOnly, recompute],
  );

  const setSubscription = useCallback((next: SubscriptionInfo) => {
    setSubscriptionState(next);
    setAccess(resolveAccess(next, new Date()));
  }, []);

  const value = useMemo<PanelValue>(
    () => ({
      lang,
      dict,
      loading,
      profile,
      scores,
      behavior,
      subscription,
      access,
      readOnly,
      heroHidden,
      resumeStep,
      heroEntry,
      heroModuleId,
      saveProfile,
      dismissHero,
      openModule,
      applyTransition,
      setSubscription,
    }),
    [
      lang,
      dict,
      loading,
      profile,
      scores,
      behavior,
      subscription,
      access,
      readOnly,
      heroHidden,
      resumeStep,
      heroEntry,
      heroModuleId,
      saveProfile,
      dismissHero,
      openModule,
      applyTransition,
      setSubscription,
    ],
  );

  return <PanelContext.Provider value={value}>{children}</PanelContext.Provider>;
}
