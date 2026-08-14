/**
 * Pruebas del enlace de WhatsApp.
 *
 * Toda la sección de Inversiones desemboca aquí, así que lo que se protege
 * es concreto: que un número mal puesto no pinte un botón que abre un chat
 * vacío, y que en la URL no viaje ni un dato de la persona.
 */

import { describe, expect, it } from "vitest";
import {
  buildWhatsAppLink,
  isValidWhatsAppPhone,
  normalizePhone,
  opportunityMessage,
} from "./whatsapp";

describe("el número", () => {
  it("se limpia de signos, espacios y paréntesis", () => {
    expect(normalizePhone("+1 (801) 555-0100")).toBe("18015550100");
    expect(normalizePhone("+52 55 1234 5678")).toBe("525512345678");
  });

  it("un número local sin prefijo de país NO vale", () => {
    // "8015550100" abre un chat en otro país con un desconocido. Es peor
    // que no tener botón: la persona cree que escribió y nadie contesta.
    expect(isValidWhatsAppPhone("8015550100")).toBe(false);
  });

  it("con prefijo internacional sí", () => {
    expect(isValidWhatsAppPhone("+1 801 555 0100")).toBe(true);
    expect(isValidWhatsAppPhone("+52 55 1234 5678")).toBe(true);
  });

  it("vacío, con letras o absurdamente largo, no", () => {
    expect(isValidWhatsAppPhone("")).toBe(false);
    expect(isValidWhatsAppPhone("llámanos")).toBe(false);
    expect(isValidWhatsAppPhone("1".repeat(20))).toBe(false);
  });
});

describe("el enlace", () => {
  it("se construye con el número limpio y el mensaje codificado", () => {
    const url = buildWhatsAppLink({ phone: "+1 (801) 555-0100", message: "Hola, ¿qué tal?" });
    expect(url).toBe("https://wa.me/18015550100?text=Hola%2C%20%C2%BFqu%C3%A9%20tal%3F");
  });

  it("sin número configurado devuelve null, no una cadena rota", () => {
    // La pantalla usa este null para decir que el contacto no está
    // disponible, en vez de pintar un botón que no lleva a nadie.
    expect(buildWhatsAppLink({ phone: "", message: "Hola" })).toBeNull();
    expect(buildWhatsAppLink({ phone: "12345", message: "Hola" })).toBeNull();
  });

  it("los acentos y la eñe sobreviven", () => {
    const url = buildWhatsAppLink({ phone: "+18015550100", message: "Compañía" });
    expect(decodeURIComponent(url!.split("text=")[1])).toBe("Compañía");
  });
});

describe("§9 — en la URL no viaja ni un dato del usuario", () => {
  it("el mensaje sólo nombra la oportunidad", () => {
    const mensaje = opportunityMessage(
      "Hola, vi la oportunidad de {opportunity} en ANDEX y quiero más información.",
      "Capital en operación",
    );
    expect(mensaje).toBe(
      "Hola, vi la oportunidad de Capital en operación en ANDEX y quiero más información.",
    );
  });

  it("un marcador desconocido no se rellena con nada raro", () => {
    // Si alguien escribe {name} en el copy pensando que se sustituye, tiene
    // que quedarse literal y verse en revisión — no colar un dato personal.
    const mensaje = opportunityMessage("Soy {name} y vi {opportunity}", "Bienes raíces");
    expect(mensaje).toContain("{name}");
    expect(mensaje).toContain("Bienes raíces");
  });
});
