# AGENTS.md — react-ui

Documentación del codebase para agentes (y humanos). Fuente única de verdad;
`CLAUDE.md` delega acá.

## Qué es este repo

Monorepo de componentes React reutilizables, organizado con **npm workspaces**.
Cada paquete vive en `packages/*` y se publica a npm bajo su propio nombre, pero
evolucionan juntos en este repo.

| Paquete | npm | Qué hace |
|---|---|---|
| `dynamic-tables` (`react-dynamic-tables`) | publicado | Tablas dinámicas e interactivas con selección y edición de celdas. |

## Comandos canónicos

Correr siempre desde la raíz usando el workspace, **nunca** `cd` a un paquete:

```bash
npm install                                   # instala todo el monorepo
npm run -w react-dynamic-tables storybook     # dev server de Storybook (puerto 6006)
npm run -w react-dynamic-tables build-storybook
npm run -w react-dynamic-tables rollup-build-lib   # build de la librería (rollup)
```

## Estructura de un paquete

```
packages/<paquete>/
  src/
    index.ts                  # barrel público del paquete
    components/
      index.ts                # re-exporta los componentes públicos
      <Componente>/
        <Componente>.tsx      # implementación
        <Componente>.stories.tsx
        index.ts              # export del componente
        interfaces/           # tipos públicos (Props, etc.)
        libs/                 # helpers internos
        <componente>.css
  rollup.config.mjs
  tsconfig.json
  package.json                # exports map + sideEffects + files
```

## Convenciones de código

- **TypeScript estricto.** `strict: true` ya está activo. Objetivo de hardening
  pendiente (ver TODO): `noUncheckedIndexedAccess`, `noUnusedLocals`,
  `noUnusedParameters`, `verbatimModuleSyntax`. Acceso indexado (`rows[i]`,
  `headers[i]`, `Object.keys(...)`) debe asumir `T | undefined` y guardar.
- **`forwardRef` en componentes que renderizan un nodo DOM.** Una primitiva de UI
  debe reenviar el ref al elemento real para que el consumidor pueda medir,
  enfocar o animar el nodo. Agregar `displayName` a cada componente con
  `forwardRef`.
- **Props controladas / no controladas:** toda prop de valor (`value`/`defaultValue`,
  `selected`/`defaultSelected`, etc.) debería pasar por un único hook
  `useControlled`-style: `isControlled` se fija en el primer render y nunca cambia.
- **Tipos públicos exportados:** exportar la interfaz `{Componente}Props` desde el
  barrel del paquete.
- **Empaquetado:** `package.json` declara `exports` map (subpath con
  `types`/`import`/`require`), `sideEffects: ["**/*.css"]` (hay imports de CSS, no
  usar `false`) y `files` acotado a `dist`.

## Pre-PR checklist

1. La librería buildea: `npm run -w react-dynamic-tables rollup-build-lib`.
2. Storybook levanta sin errores: `npm run -w react-dynamic-tables storybook`.
3. No quedan tipos rotos (cuando se agregue el script de typecheck).
4. Si tocaste lógica/dominio, dejá un test que lo cubra.

## Commits

Conventional commits en **español** (`feat(scope): …`, `fix(…)`, `chore(…)`,
`docs(…)`, `refactor(…)`). El mensaje describe el cambio. Sin atribución
automática.
