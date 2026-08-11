import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    // `components/` entra porque algunos módulos de ahí son puros y sin
    // React —`vault-format.ts`, por ejemplo— y su lógica merece prueba tanto
    // como la de `lib/`. Sólo `.test.ts`: los `.tsx` necesitarían un DOM y
    // un runner distinto.
    include: ["lib/**/*.test.ts", "tests/**/*.test.ts", "components/**/*.test.ts"],
  },
});
