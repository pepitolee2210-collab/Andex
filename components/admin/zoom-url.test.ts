/**
 * Validación del enlace de sesión.
 *
 * El único filtro barato contra pegar por error otro enlace en el sitio donde
 * cuarenta personas van a pulsar sin mirar.
 */
import { describe, expect, it } from "vitest";
import { isZoomUrl } from "./sessions-manager";

describe("enlace de Zoom", () => {
  it("acepta el formato real de una reunión", () => {
    expect(isZoomUrl("https://us06web.zoom.us/j/5612440899")).toBe(true);
    expect(isZoomUrl("https://zoom.us/j/123?pwd=abc")).toBe(true);
  });

  it("vacío vale: significa que aún no se publica", () => {
    expect(isZoomUrl("")).toBe(true);
    expect(isZoomUrl("   ")).toBe(true);
  });

  it("rechaza http sin cifrar", () => {
    expect(isZoomUrl("http://us06web.zoom.us/j/123")).toBe(false);
  });

  it("rechaza otro dominio", () => {
    expect(isZoomUrl("https://meet.google.com/abc-def")).toBe(false);
  });

  it("rechaza un dominio que sólo IMITA a zoom.us", () => {
    // El caso que de verdad importa: un enlace de phishing convincente.
    expect(isZoomUrl("https://zoom.us.evil.test/j/123")).toBe(false);
    expect(isZoomUrl("https://notzoom.us/j/123")).toBe(false);
  });

  it("rechaza basura que no es una URL", () => {
    expect(isZoomUrl("pegar aqui el enlace")).toBe(false);
  });
});
