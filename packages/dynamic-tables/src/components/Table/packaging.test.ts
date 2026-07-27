/**
 * Contrato de empaquetado del artefacto publicado. Estos tests miran `dist/` y
 * `package.json`, no el código fuente: son los defectos que solo existen en el
 * tarball que recibe el consumidor.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, "../../..");
const distDir = resolve(pkgRoot, "dist");
const esmEntry = resolve(distDir, "esm/index.js");
const cjsEntry = resolve(distDir, "cjs/index.js");

const pkg = JSON.parse(
  readFileSync(resolve(pkgRoot, "package.json"), "utf8")
) as { sideEffects?: string[] };

const listFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? listFiles(join(dir, entry.name))
      : [join(dir, entry.name)]
  );

describe("Empaquetado: sideEffects vs cómo llega el CSS", () => {
  beforeAll(() => {
    if (!existsSync(esmEntry) || !existsSync(cjsEntry)) {
      execFileSync(
        process.platform === "win32" ? "npm.cmd" : "npm",
        ["run", "rollup-build-lib"],
        { cwd: pkgRoot, stdio: "inherit", shell: process.platform === "win32" }
      );
    }
  }, 120_000);

  it("si el CSS va inyectado en el bundle, los entries están declarados con efectos", () => {
    const distHasCss = listFiles(distDir).some((file) => file.endsWith(".css"));
    const injectsCss = [esmEntry, cjsEntry].some((file) =>
      readFileSync(file, "utf8").includes("styleInject(")
    );
    const sideEffects = pkg.sideEffects ?? [];

    if (distHasCss || !injectsCss) {
      // El CSS es un archivo aparte: `**/*.css` alcanza y el consumidor lo importa.
      return;
    }

    // El CSS viaja inyectado desde el propio entry: si el entry se declara
    // libre de efectos, un bundler que respete `sideEffects` puede eliminar la
    // inyección y la tabla se renderiza sin estilos SOLO en producción.
    expect(sideEffects).toContain("./dist/esm/index.js");
    expect(sideEffects).toContain("./dist/cjs/index.js");
  });
});
