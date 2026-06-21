import { describe, it, expect, beforeAll } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, "../../..");
const esmEntry = resolve(pkgRoot, "dist/esm/index.js");
const cjsEntry = resolve(pkgRoot, "dist/cjs/index.js");

// Presupuesto de bundle (gzip) por entry. La librería empaqueta su CSS, por eso
// el tamaño base ronda los ~31 KB; el tope da margen para cambios menores y
// FALLA si una dependencia o feature infla el paquete sin querer.
const GZIP_BUDGET_BYTES = 40 * 1024;

const gzipSizeOf = (file: string): number =>
  gzipSync(readFileSync(file)).length;

describe("Presupuesto de bundle (gzip)", () => {
  beforeAll(() => {
    if (!existsSync(esmEntry) || !existsSync(cjsEntry)) {
      execFileSync(
        process.platform === "win32" ? "npm.cmd" : "npm",
        ["run", "rollup-build-lib"],
        { cwd: pkgRoot, stdio: "inherit", shell: process.platform === "win32" }
      );
    }
  }, 120_000);

  it(`el entry ESM no supera ${GZIP_BUDGET_BYTES} bytes gzip`, () => {
    const size = gzipSizeOf(esmEntry);
    expect(size).toBeLessThanOrEqual(GZIP_BUDGET_BYTES);
  });

  it(`el entry CJS no supera ${GZIP_BUDGET_BYTES} bytes gzip`, () => {
    const size = gzipSizeOf(cjsEntry);
    expect(size).toBeLessThanOrEqual(GZIP_BUDGET_BYTES);
  });
});
