/**
 * ESCÁNER — dónde está el papel dentro de la foto.
 *
 * Es una AYUDA, no una autoridad: si nada funciona devuelve `null` y la
 * persona ajusta las esquinas a mano, que es el camino que siempre sirve.
 *
 * ── Por qué una cascada, y no un solo detector ──
 *
 * Porque se midió. `comparativa.test.ts` enfrenta tres detectores contra
 * ocho fotos sintéticas cuyas esquinas verdaderas conocemos, y el resultado
 * fue que ninguno gana solo:
 *
 *   caso                clásico          neuronal
 *   ────────────────────────────────────────────────
 *   fácil               0,3 %  ✓         se rinde
 *   inclinado           0,3 %  ✓         0,6 %  ✓
 *   claro sobre claro   43 %   ✗         0,8 %  ✓
 *   madera              0,6 %  ✓         0,7 %  ✓
 *   sombra de la mano   0,6 %  ✓         0,6 %  ✓
 *   penumbra            0,6 %  ✓         0,8 %  ✓
 *   reflejo             0,4 %  ✓         se rinde
 *   degradado           0,6 %  ✓         0,6 %  ✓
 *
 * El clásico acierta en siete de ocho y no descarga nada. El que falla es el
 * peor caso posible —hoja blanca sobre mesa clara, donde el borde del papel
 * apenas existe— y ahí no se rinde: entrega un recorte equivocado con toda
 * seguridad, que la persona acepta sin mirar.
 *
 * Lo que hace la cascada posible es que **el clásico avisa**. Su confianza
 * separa limpiamente los aciertos del error:
 *
 *   aciertos → 0,91 – 0,93        el recorte falso → 0,64
 *
 * Así que cuando duda se llama al detector neuronal, que resuelve
 * exactamente ese caso en 16 ms. Y sólo entonces se descarga su modelo.
 */

import type { Quad } from "./geometry";
import { detectWithSobelHough } from "./detect-sobel";

/**
 * Por debajo de esto no nos fiamos del detector clásico.
 *
 * 0,80 cae en medio del hueco medido (0,64 frente a 0,91), lejos de ambos
 * extremos. Si algún día un acierto legítimo bajara de aquí, el coste es
 * consultar al neuronal de más — no un recorte equivocado.
 */
const CONFIANZA_MINIMA = 0.8;

type ScanicResult = {
  success: boolean;
  confidence?: number | null;
  corners?: Quad | null;
};

type ScanicModule = {
  scanDocument: (
    image: ImageData,
    options?: { mode?: "detect" | "extract"; detector?: "classical" | "ml" },
  ) => Promise<ScanicResult>;
};

/**
 * Scanic se carga bajo demanda y una sola vez.
 *
 * La promesa se guarda, no el módulo: si dos escaneos coinciden, ambos
 * esperan a la misma carga en vez de pedirla dos veces.
 */
let scanicPromise: Promise<ScanicModule | null> | null = null;

function loadScanic(): Promise<ScanicModule | null> {
  scanicPromise ??= import("scanic")
    .then((m) => m as unknown as ScanicModule)
    .catch(() => null);
  return scanicPromise;
}

/** ¿Devolvió esquinas utilizables? */
function cornersOf(result: ScanicResult | null): Quad | null {
  if (!result?.success || !result.corners) return null;
  const c = result.corners;
  const puntos = [c.topLeft, c.topRight, c.bottomRight, c.bottomLeft];
  const validos = puntos.every(
    (p) => p && Number.isFinite(p.x) && Number.isFinite(p.y),
  );
  return validos ? c : null;
}

/**
 * Propone el recorte del documento.
 *
 * `null` cuando no hay una respuesta fiable: es preferible a inventarse un
 * recorte que la persona tendría que deshacer, y peor aún, que podría no
 * mirar.
 */
export async function detectDocument(image: ImageData): Promise<Quad | null> {
  const scanic = await loadScanic();

  // ── Sin Scanic: el detector propio, que no depende de nada ──
  // Un fallo del paquete externo degrada la detección, no la borra.
  if (!scanic) return detectWithSobelHough(image);

  try {
    const clasico = await scanic.scanDocument(image, { mode: "detect" });
    const quad = cornersOf(clasico);
    if (quad && (clasico.confidence ?? 0) >= CONFIANZA_MINIMA) return quad;

    // ── Duda: se pregunta al neuronal ──
    // Aquí es donde se descarga su modelo, y sólo aquí.
    try {
      const neuronal = await scanic.scanDocument(image, {
        mode: "detect",
        detector: "ml",
      });
      const quadMl = cornersOf(neuronal);
      if (quadMl) return quadMl;
    } catch {
      // El modelo puede no llegar: sin red, con el almacenamiento lleno, o
      // en un navegador sin WebAssembly. No es motivo para quedarse sin
      // detección.
    }

    // El neuronal tampoco lo tiene claro. Antes de rendirse, el propio.
    const propio = detectWithSobelHough(image);
    if (propio) return propio;

    // Con un recorte de baja confianza en la mano, se prefiere entregarlo
    // a no entregar nada: la persona lo va a ver y puede corregirlo.
    return quad;
  } catch {
    return detectWithSobelHough(image);
  }
}

export { detectWithSobelHough };
