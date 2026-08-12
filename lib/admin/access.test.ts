/**
 * El acceso al panel.
 *
 * Lo que se protege: que la rama permisiva del modo demo NO pueda alcanzarse
 * en un despliegue real. Es la única línea entre "cualquiera con sesión
 * administra" y la base de datos con sus roles.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const cargar = async (demo: boolean, correo?: string) => {
  vi.resetModules();
  vi.doMock("@/lib/config", () => ({ isDemoMode: demo }));
  if (correo) process.env.ANDEX_DEMO_ADMIN_EMAIL = correo;
  else delete process.env.ANDEX_DEMO_ADMIN_EMAIL;
  return import("./access");
};

beforeEach(() => { delete process.env.ANDEX_DEMO_ADMIN_EMAIL; });
afterEach(() => { vi.doUnmock("@/lib/config"); delete process.env.ANDEX_DEMO_ADMIN_EMAIL; });

describe("acceso al panel", () => {
  it("fuera de modo demo NADIE pasa por aquí", async () => {
    // En producción manda `user_roles` y RLS, no esta función.
    const { isAdminEmail } = await cargar(false);
    expect(isAdminEmail("quien@sea.test")).toBe(false);
  });

  it("fuera de modo demo, ni siquiera el correo configurado", async () => {
    const { isAdminEmail } = await cargar(false, "jefe@andex.test");
    expect(isAdminEmail("jefe@andex.test")).toBe(false);
  });

  it("en demo sin correo configurado, cualquiera con sesión", async () => {
    const { isAdminEmail } = await cargar(true);
    expect(isAdminEmail("alguien@andex.test")).toBe(true);
  });

  it("en demo con correo configurado, sólo ése", async () => {
    const { isAdminEmail } = await cargar(true, "jefe@andex.test");
    expect(isAdminEmail("jefe@andex.test")).toBe(true);
    expect(isAdminEmail("otro@andex.test")).toBe(false);
  });

  it("no distingue mayúsculas ni espacios", async () => {
    const { isAdminEmail } = await cargar(true, "jefe@andex.test");
    expect(isAdminEmail("  JEFE@Andex.test ")).toBe(true);
  });

  it("sin correo no pasa", async () => {
    const { isAdminEmail } = await cargar(true, "jefe@andex.test");
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
  });
});
