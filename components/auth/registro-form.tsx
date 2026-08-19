"use client";

/**
 * REGISTRO (§0.2-B, §3: landing → REGISTRO → entrevista).
 *
 * Réplica de `onboarding.jsx → Registro` del sistema de diseño con nuestro
 * contenido. Lo que manda en esta pantalla: «un campo por pantalla y el
 * aviso de para qué sirve el dato al lado del dato». Por eso los tres
 * campos van en una sola lista agrupada, cada uno con su nota debajo, y no
 * en tarjetas sueltas con la letra pequeña al final.
 *
 * El aviso de cifrado cierra la pantalla, junto al botón: es donde surge la
 * pregunta («¿qué van a hacer con mis papeles?»). Dice la promesa y su
 * límite en la misma frase, que es la regla del proyecto.
 *
 * Al crear la cuenta el usuario va SIEMPRE a `/entrevista`: el embudo no
 * enseña precio antes de haber armado el plan.
 *
 * Cumplimiento §3.4.6: la casilla de términos llega SIN marcar y el
 * consentimiento se registra con `TERMS_VERSION` al crear la cuenta.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff, Lock } from "lucide-react";
import { PRICES, ROUTES, isDemoMode } from "@/lib/config";
import { getDictionary } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { cn, formatUsd, isValidEmail } from "@/lib/utils";
import {
  MIN_PASSWORD_LENGTH,
  signInWithMagicLink,
  signUpWithPassword,
} from "@/lib/auth/client";
import { toast } from "@/components/ui/toaster";
import { MagicLinkSent } from "./magic-link-sent";
import { focusField } from "./focus";
import { getDataStore } from "@/lib/data";
import {
  borrarPagoPendiente,
  leerPagoPendiente,
  type PagoPendiente,
} from "@/lib/pago-pendiente";

const FIELD_IDS = {
  firstName: "registro-nombre",
  email: "registro-email",
  password: "registro-password",
  terms: "registro-terminos",
} as const;

type FieldErrors = {
  firstName?: string;
  email?: string;
  password?: string;
};

type Pending = "none" | "signup" | "magic";

/**
 * Enlace a una página legal desde dentro del formulario.
 *
 * Se abre en una pestaña nueva a propósito: leer los términos no puede
 * costarle al usuario el formulario a medio llenar. `rel="noopener
 * noreferrer"` es obligatorio con `target="_blank"` — sin él la página
 * abierta obtiene `window.opener` y puede redirigir la pestaña original.
 */
function LegalLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      // El clic en el enlace no debe marcar/desmarcar la casilla que lo
      // envuelve: aceptar y leer son dos acciones distintas.
      onClick={(event) => event.stopPropagation()}
      /* `--teal-100` y no `--teal-deep`: el teal profundo está pensado para
         superficie clara y sobre este navy medía 2.28:1 — reprobado. Lo cazó
         el verificador visual fotografiando el fondo real, no la revisión. */
      className="font-semibold text-[color:var(--teal-100)] underline underline-offset-4"
    >
      {label}
    </Link>
  );
}

export function RegistroForm({ lang }: { lang: Lang }) {
  const router = useRouter();
  const dict = getDictionary(lang);
  const t = dict.auth;

  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  /**
   * EL COBRO QUE ESPERA, si lo hay. Decide toda la pantalla.
   *
   * Se lee en un efecto y NO en el inicializador del estado, aunque sea una
   * línea más: `localStorage` no existe durante el render del servidor, así
   * que el servidor pintaría siempre «sin pago» y el cliente «con pago» —
   * dos árboles distintos, y React lo canta como desajuste de hidratación.
   * Leyéndolo tras montar, ambos empiezan igual y la credencial entra
   * después.
   *
   * De paso precarga el correo que pagó: la pantalla anterior prometió que
   * la cuenta se crea «con ese mismo correo». Se puede cambiar —nadie queda
   * atrapado en una errata de la pasarela—, pero el camino de menor
   * resistencia es el que cumple la promesa.
   */
  const [pendiente, setPendiente] = useState<PagoPendiente | null>(null);

  useEffect(() => {
    const cobro = leerPagoPendiente();
    if (!cobro) return;
    setPendiente(cobro);
    if (cobro.email) setEmail((actual) => actual || cobro.email!);
  }, []);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [wantsMarketing, setWantsMarketing] = useState(false);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [termsError, setTermsError] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>("none");
  const [magicSentTo, setMagicSentTo] = useState<string | null>(null);

  /**
   * §3.4.6: qué versión aceptó, cuándo y desde qué IP. Va por el servidor
   * (`/api/consent`) porque el navegador no conoce su propia IP.
   */
  async function recordConsents(): Promise<void> {
    try {
      await fetch("/api/consent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          consents: [
            { type: "terms", granted: true },
            { type: "privacy", granted: true },
            { type: "marketing", granted: wantsMarketing },
          ],
        }),
      });
    } catch {
      // El registro del consentimiento no puede tumbar el alta. El endpoint
      // deja rastro en el log del servidor si falla.
    }
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (firstName.trim().length === 0) {
      next.firstName = dict.wizard.step1.firstName.error;
    }
    if (email.trim().length === 0) next.email = t.errors.emailRequired;
    else if (!isValidEmail(email)) next.email = t.errors.emailInvalid;

    if (password.length === 0) next.password = t.errors.passwordRequired;
    else if (password.length < MIN_PASSWORD_LENGTH) {
      next.password = t.errors.passwordTooShort;
    }
    return next;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending !== "none") return;

    const nextErrors = validate();
    const missingTerms = !acceptedTerms;
    setErrors(nextErrors);
    setTermsError(missingTerms ? t.errors.termsRequired : undefined);

    if (Object.keys(nextErrors).length > 0 || missingTerms) {
      // Si el único problema son los términos, el mensaje específico ya está
      // junto a la casilla: repetirlo arriba sería ruido.
      setFormError(
        Object.keys(nextErrors).length > 0 ? dict.common.errors.formInvalid : null,
      );
      // Foco al primer problema, en orden de lectura (§9).
      if (nextErrors.firstName) focusField(FIELD_IDS.firstName);
      else if (nextErrors.email) focusField(FIELD_IDS.email);
      else if (nextErrors.password) focusField(FIELD_IDS.password);
      else focusField(FIELD_IDS.terms);
      return;
    }

    setFormError(null);
    setPending("signup");

    const result = await signUpWithPassword({ email, password, firstName });
    if (!result.ok) {
      setPending("none");
      setFormError(result.error);
      focusField(FIELD_IDS.email);
      return;
    }

    await recordConsents();
    toast.success(t.success.accountCreated);
    router.replace(await destinoTrasCrear());
    router.refresh();
  }

  async function handleMagicLink() {
    if (pending !== "none") return;

    if (email.trim().length === 0 || !isValidEmail(email)) {
      const message =
        email.trim().length === 0 ? t.errors.emailRequired : t.errors.emailInvalid;
      setErrors((current) => ({ ...current, email: message }));
      setFormError(dict.common.errors.formInvalid);
      focusField(FIELD_IDS.email);
      return;
    }

    setFormError(null);
    setPending("magic");

    const result = await signInWithMagicLink(email);
    if (!result.ok) {
      setPending("none");
      setFormError(result.error ?? t.errors.unknown);
      return;
    }

    if (isDemoMode) {
      // Demo: el enlace se da por tocado y la sesión ya está abierta.
      toast.success(t.success.loggedIn);
      router.replace(await destinoTrasCrear());
      router.refresh();
      return;
    }

    setPending("none");
    setMagicSentTo(email.trim());
  }

  if (magicSentTo) {
    return (
      <MagicLinkSent
        lang={lang}
        email={magicSentTo}
        onChangeEmail={() => {
          setMagicSentTo(null);
          focusField(FIELD_IDS.email);
        }}
      />
    );
  }

  const c = t.credencial;

  /** El importe de lo que se pagó, del catálogo de precios y no del copy. */
  const importe = pendiente
    ? formatUsd(
        pendiente.plan === "annual" ? PRICES.annual.usd : PRICES.monthly.usd,
      )
    : null;

  /**
   * La fecha de alta, en la zona del navegador.
   *
   * Sale de `cobradoEn`, que es cuando la pasarela cobró. Se pinta con
   * `Intl` y no a mano: «19 · 08 · 2026» y «08 · 19 · 2026» son la misma
   * fecha y dos días distintos según quién lo lea.
   */
  const alta = pendiente
    ? new Intl.DateTimeFormat(lang === "en" ? "en-US" : "es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(pendiente.cobradoEn))
    : null;

  return (
    <main
      id="contenido"
      className="relative isolate min-h-dvh w-full overflow-hidden bg-navy-deep text-[color:var(--text-on-invert)]"
    >
      <div aria-hidden="true" className="hero-fondo -z-10">
        <span className="masa-1" />
        <span className="masa-2" />
      </div>

      {/* En escritorio la credencial se va a su propia columna: es lo que se
          compró, no un encabezado del formulario. En móvil va arriba, que es
          lo primero que hay que ver al volver de pagar en otro dominio. */}
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-8 px-5 py-7 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,23rem)] lg:gap-16 lg:py-16">
        <div className="lg:order-2">
          <div className="flex items-center justify-between gap-4 lg:hidden">
            <span className="font-heading text-h3 font-bold tracking-tight">
              {dict.common.brand.name}
            </span>
            {pendiente ? (
              <span className="font-mono text-caption tracking-[0.04em] text-[color:var(--text-on-invert-quiet)]">
                {c.paso}
              </span>
            ) : null}
          </div>

          {/* ── LA CREDENCIAL ──
              Sólo cuando hay un cobro esperando. Sin él esto sería una
              tarjeta de socio de nadie. */}
          {pendiente && importe ? (
            <div className="credencial mt-5 rounded-lg border border-[color:var(--hairline-on-invert)] p-5 sm:p-6 lg:mt-0">
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-caption uppercase tracking-[0.1em] text-[color:var(--teal-200)]">
                    {c.label}
                  </p>
                  <p className="mt-1 font-heading text-h2 text-[color:var(--text-on-invert)]">
                    {c.plan[pendiente.plan]}
                  </p>
                </div>
                <span aria-hidden="true" className="shrink-0">
                  <svg width="34" height="34" viewBox="0 0 40 40" fill="none">
                    <path
                      d="M6 30 C 12 8, 28 8, 34 30"
                      stroke="var(--teal-500)"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                    <circle cx="20" cy="20.5" r="3.2" fill="var(--amber-500)" />
                  </svg>
                </span>
              </div>

              <div className="relative mt-11 flex items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-caption uppercase tracking-[0.08em] text-[color:var(--text-on-invert-quiet)]">
                    {c.desde}
                  </p>
                  <p className="mt-1 font-mono text-body tabular-nums text-[color:var(--text-on-invert)]">
                    {alta}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-caption uppercase tracking-[0.08em] text-[color:var(--text-on-invert-quiet)]">
                    {c.piloto}
                  </p>
                  <p className="mt-1 font-mono text-body text-[color:var(--text-on-invert)]">
                    {c.pilotoValor}
                  </p>
                </div>
              </div>

              <div className="relative mt-6 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-[color:var(--hairline-on-invert-soft)] pt-4">
                <span
                  aria-hidden="true"
                  className="flex size-[22px] items-center justify-center rounded-full bg-[color:var(--teal-500)] text-[color:var(--navy-950)]"
                >
                  <Check className="size-3.5" strokeWidth={3.5} />
                </span>
                <span className="text-label font-bold text-[color:var(--text-on-invert)]">
                  {c.pagada(importe)}
                </span>
                <span className="ml-auto text-caption text-[color:var(--text-on-invert-quiet)]">
                  {c.recibo}
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* ── La cuenta ── */}
        <div className="lg:order-1">
          <div className="hidden items-center justify-between gap-4 lg:flex">
            <span className="font-heading text-h3 font-bold tracking-tight">
              {dict.common.brand.name}
            </span>
            {pendiente ? (
              <span className="font-mono text-caption tracking-[0.04em] text-[color:var(--text-on-invert-quiet)]">
                {c.paso}
              </span>
            ) : null}
          </div>

          <h1 className="mt-7 font-heading text-h1 leading-[1.06] text-[color:var(--text-on-invert)] lg:mt-9 lg:text-display">
            {pendiente ? c.heading : t.registro.title}
          </h1>
          <p className="mt-3 max-w-[46ch] text-body leading-[1.5] text-[color:var(--text-on-invert-quiet)]">
            {pendiente ? c.lead : t.registro.subtitle}
          </p>

          <form noValidate onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
            <CampoOscuro
              id={FIELD_IDS.firstName}
              label={dict.wizard.step1.firstName.label}
              error={errors.firstName}
            >
              <input
                id={FIELD_IDS.firstName}
                type="text"
                className={CAMPO_OSCURO}
                placeholder={dict.wizard.step1.firstName.placeholder}
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                autoComplete="given-name"
                autoCapitalize="words"
                enterKeyHint="next"
                maxLength={100}
                aria-required="true"
                aria-invalid={errors.firstName ? true : undefined}
                aria-describedby={
                  errors.firstName ? `${FIELD_IDS.firstName}-error` : undefined
                }
              />
            </CampoOscuro>

            <CampoOscuro
              id={FIELD_IDS.email}
              label={t.shared.emailLabel}
              /* El distintivo sólo aparece si el correo VINO del pago. Si el
                 usuario lo cambia, deja de ser verdad y se va. */
              distintivo={
                pendiente?.email && email === pendiente.email
                  ? c.correoDelPago
                  : undefined
              }
              hint={dict.wizard.step1.email.help}
              error={errors.email}
            >
              <input
                id={FIELD_IDS.email}
                type="email"
                inputMode="email"
                className={CAMPO_OSCURO}
                placeholder={t.shared.emailPlaceholder}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="next"
                maxLength={254}
                aria-required="true"
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={`${FIELD_IDS.email}-hint`}
              />
            </CampoOscuro>

            <CampoOscuro
              id={FIELD_IDS.password}
              label={t.shared.passwordLabel}
              hint={t.shared.passwordHelp}
              error={errors.password}
            >
              {/* La caja la pinta el ENVOLTORIO, no el `input`: el ojo de
                  mostrar/ocultar vive dentro del mismo marco que el texto, y
                  si el borde fuera del input el botón quedaría fuera de la
                  caja. El input se queda desnudo dentro. */}
              <span className={cn(CAMPO_OSCURO, "flex items-center gap-2 py-0 pr-2")}>
                <input
                  id={FIELD_IDS.password}
                  type={showPassword ? "text" : "password"}
                  className="min-w-0 flex-1 border-0 bg-transparent px-0 text-body text-[color:var(--text-on-invert)] outline-none placeholder:text-[color:var(--text-on-invert-quiet)]"
                  placeholder={t.shared.passwordPlaceholder}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  enterKeyHint="done"
                  aria-required="true"
                  aria-invalid={errors.password ? true : undefined}
                  aria-describedby={`${FIELD_IDS.password}-hint`}
                />
                {/* Icono y no texto: «Mostrar contraseña» son 19 caracteres
                    que se comen media fila y recortan el valor. */}
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-pressed={showPassword}
                  aria-label={
                    showPassword ? t.shared.passwordHide : t.shared.passwordShow
                  }
                  className="-mr-2 flex size-11 shrink-0 items-center justify-center rounded-sm text-[color:var(--text-on-invert-quiet)] transition-colors hover:text-[color:var(--text-on-invert)]"
                >
                  {showPassword ? (
                    <EyeOff aria-hidden="true" className="size-5" />
                  ) : (
                    <Eye aria-hidden="true" className="size-5" />
                  )}
                </button>
              </span>
            </CampoOscuro>

            {/* ── Consentimiento ──
                Llega SIN marcar y se registra con su versión al crear la
                cuenta (§3.4.6). El de marketing es opt-in aparte: meterlo en
                el mismo sí sería consentimiento fabricado. */}
            <div className="mt-2 flex flex-col gap-3">
              <Casilla
                id={FIELD_IDS.terms}
                checked={acceptedTerms}
                onChange={(checked) => {
                  setAcceptedTerms(checked);
                  if (checked) setTermsError(undefined);
                }}
                error={termsError}
              >
                {t.registro.termsPrefix}{" "}
                <LegalLink href={ROUTES.terminos} label={t.registro.termsLink} />{" "}
                {t.registro.termsMiddle}{" "}
                <LegalLink href={ROUTES.privacidad} label={t.registro.privacyLink} />.
              </Casilla>

              <Casilla
                id="registro-marketing"
                checked={wantsMarketing}
                onChange={setWantsMarketing}
              >
                {t.registro.marketingOptIn}
              </Casilla>
            </div>

            {formError ? (
              <p
                role="alert"
                className="text-label leading-[1.45] text-[color:var(--text-on-glass-amber)]"
              >
                {formError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={pending !== "none"}
              className="ax-btn btn-accent btn-lg wide brillo mt-2"
            >
              {pending === "signup"
                ? t.shared.submitting
                : pendiente
                  ? c.submit
                  : t.registro.submit}
            </button>

            {/* La promesa y su límite, en la misma frase. Regla del proyecto:
                este público ya oyó «nivel bancario» de quien lo estafó. */}
            <p className="flex items-start gap-2 text-caption leading-[1.5] text-[color:var(--text-on-invert-quiet)]">
              <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>{t.registro.vaultNotice}</span>
            </p>
          </form>

          {/* La vía sin contraseña se queda, pero de segunda: después de
              pagar, dos formas de crear la cuenta con el mismo peso parten la
              atención en el peor momento. */}
          <p className="mt-6 border-t border-[color:var(--hairline-on-invert-soft)] pt-5 text-label text-[color:var(--text-on-invert-quiet)]">
            <button
              type="button"
              onClick={handleMagicLink}
              disabled={pending !== "none"}
              className="min-h-11 text-left font-semibold text-[color:var(--teal-200)] underline decoration-[color:var(--hairline-on-invert)] underline-offset-4 transition-colors hover:text-[color:var(--teal-100)] disabled:opacity-50"
            >
              {pending === "magic" ? t.shared.submitting : t.registro.magicLink}
            </button>
          </p>

          <p className="mt-1 text-label text-[color:var(--text-on-invert-quiet)]">
            {t.registro.haveAccount}{" "}
            <Link
              href={ROUTES.login}
              className="font-semibold text-[color:var(--teal-200)] underline underline-offset-4"
            >
              {t.registro.haveAccountLink}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

/** Clases del campo sobre navy. Una sola vez: tres campos, un solo aspecto. */
const CAMPO_OSCURO =
  "h-14 w-full rounded-sm border border-[color:var(--hairline-on-invert)] bg-[color:var(--navy-950)]/60 px-4 text-body text-[color:var(--text-on-invert)] placeholder:text-[color:var(--text-on-invert-quiet)] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[color:var(--focus-ring)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]";

/**
 * Un campo del registro sobre fondo invertido.
 *
 * No se reutiliza `KitField` porque aquel está hecho para superficie clara
 * —etiqueta en `text-ink`, que es navy— y aquí desaparecería. La estructura
 * es la misma: etiqueta, campo, y debajo la nota o el error, nunca los dos.
 */
function CampoOscuro({
  id,
  label,
  distintivo,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  distintivo?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={id} className="flex flex-col gap-2">
      <span className="flex items-center justify-between gap-3">
        <span className="font-mono text-caption uppercase tracking-[0.08em] text-[color:var(--text-on-invert-quiet)]">
          {label}
        </span>
        {distintivo ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--accent-wash-invert)] px-2.5 py-1 text-caption font-bold text-[color:var(--teal-100)]">
            <Check aria-hidden="true" className="size-3" strokeWidth={3} />
            {distintivo}
          </span>
        ) : null}
      </span>

      {children}

      {error ? (
        <span
          id={`${id}-error`}
          role="alert"
          className="text-caption font-semibold leading-[1.4] text-[color:var(--text-on-glass-amber)]"
        >
          {error}
        </span>
      ) : hint ? (
        <span
          id={`${id}-hint`}
          className="text-caption leading-[1.4] text-[color:var(--text-on-invert-quiet)]"
        >
          {hint}
        </span>
      ) : null}
    </label>
  );
}

/** Casilla sobre navy. El área táctil son los 44px completos, no el cuadro. */
function Casilla({
  id,
  checked,
  onChange,
  error,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
        <span className="relative flex size-11 shrink-0 items-center justify-center">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(event) => onChange(event.target.checked)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            /* `z-10`: el cuadro pintado es un hermano POSTERIOR —tiene que
               serlo para que `peer-focus-visible` funcione— y sin esto se
               pinta encima y se come el toque. El input transparente debe
               quedar arriba; es él quien recibe el dedo. */
            className="peer absolute inset-0 z-10 cursor-pointer opacity-0"
          />
          <span
            aria-hidden="true"
            className={cn(
              "flex size-6 items-center justify-center rounded-xs border transition-colors",
              checked
                ? "border-[color:var(--teal-500)] bg-[color:var(--teal-500)] text-[color:var(--navy-950)]"
                : "border-[color:var(--hairline-on-invert)] bg-[color:var(--navy-950)]/60",
              error && !checked && "border-[color:var(--text-on-glass-amber)]",
              "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[color:var(--focus-ring)]",
            )}
          >
            {checked ? <Check className="size-4" strokeWidth={3.5} /> : null}
          </span>
        </span>
        <span className="min-w-0 pt-2.5 text-label leading-[1.45] text-[color:var(--text-on-invert)]">
          {children}
        </span>
      </label>
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="ml-14 text-caption font-semibold text-[color:var(--text-on-glass-amber)]"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * A DÓNDE VA QUIEN ACABA DE CREAR LA CUENTA.
 *
 * El embudo nuevo cobra ANTES de registrar, así que aquí puede haber un pago
 * esperando. Si lo hay: se activa la membresía sobre la cuenta recién creada,
 * se borra el registro —dejarlo activaría la membresía del siguiente que use
 * este navegador, y este público comparte teléfono más de lo que se suele
 * suponer— y se aterriza en la comunidad, que es donde está la gente.
 *
 * Si NO lo hay, se sigue por el embudo de siempre: la entrevista.
 */
async function destinoTrasCrear(): Promise<string> {
  const pendiente = leerPagoPendiente();
  if (!pendiente) return ROUTES.entrevista;

  try {
    const store = getDataStore();
    await store.activateDemoSubscription?.(pendiente.plan);
  } catch {
    /* Si la activación falla, la cuenta ya existe y el cobro está anotado:
       mejor entrar y que el perfil enseñe el estado real que quedarse en una
       pantalla en blanco. */
  }
  borrarPagoPendiente();
  return ROUTES.comunidad;
}
