/**
 * LANDING · LO QUE HOY NO FUNCIONA
 *
 * Cuatro tarjetas en dos por dos, cada una con su franja de color y su
 * texto, como en la maqueta.
 *
 * ── El tono ──
 *
 * Describe situaciones, no vende soluciones. «Renovar tarde un permiso de
 * trabajo puede costar el empleo» es un hecho que quien lo ha vivido
 * reconoce; «transforma tu experiencia migratoria» no le dice nada a nadie
 * y suena a quien cobra por adelantado.
 *
 * Ninguna de las cuatro exagera ni mete miedo. La cuarta —«se paga por lo
 * que era gratis»— es la más delicada y por eso es la más literal: dice el
 * hecho y no señala a nadie.
 *
 * ── Por qué el icono NO usa `Glyph` ──
 *
 * Esta sección es de SERVIDOR: es contenido estático y no tiene por qué
 * costar JavaScript en el navegador. `Glyph` vive en `kit.tsx`, que está
 * marcado como cliente, y pasarle el icono desde aquí es cruzar una
 * función por la frontera servidor→cliente — Next lo rechaza en tiempo de
 * ejecución con «Functions cannot be passed directly to Client
 * Components». Lo único que aporta `Glyph` es el atributo `data-icon`, y
 * eso se escribe aquí mismo.
 *
 * ── La franja ──
 *
 * La maqueta pone una imagen a la izquierda de cada tarjeta. Aquí es una
 * franja de color plano: no hay fotos reales de estas situaciones, y una
 * foto de banco de imágenes de «familia preocupada» es justo el registro
 * que el sistema de diseño veta. Cuando haya fotografía propia, la franja
 * es donde va.
 */

import { CalendarClock, FolderSearch, HandCoins, MessagesSquare } from "lucide-react";
import type { LandingDict } from "@/lib/i18n/dictionaries/landing";
import type { IconComponent } from "@/components/ui/kit";

/**
 * Un glifo por necesidad, en el mismo orden que el diccionario, con su
 * nombre en kebab-case: es lo que activa el gesto del icono en el CSS.
 */
const GLIFOS: readonly { icon: IconComponent; name: string; tono: string }[] = [
  { icon: FolderSearch, name: "folder", tono: "bg-navy-soft text-navy" },
  { icon: CalendarClock, name: "calendar-clock", tono: "bg-amber-soft text-amber-deep" },
  { icon: MessagesSquare, name: "message-circle", tono: "bg-teal-soft text-teal-deep" },
  { icon: HandCoins, name: "hand-coins", tono: "bg-danger-soft text-danger" },
];

export type SectionNeedsProps = { copy: LandingDict["needs"] };

export function SectionNeeds({ copy }: SectionNeedsProps) {
  return (
    <section
      aria-labelledby="needs-titulo"
      className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24"
    >
      <div className="max-w-3xl">
        <p className="text-caption font-bold uppercase tracking-widest text-teal-deep">
          {copy.eyebrow}
        </p>
        <h2 id="needs-titulo" className="mt-3 font-heading text-h1 text-ink sm:text-display">
          {copy.title}
        </h2>
      </div>

      <ul className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-2">
        {copy.items.map((item, i) => {
          const glifo = GLIFOS[i] ?? GLIFOS[0];
          return (
            <li
              key={item.title}
              className="flex gap-4 overflow-hidden rounded-xl border border-line bg-surface shadow-sm"
            >
              {/* La franja de la maqueta. Plana, no una foto de archivo. */}
              <span
                aria-hidden="true"
                className={`flex w-16 shrink-0 items-center justify-center sm:w-20 ${glifo.tono}`}
              >
                <glifo.icon aria-hidden="true" data-icon={glifo.name} className="size-6" />
              </span>

              <div className="min-w-0 py-5 pr-5">
                <h3 className="font-heading text-h3 text-ink">{item.title}</h3>
                <p className="mt-2 text-body text-muted">{item.body}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
