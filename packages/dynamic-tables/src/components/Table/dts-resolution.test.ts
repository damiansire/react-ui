import { describe, it, expect, beforeAll } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, "../../..");
const distDts = resolve(pkgRoot, "dist/index.d.ts");
const fixtureDir = resolve(pkgRoot, "src/__fixtures__/consumer");

const require = createRequire(import.meta.url);
// Entry JS del compilador (cross-platform; evita el shim .cmd en Windows).
const tscBin = require.resolve("typescript/bin/tsc");

describe("Resolución de tipos del paquete construido (.d.ts)", () => {
  beforeAll(() => {
    // Garantiza que exista el `dist/index.d.ts` (lo necesita el consumidor).
    if (!existsSync(distDts)) {
      execFileSync(process.execPath, [tscBin, "--version"], { cwd: pkgRoot });
      execFileSync(
        process.platform === "win32" ? "npm.cmd" : "npm",
        ["run", "rollup-build-lib"],
        { cwd: pkgRoot, stdio: "inherit", shell: process.platform === "win32" }
      );
    }
  }, 120_000);

  it("genera dist/index.d.ts en el build", () => {
    expect(existsSync(distDts)).toBe(true);
  });

  it("un consumidor importa los tipos del paquete construido y compila", () => {
    // Resuelve `react-dinamic-tables` por su `exports`/`types` map (igual que
    // un usuario externo). Si la cadena del .d.ts se rompe, tsc falla aquí.
    const run = () =>
      execFileSync(
        process.execPath,
        [
          tscBin,
          "-p",
          resolve(fixtureDir, "tsconfig.json"),
          "--pretty",
          "false",
        ],
        { cwd: fixtureDir, encoding: "utf8", stdio: "pipe" }
      );
    expect(run).not.toThrow();
  }, 120_000);
});
