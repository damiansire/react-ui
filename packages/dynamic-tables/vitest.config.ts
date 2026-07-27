import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    css: false,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    typecheck: {
      // Type-tests del API público (expectTypeOf / @ts-expect-error).
      include: ["src/**/*.test-d.ts"],
      tsconfig: "./tsconfig.json",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.test-d.ts",
        "src/**/*.stories.tsx",
        "src/__fixtures__/**",
      ],
      // Umbral como ratchet: nace en el nivel medido hoy y solo sube. Es una
      // barra propia de este repo, no una práctica copiada: el mecanismo
      // (coverage.thresholds de vitest, exit 1 si no se cumple) sí es estándar,
      // pero repos top como backstage no gatean cobertura por umbral. remeda sí
      // sostiene un gate de cobertura, y es el precedente que seguimos.
      // Medido 2026-07-27: 98.75 stmts / 91.08 branches / 100 funcs / 98.75 lines.
      thresholds: {
        statements: 95,
        branches: 88,
        functions: 100,
        lines: 95,
      },
    },
  },
});
