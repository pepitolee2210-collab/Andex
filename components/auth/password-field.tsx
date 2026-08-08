"use client";

/**
 * Campo de contraseña: `Input` del sistema + botón mostrar/ocultar + medidor
 * de fuerza opcional.
 *
 * Decisiones:
 * - El botón se superpone al input, no lo sustituye: así el campo sigue
 *   siendo el mismo componente del sistema de diseño. El desplazamiento
 *   vertical es exacto, no aproximado — la etiqueta del Input mide
 *   0.875rem × 1.4 = 1.225rem más 0.375rem de margen = 1.6rem.
 * - Target del botón 44 × 44 px (§9) y el input reserva `pr-14` para que el
 *   texto nunca pase por debajo.
 * - El medidor se ANUNCIA: la barra es decorativa (`aria-hidden`) pero debajo
 *   va la etiqueta en texto, con `aria-live="polite"` — solo habla cuando se
 *   cruza un umbral, no en cada tecla. El requisito real —"al menos 8
 *   caracteres"— sigue dicho con palabras en el texto de ayuda y es lo único
 *   que bloquea el envío; el medidor orienta, no juzga.
 */

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { passwordStrength, type PasswordStrength } from "@/lib/auth/policy";
import { cn } from "@/lib/utils";

const SEGMENT_CLASS: Record<PasswordStrength, string> = {
  0: "bg-line",
  1: "bg-danger",
  2: "bg-amber",
  3: "bg-success",
};

const LABEL_CLASS: Record<PasswordStrength, string> = {
  0: "text-muted",
  1: "text-danger",
  2: "text-amber-deep",
  3: "text-success",
};

export type StrengthLabels = { weak: string; medium: string; strong: string };

function StrengthMeter({
  value,
  labels,
}: {
  value: string;
  labels?: StrengthLabels;
}) {
  const level = passwordStrength(value);
  const text =
    level === 1 ? labels?.weak : level === 2 ? labels?.medium : level === 3 ? labels?.strong : null;

  return (
    <div className="mt-2">
      <div aria-hidden="true" className="flex gap-1.5">
        {[1, 2, 3].map((segment) => (
          <span
            key={segment}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-200",
              segment <= level ? SEGMENT_CLASS[level] : "bg-line",
            )}
          />
        ))}
      </div>
      {/* Solo cambia al cruzar un umbral: no habla en cada tecla. */}
      <p aria-live="polite" className={cn("mt-1 min-h-5 text-caption", LABEL_CLASS[level])}>
        {text ?? ""}
      </p>
    </div>
  );
}

export type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "new-password" | "current-password";
  showLabel: string;
  hideLabel: string;
  placeholder?: string;
  help?: string;
  error?: string;
  /** Muestra el medidor de fuerza (solo al crear o cambiar contraseña). */
  meter?: boolean;
  /** Etiquetas del medidor, desde `auth.passwordStrength`. */
  strengthLabels?: StrengthLabels;
};

export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  showLabel,
  hideLabel,
  placeholder,
  help,
  error,
  meter = false,
  strengthLabels,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <div className="relative">
        <Input
          id={id}
          label={label}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder={placeholder}
          help={help}
          error={error}
          aria-required="true"
          inputClassName="pr-14"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
          aria-controls={id}
          className="absolute right-0 top-[1.6rem] inline-flex size-11 items-center justify-center rounded-sm text-muted transition-colors duration-150 hover:text-ink"
        >
          {visible ? (
            <EyeOff aria-hidden="true" className="size-5" />
          ) : (
            <Eye aria-hidden="true" className="size-5" />
          )}
        </button>
      </div>
      {meter ? <StrengthMeter value={value} labels={strengthLabels} /> : null}
    </div>
  );
}
