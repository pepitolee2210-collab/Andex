/**
 * Reglas de navegación post-login (§3 y §3.4.7).
 * Cubren los tres estados del embudo y la defensa contra open redirect (§9).
 */

import { describe, expect, it } from "vitest";
import { PAST_DUE_GRACE_DAYS, ROUTES } from "@/lib/config";
import {
  hasDashboardAccess,
  resolvePostAuthRoute,
  safeInternalPath,
  safeNextPath,
  loginPathWithNext,
} from "./routing";

const completed = { onboardingCompleted: true, onboardingSkippedAtStep: null };
const skipped = { onboardingCompleted: false, onboardingSkippedAtStep: 3 };
const partial = { onboardingCompleted: false, onboardingSkippedAtStep: null };

function daysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

describe("resolvePostAuthRoute — los tres estados del embudo", () => {
  it("sin perfil manda a la entrevista", () => {
    expect(resolvePostAuthRoute({ profile: null, subscription: null })).toBe(
      ROUTES.entrevista,
    );
  });

  it("perfil a medias (ni completado ni saltado) también va a la entrevista", () => {
    expect(resolvePostAuthRoute({ profile: partial, subscription: null })).toBe(
      ROUTES.entrevista,
    );
  });

  it("con perfil y sin membresía manda al paywall", () => {
    expect(resolvePostAuthRoute({ profile: completed, subscription: null })).toBe(
      ROUTES.membresia,
    );
  });

  it("entrevista saltada cuenta como perfil: no se repite (§3.4.7)", () => {
    expect(resolvePostAuthRoute({ profile: skipped, subscription: null })).toBe(
      ROUTES.membresia,
    );
  });

  it("con membresía activa manda al panel", () => {
    expect(
      resolvePostAuthRoute({
        profile: completed,
        subscription: { status: "active", currentPeriodEnd: daysFromNow(20) },
      }),
    ).toBe(ROUTES.panel);
  });

  it("past_due conserva el acceso al panel (§3.4.7)", () => {
    expect(
      resolvePostAuthRoute({
        profile: completed,
        subscription: { status: "past_due", currentPeriodEnd: daysFromNow(-1) },
      }),
    ).toBe(ROUTES.panel);
  });

  it("cancelada y vencida vuelve al paywall, sin perder el perfil", () => {
    expect(
      resolvePostAuthRoute({
        profile: completed,
        subscription: { status: "canceled", currentPeriodEnd: daysFromNow(-10) },
      }),
    ).toBe(ROUTES.membresia);
  });
});

describe("hasDashboardAccess — matices de §3.4.7", () => {
  it("past_due dentro del periodo de gracia sigue entrando", () => {
    expect(
      hasDashboardAccess({
        status: "past_due",
        currentPeriodEnd: daysFromNow(-(PAST_DUE_GRACE_DAYS - 1)),
      }),
    ).toBe(true);
  });

  it("past_due pasada la gracia queda bloqueado", () => {
    expect(
      hasDashboardAccess({
        status: "past_due",
        currentPeriodEnd: daysFromNow(-(PAST_DUE_GRACE_DAYS + 2)),
      }),
    ).toBe(false);
  });

  it("cancelada mantiene acceso hasta el fin del periodo pagado", () => {
    expect(
      hasDashboardAccess({ status: "canceled", currentPeriodEnd: daysFromNow(5) }),
    ).toBe(true);
    expect(
      hasDashboardAccess({ status: "canceled", currentPeriodEnd: daysFromNow(-1) }),
    ).toBe(false);
  });

  it("sin suscripción no hay panel", () => {
    expect(hasDashboardAccess(null)).toBe(false);
  });
});

describe("safeInternalPath / safeNextPath — nada de open redirect (§9)", () => {
  it("acepta rutas internas", () => {
    expect(safeInternalPath("/panel")).toBe("/panel");
    expect(safeNextPath("/modulo/boveda")).toBe("/modulo/boveda");
  });

  it("rechaza URLs absolutas y protocol-relative", () => {
    expect(safeInternalPath("https://evil.com")).toBeNull();
    expect(safeInternalPath("//evil.com")).toBeNull();
    expect(safeInternalPath("/\\evil.com")).toBeNull();
    expect(safeInternalPath("evil.com")).toBeNull();
  });

  it("rechaza espacios y caracteres de control", () => {
    expect(safeInternalPath("/pa nel")).toBeNull();
    expect(safeInternalPath("/pa\nnel")).toBeNull();
    // Los bordes sí se recortan: un salto de línea al final no invalida.
    expect(safeInternalPath("/panel\n")).toBe("/panel");
  });

  it("no deja volver a los formularios de auth (bucle)", () => {
    expect(safeNextPath(ROUTES.login)).toBeNull();
    expect(safeNextPath(ROUTES.registro)).toBeNull();
    expect(safeNextPath(ROUTES.recuperar)).toBeNull();
  });

  it("pero /recuperar/nueva SÍ es destino válido (enlace del correo)", () => {
    expect(safeNextPath("/recuperar/nueva")).toBe("/recuperar/nueva");
  });

  it("loginPathWithNext codifica el destino o lo descarta", () => {
    expect(loginPathWithNext("/modulo/boveda")).toBe(
      `${ROUTES.login}?next=%2Fmodulo%2Fboveda`,
    );
    expect(loginPathWithNext("https://evil.com")).toBe(ROUTES.login);
  });
});
