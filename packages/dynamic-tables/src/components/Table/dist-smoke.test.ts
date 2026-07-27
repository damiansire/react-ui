/**
 * Smoke test del ARTEFACTO, no del fuente: importa y EJECUTA `dist/`. Los dos
 * bugs recurrentes del historial de este paquete (React inlineado ⇒ "Invalid
 * hook call" en la app consumidora, y default export perdido en el bundle) son
 * fallas del tarball que ni el typecheck ni el presupuesto de bundle atrapan.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, "../../..");
const esmEntry = resolve(pkgRoot, "dist/esm/index.js");
const cjsEntry = resolve(pkgRoot, "dist/cjs/index.js");
const require = createRequire(import.meta.url);

interface PackageExports {
  Table?: unknown;
  default?: unknown;
  getCell?: unknown;
}

const rows = [
  { id: "1", name: "Alice", amount: "10" },
  { id: "2", name: "Bob", amount: "20" },
];
const headers = [
  { attributeName: "name", displayText: "Nombre" },
  { attributeName: "amount", displayText: "Monto" },
];

describe("Smoke del artefacto publicado (dist/)", () => {
  beforeAll(() => {
    if (!existsSync(esmEntry) || !existsSync(cjsEntry)) {
      execFileSync(
        process.platform === "win32" ? "npm.cmd" : "npm",
        ["run", "rollup-build-lib"],
        { cwd: pkgRoot, stdio: "inherit", shell: process.platform === "win32" }
      );
    }
  }, 120_000);

  it("el entry CJS se puede requerir y expone Table, default y getCell", () => {
    const mod = require(cjsEntry) as PackageExports;
    // `Table` es un componente `forwardRef`: un objeto exótico de React, no una
    // función. Lo que importa es que exista, que sea renderizable (test de SSR
    // más abajo) y que el default apunte al mismo componente.
    expect(mod.Table).toBeTruthy();
    expect(typeof mod.getCell).toBe("function");
    expect(mod.default).toBe(mod.Table);
  });

  it("el entry ESM se puede importar y expone lo mismo", async () => {
    const mod = (await import(pathToFileURL(esmEntry).href)) as PackageExports;
    expect(mod.Table).toBeTruthy();
    expect(typeof mod.getCell).toBe("function");
    expect(mod.default).toBe(mod.Table);
  });

  it("el componente construido renderiza un grid en SSR", () => {
    const mod = require(cjsEntry) as PackageExports;
    const html = renderToString(
      createElement(mod.Table as never, { rows, headers } as never)
    );
    expect(html).toContain('role="grid"');
    expect(html).toContain("Alice");
  });

  it("no lleva React inlineado (React queda como peer, no empaquetado)", () => {
    for (const entry of [esmEntry, cjsEntry]) {
      const code = readFileSync(entry, "utf8");
      expect(code).not.toContain("__SECRET_INTERNALS");
      expect(code).not.toContain("react.production.min");
    }
  });
});
