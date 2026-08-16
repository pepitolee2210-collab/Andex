/**
 * Pruebas de los enlaces de la Tienda.
 *
 * Lo que se protege: que salir de ANDEX no filtre nada de quien sale, y que
 * un enlace mal puesto en una variable de entorno no se convierta en un
 * agujero.
 */

import { describe, expect, it } from "vitest";
import { dominioDe, validarEnlace } from "./enlaces";

describe("qué enlaces se aceptan", () => {
  it("un https normal, sí", () => {
    const r = validarEnlace("https://apps.andex.com/primera-audiencia");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.dominio).toBe("apps.andex.com");
  });

  it("con parámetros que no son datos personales, también", () => {
    const r = validarEnlace("https://apps.andex.com/guia?lang=es&v=2");
    expect(r.ok).toBe(true);
  });

  it("el `www.` no cuenta como parte del dominio que se enseña", () => {
    expect(dominioDe("https://www.ejemplo.org/x")).toBe("ejemplo.org");
  });
});

describe("qué enlaces se rechazan", () => {
  it("vacío o sin configurar", () => {
    expect(validarEnlace("")).toEqual({ ok: false, motivo: "vacio" });
    expect(validarEnlace(undefined)).toEqual({ ok: false, motivo: "vacio" });
    expect(validarEnlace(null)).toEqual({ ok: false, motivo: "vacio" });
  });

  it("http sin cifrar", () => {
    // Viaja en claro. Con este público y estos temas, no.
    expect(validarEnlace("http://apps.andex.com/x")).toEqual({ ok: false, motivo: "no-es-https" });
  });

  it("`javascript:` y `data:` — son ejecución de código, no un enlace", () => {
    expect(validarEnlace("javascript:alert(1)").ok).toBe(false);
    expect(validarEnlace("data:text/html,<script>x</script>").ok).toBe(false);
  });

  it("algo que ni siquiera es una URL", () => {
    expect(validarEnlace("apps.andex.com").ok).toBe(false);
    expect(validarEnlace("pregúntale a Juan").ok).toBe(false);
  });
});

describe("§9 — ningún dato del usuario viaja en la URL", () => {
  it("rechaza el enlace entero si trae un dato personal", () => {
    // Se rechaza, no se limpia: limpiar a medias deja la puerta abierta a
    // que mañana alguien añada otro parámetro y nadie se entere.
    for (const p of ["name", "email", "telefono", "user", "token", "caso", "a-number", "ssn"]) {
      const r = validarEnlace(`https://apps.andex.com/x?${p}=maria`);
      expect(r.ok, `debería rechazar ?${p}=`).toBe(false);
      if (!r.ok && r.motivo === "lleva-datos") expect(r.parametro).toBe(p);
    }
  });

  it("da igual cómo esté escrito el parámetro", () => {
    expect(validarEnlace("https://apps.andex.com/x?EMAIL=a@b.c").ok).toBe(false);
    expect(validarEnlace("https://apps.andex.com/x?Nombre=Maria").ok).toBe(false);
  });

  it("un parámetro que sólo SE PARECE a un dato no bloquea", () => {
    // "identifier" contiene "id" pero no es el parámetro `id`. Si esto
    // bloqueara, el catálogo se volvería imposible de mantener.
    expect(validarEnlace("https://apps.andex.com/x?identifier=guia").ok).toBe(true);
    expect(validarEnlace("https://apps.andex.com/x?video=1").ok).toBe(true);
  });
});
