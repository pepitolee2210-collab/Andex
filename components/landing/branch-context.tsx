"use client";

/**
 * Estado de LA BIFURCACIÓN de la landing (§3.1.1: "el hero *es* la pregunta").
 *
 * Es el único estado cliente de la página. Vive en un contexto porque dos
 * zonas distantes de la pantalla lo consumen — las tarjetas del hero y la
 * sección de módulos — y `app/page.tsx` sigue siendo Server Component:
 * el provider recibe el árbol servidor como `children`.
 *
 * Contrato de mejora progresiva:
 *   · SIN JavaScript  → las tarjetas son enlaces reales a `/?ctx=…`; el
 *     servidor reordena y el usuario ve exactamente lo mismo tras la recarga.
 *   · CON JavaScript  → se intercepta el clic, se reordena sin recarga y se
 *     sincroniza la URL con `history.replaceState` (sin ensuciar el historial).
 *
 * Persistencia (§3.1.1, textual): `sessionStorage`, **no cookie, no cuenta
 * aún**. `SESSION_KEYS.landingBranch` es la llave que el wizard lee después
 * para precargar el paso 2. Si el usuario cambia de rama en el wizard, gana
 * la del wizard (esa regla la aplica el agente de Wizard, no esta pantalla).
 *
 * `?ctx=` NO es dato sensible (§9): es una preferencia de navegación
 * —dentro o fuera de EE. UU.—, no un estatus migratorio.
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
import { SESSION_KEYS } from "@/lib/config";
import type { Lang, LocationContext } from "@/lib/types";
import { trackLazy } from "./track-lazy";

type BranchApi = {
  /** null = el visitante todavía no ha elegido. */
  branch: LocationContext | null;
  select: (next: LocationContext) => void;
};

const BranchContext = createContext<BranchApi>({
  branch: null,
  select: () => {},
});

export function useBranch(): BranchApi {
  return useContext(BranchContext);
}

function isBranch(value: unknown): value is LocationContext {
  return value === "in_us" || value === "pre_arrival";
}

export type BranchProviderProps = {
  /** Rama resuelta en el servidor desde `?ctx=`. null si no hay elección. */
  initialBranch: LocationContext | null;
  /**
   * Sugerencia por IP (`suggestedContext()` de lib/geo.ts). SOLO alimenta las
   * props de analítica de §7.5: aquí nunca preselecciona ni decide nada
   * (regla UX 7 de §3.2: se sugiere, el usuario confirma).
   */
  ipSuggestion: LocationContext | null;
  lang: Lang;
  children: ReactNode;
};

export function BranchProvider({
  initialBranch,
  ipSuggestion,
  lang,
  children,
}: BranchProviderProps) {
  // El estado inicial es el del servidor → hidratación sin desajuste.
  const [branch, setBranch] = useState<LocationContext | null>(initialBranch);
  const booted = useRef(false);

  useEffect(() => {
    // StrictMode ejecuta el efecto dos veces en desarrollo: un solo
    // `landing_viewed` por carga real.
    if (booted.current) return;
    booted.current = true;

    trackLazy("landing_viewed", {
      lang,
      referrer: document.referrer || null,
    });

    try {
      if (initialBranch) {
        // La URL manda sobre lo guardado: es la elección más reciente.
        sessionStorage.setItem(SESSION_KEYS.landingBranch, initialBranch);
      } else {
        const stored = sessionStorage.getItem(SESSION_KEYS.landingBranch);
        if (isBranch(stored)) setBranch(stored);
      }
    } catch {
      /* sessionStorage bloqueado (navegación privada): la elección vive en memoria */
    }
  }, [initialBranch, lang]);

  const select = useCallback(
    (next: LocationContext) => {
      setBranch(next);

      try {
        sessionStorage.setItem(SESSION_KEYS.landingBranch, next);
      } catch {
        /* ver arriba */
      }

      trackLazy("location_branch_selected", {
        context: next,
        was_ip_prefilled: ipSuggestion !== null,
        changed_from_prefill: ipSuggestion !== null && ipSuggestion !== next,
      });

      try {
        const url = new URL(window.location.href);
        url.searchParams.set("ctx", next);
        // replaceState y no pushState: elegir rama no es navegar, y no debe
        // llenar el historial ni secuestrar el botón "atrás".
        window.history.replaceState(null, "", `${url.pathname}${url.search}`);
      } catch {
        /* si el navegador no deja tocar el historial, el estado en memoria basta */
      }
    },
    [ipSuggestion],
  );

  const api = useMemo<BranchApi>(() => ({ branch, select }), [branch, select]);

  return <BranchContext.Provider value={api}>{children}</BranchContext.Provider>;
}
