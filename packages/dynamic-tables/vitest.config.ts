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
  },
});
