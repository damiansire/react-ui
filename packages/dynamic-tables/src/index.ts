export * from "./components";
// `export *` no reenvía el default; lo reexportamos explícito para que
// `import Table from "react-dynamic-tables"` funcione (lo documentan ambos READMEs).
export { default } from "./components/Table";
