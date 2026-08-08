import { CircleAlert, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Aviso a nivel de formulario. Se monta solo cuando hay mensaje, que es lo
 * que hace que `role="alert"` lo anuncie al insertarse.
 *
 * §2.7: el mensaje dice qué pasó y cómo resolverlo; el componente no añade
 * disculpas ni adornos.
 */

export type FormAlertProps = {
  message: string | null;
  tone?: "error" | "success";
  className?: string;
};

export function FormAlert({ message, tone = "error", className }: FormAlertProps) {
  if (!message) return null;

  const isError = tone === "error";
  const Icon = isError ? CircleAlert : CircleCheck;

  return (
    <p
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-sm border p-3 text-body",
        isError
          ? "border-danger bg-danger-soft text-danger"
          : "border-success bg-success-soft text-success",
        className,
      )}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <span className="min-w-0 flex-1">{message}</span>
    </p>
  );
}
