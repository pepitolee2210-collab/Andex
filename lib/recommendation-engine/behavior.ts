/**
 * Re-ranking por comportamiento (v1 ligero) — §3.3.2 (ANDEX-PRD-v1.3-FINAL).
 * Puro y sin estado: corre al iniciar sesión sobre el ranking persistido,
 * no en tiempo real. No muta la entrada.
 */

import type { ModuleBehavior, ModuleId, ModuleScore } from "@/lib/types";
import { DEFAULT_ORDER } from "@/lib/catalogs/modules";

// §3.3.2 — parámetros del ajuste suave.
const OPEN_BONUS = 2; // abrir un módulo suma +2…
const OPEN_BONUS_CAP = 20; // …con tope acumulado de +20 por módulo
const NO_OPEN_STREAK = 3; // 3 sesiones consecutivas sin abrir el recomendado…
const NO_OPEN_PENALTY = 10; // …restan −10
const DISMISS_PENALTY = 25; // "No es lo que busco" resta −25 por pulsación

/**
 * §3.3.2 — Aplica el ajuste por uso real sobre un ranking ya calculado:
 * `+2 × openCount` (tope +20), `−10` si `sessionsWithoutOpen ≥ 3` y
 * `−25 × dismissedCount`; clamp a 0–100 y reordena.
 *
 * Notas de diseño:
 * - `sessionsWithoutOpen` solo es significativo para el módulo que estuvo
 *   recomendado (así lo define el tipo en lib/types); el motor penaliza a
 *   cualquier módulo cuyo contador llegue al umbral, sin re-derivar aquí
 *   cuál fue el recomendado.
 * - Desempate idéntico al de rankModules: score desc → menor id; si TODOS
 *   los scores quedan en 0, orden por defecto del contexto (§4.7), leído
 *   del `contentVariant` que ya viaja en cada ModuleScore.
 */
export function applyBehaviorAdjustments(
  scores: ModuleScore[],
  behavior: ModuleBehavior[],
): ModuleScore[] {
  const byModule = new Map<ModuleId, ModuleBehavior>();
  for (const b of behavior) byModule.set(b.moduleId, b);

  const adjusted: ModuleScore[] = scores.map((s) => {
    const b = byModule.get(s.moduleId);
    if (!b) return { ...s };
    let score = s.score;
    score += Math.min(b.openCount * OPEN_BONUS, OPEN_BONUS_CAP);
    if (b.sessionsWithoutOpen >= NO_OPEN_STREAK) score -= NO_OPEN_PENALTY;
    score -= b.dismissedCount * DISMISS_PENALTY;
    score = Math.max(0, Math.min(100, score));
    return { ...s, score };
  });

  const allZero =
    adjusted.length > 0 && adjusted.every((s) => s.score === 0);
  const context = adjusted.length > 0 ? adjusted[0].contentVariant : null;

  adjusted.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (allZero && context !== null) {
      return (
        DEFAULT_ORDER[context].indexOf(a.moduleId) -
        DEFAULT_ORDER[context].indexOf(b.moduleId)
      );
    }
    return a.moduleId - b.moduleId;
  });

  return adjusted;
}
