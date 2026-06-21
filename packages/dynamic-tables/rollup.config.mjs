import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import packageJson from "./package.json" with { type: "json" };
import postcss from "rollup-plugin-postcss";

// React y sus subpaths viven en la app consumidora (peerDependencies); deben
// quedar `external` para no inlinear React en el bundle (evita "Invalid hook
// call" por dos instancias de React en runtime).
const external = (id) =>
  id === "react" ||
  id === "react-dom" ||
  id.startsWith("react/") ||
  id.startsWith("react-dom/");

export default [
  {
    input: "src/index.ts",
    external,
    output: [
      {
        file: packageJson.main,
        format: "cjs",
      },
      {
        file: packageJson.module,
        format: "esm",
      },
    ],
    plugins: [
      resolve(),
      commonjs(),
      typescript({ tsconfig: "./tsconfig.json" }),
      postcss({
        plugins: [],
      }),
    ],
  },
  {
    input: "dist/esm/types/index.d.ts",
    output: [{ file: "dist/index.d.ts", format: "esm" }],
    plugins: [dts()],
    external: [/\.(css|less|scss)$/],
  },
];
