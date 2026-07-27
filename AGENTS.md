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
npm run build                                 # build de la librería (rollup)
npm run typecheck                             # tsc --noEmit en cada workspace
npm test                                      # suite + type-tests + gate de cobertura
npm run -w react-dynamic-tables storybook     # dev server de Storybook (puerto 6006)
npm run -w react-dynamic-tables build-storybook
npm run -w react-dynamic-tables test:coverage # sólo la suite con reporte de cobertura
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

- **TypeScript estricto y centralizado.** La barra vive en `tsconfig.base.json` de
  la raíz y cada paquete la extiende con una línea; un tsconfig de paquete que
  re-declara flags de strictness es drift. Activos hoy: `strict`,
  `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`,
  `noImplicitReturns`, `noImplicitOverride`, `noFallthroughCasesInSwitch`,
  `noPropertyAccessFromIndexSignature`, `exactOptionalPropertyTypes`,
  `allowUnreachableCode: false`, `isolatedModules` y `verbatimModuleSyntax`
  (imports de tipos siempre con `import type`). Acceso indexado (`rows[i]`,
  `headers[i]`, `Object.keys(...)`) asume `T | undefined` y se guarda.
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

## Estándar nivel mundial

Esta es la barra contra la que se **construye** este repo, no una auditoría que se
pasa al final. Se lee antes de escribir la feature. Cada regla dice de qué repo o
fuente sale, para que se pueda discutir contra evidencia y no contra gusto.

Regla raíz (**intención clara / zero-guessing**): el código tiene que ser tan
evidente que alguien senior entienda el *porqué* sin preguntar y sin ejecutarlo.

### Piso de Craft (a-j)

Es el piso: si algo de acá está violado, el trabajo no está terminado, por lindo
que se vea. Es una barra transversal propia, destilada de SQLite, ripgrep, LLVM,
Kubernetes y PostgreSQL.

- **a. El nombre revela la intención de dominio, no el mecanismo.** `selectedCell`,
  `commitEdit`, `sortDirection`, no `data`, `handle`, `manager`.
- **b. Los comentarios explican POR QUÉ, nunca QUÉ.** Un comentario que parafrasea
  el código es señal de que hay que renombrar o extraer. Y si el comentario y el
  código no dicen lo mismo, el comentario es un bug: se corrige o se borra.
- **c. Superficie pública autodocumentada.** La firma comunica el contrato sin leer
  el cuerpo. Si hay que ejecutar `Table` para saber cuándo dispara `onCellEdit`,
  falla este ítem.
- **d. Impacto mínimo al cambiar el core.** Cambiar una regla no obliga a editar N
  archivos acoplados. Dos listeners de teclado hermanos sincronizados por un flag
  son exactamente esto violado.
- **e. Features borrables sin cirugía.** Sacar virtualización, sort o edición no
  debería dejar tentáculos en el resto del componente.
- **f. Flujo de datos inmutable y rastreable.** El estado se deriva, no se muta a
  escondidas. Nada de efectos secundarios adentro de un updater de `setState`, y
  ninguna caché interna que tape para siempre a una prop.
- **g. Consistencia ante excepción.** Si algo falla a mitad (fila desmontada
  durante una edición, por ejemplo), el estado queda consistente o recuperable,
  nunca a medias.
- **h. Los boundaries comunican lo que pasa.** En una librería de UI el boundary es
  el contrato con el consumidor: warnings dev-only (ids duplicados, `virtualized`
  sin `height`, `attributeName` inexistente) y un canal de error explícito, en vez
  de degradar a `""` en silencio.
- **i. Límites explícitos.** Reintentos y loops acotados (el reintento de foco al
  cruzar el límite virtualizado tiene tope, y se mantiene así).
- **j. Fail-closed donde importa.** Ante duda, denegar; y un guard que no puede
  disparar nunca (condición muerta) cuenta como violación, no como defensa.

### Legibilidad en frío (k-m)

Cluster distinto de Craft: que el artefacto haga **visible y verificable** lo que
es para alguien que cae en frío, en 30 segundos, sin abrir el código. Su ausencia
no baja el craft, pero deja el trabajo sub-descripto.

- **k. El README lidera con prueba visible y framing honesto.** Captura, GIF o
  code-example en el primer screenful, más un statement claro de qué es y para
  quién. Este paquete es un artefacto **visual e interactivo**: una descripción en
  texto de la navegación por teclado no cuenta como prueba visible. Nombre y
  descripción tienen que igualar lo que el repo realmente hace.
  (ref: guía OSS de GitLab, los 5 contenidos de README de GitHub)
- **l. Donde prometés robustez o performance, la prueba está y es reproducible.**
  Números head to head con método declarado, no adjetivos. ripgrep publica
  `rg 0.082s` vs `ack 2.935s` con corpus descargable y entorno declarado. Acá el
  equivalente es el bench de virtualización con su metodología, y para las rutas
  que se declaran accesibles o robustas, tests en **esa** ruta.
  (ref: ripgrep benchsuite, TechEmpower)
- **m. Framing honesto: se reconoce el sesgo y el límite del claim.** Decir dónde
  gana y dónde no. Gallant lo hace en ripgrep: "no es universalmente más rápido,
  en archivos chicos la diferencia es despreciable", y publica hasta el benchmark
  que pierde. Un claim de accesibilidad sin decir qué falta (i18n de los strings
  ARIA, soporte de React 19, SSR) es cherry-pick.
  (ref: ripgrep, SQLite "Distinctive Features")

### Techo de Craft

El piso es no violar a-j. El techo es lo que hace que un repo se copie tal cual:
la calidad deja de ser convención y pasa a ser **hecho verificado por máquina**.

- **Imposible de malusar, no sólo legible.** Que el tipo impida el uso incorrecto
  antes de que el test lo pesque (LLVM, type-state).
- **El boundary como hecho de CI.** Import allowlist default-deny chequeada, no un
  párrafo en un doc (import-boss de Kubernetes).
- **Invariantes observables y ejercitadas con fallas inyectadas.** El `assert` es
  prueba verificada en todos los tests, no un comentario optimista (SQLite,
  PostgreSQL).
- **La superficie de tipos fijada por tests.** `expectTypeOf` sobre el API pública:
  un cambio accidental de tipos rompe el build (ariakit `store.test.ts`, TanStack
  Query `*.test-d.ts`).
- **Performance con gate versionado.** Bench en el repo y comparación baseline vs
  actual con umbral de significancia, no una medición suelta (ariakit corre
  `perf-compare` con ±10%).
- **Invariantes de arquitectura como reglas de lint propias.** type-fest enforza
  con reglas custom type-aware que todo tipo público esté re-exportado en el
  barrel, en vez de confiar en la costumbre.

### Reglas enforzables del stack

#### React (librería de componentes)

- `forwardRef` + `displayName` en todo componente que renderiza un nodo DOM: sin
  eso el consumidor no puede medir, enfocar ni animar. (ref: radix-ui/primitives
  `primitive.tsx`; ariakit `checkbox.tsx`)
- Lógica en un hook, componente trivial: `useX(props) -> htmlProps` y el
  componente como one-liner. Hace la lógica testeable sin montar JSX. (ref:
  ariakit `createHook` + `system.tsx`)
- Polimorfismo por `render`-prop o `asChild` + Slot, nunca `as={Component}`: el
  merge de props y refs se conserva. (ref: radix `slot.tsx`; ariakit `system.tsx`)
- **Toda prop de valor pasa por un único hook estilo `useControlled`**, con
  `isControlled` fijado en el primer render y warnings dev-only al cruzar
  controlado/no controlado. Un overlay interno que le gane a la prop es un bug de
  contrato. (ref: mui/material-ui `useControlled.ts`; radix
  `use-controllable-state.tsx`)
- El estado derivado se calcula en el render (`useMemo`), jamás con `useState` +
  `useEffect` en cascada. (ref: TanStack Query, criterio BLOCKER de la nota de
  hooks/concurrencia)
- Efectos secundarios **fuera** de los updaters de `setState`, y callbacks
  estables con el patrón `useEvent` (ref actualizado en insertion effect) para
  cortar el ciclo handler nuevo → efecto → re-render. (ref: ariakit `hooks.ts`)
- Efectos asíncronos con `AbortController` o flag de ignorado. (ref: TanStack
  Query)
- Los estados de un ciclo de vida se modelan como unión discriminada, no como
  booleanos sueltos que admiten estados imposibles. (ref: XState, nota de
  máquinas de estado)
- Higiene de props hacia el DOM: nada de atributos inventados ni de `undefined`
  escupido al markup. Lo propio del componente va como `data-*`. (ref: ariakit
  `removeUndefinedValues`)
- Eventos de alta frecuencia (keydown, scroll) no re-renderizan el árbol entero:
  memo por fila, estado del borrador local a la celda, `useTransition` o
  `useDeferredValue` donde aplique. (ref: React 18, nota de hooks/concurrencia)

#### Librería TypeScript publicada

- `exports` map explícito con `types`/`import`/`require` más `./package.json`, y
  cero deep-imports a internals. (ref: ariakit, mui/material-ui, remeda,
  sindresorhus/type-fest)
- `sideEffects` coherente con lo que `dist` **realmente** contiene: o se extrae y
  publica el CSS, o el entry se declara side-effectful. Declarar `**/*.css` sobre
  archivos que el tarball no tiene es tree-shaking mal apuntado. (ref: remeda,
  mui/material-ui)
- `files` acotado a `dist`: nada de basura en el tarball. (ref: type-fest,
  remeda)
- **tsconfig estricto CENTRALIZADO**: la strictness vive sólo en
  `tsconfig.base.json` de la raíz y los paquetes lo extienden con una línea. Un
  tsconfig hoja que re-declara flags de strictness es drift. Hoy incluye
  `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
  `noPropertyAccessFromIndexSignature`, `verbatimModuleSyntax`, `isolatedModules`
  y el resto del set. (ref: backstage, directus, n8n; remeda; ariakit)
- Type-tests `*.test-d.ts` con `expectTypeOf` y `@ts-expect-error` para los casos
  que **deben** fallar, corriendo en CI. (ref: TanStack Query, remeda, type-fest)
- El artefacto publicado se verifica, no se asume: los `.d.ts` emitidos compilan
  para un consumidor real, con `moduleResolution` de bundler y de node16, más
  `attw`/`publint`. Un fixture con `moduleResolution: node` no prueba el
  `exports` map porque lo ignora. (ref: remeda `tsconfig.dist.json`;
  mui/material-ui `test:attw`)
- JSDoc con `@example` y `@throws` en la API pública. (ref: toss/es-toolkit)
- Entrada validada y error accionable (qué pasó, por qué es un problema, cómo se
  resuelve), en dev; degradado silencioso sólo en producción. (ref: es-toolkit;
  convención de errores de mui/material-ui)

#### Repo Node + TypeScript (CI y supply-chain)

- **Typecheck como gate dedicado y bloqueante**, separado de build y de test
  (`npm run typecheck`). (ref: n8n job `Typecheck`; backstage `tsc:full`)
- **Cero `continue-on-error` y cero `|| true`** en los workflows. Las excepciones
  se documentan explícitas. (ref: n8n)
- **Un gate declarado tiene que gatear.** Si el step se llama "gate de X",
  ejecuta X; si sólo compila, se llama "compila". Un check decorativo es peor que
  no tenerlo porque da falsa confianza.
- **Instalación reproducible**: se respeta el lockfile (`npm ci`). Nunca se borra
  el lockfile en el job que tiene el token de publicación: eso publica un
  artefacto construido con dependencias sin fijar. (ref: backstage
  `verify-lockfile-duplicates.js`)
- **Actions de terceros pinneadas por SHA completo** con el tag como comentario,
  con prioridad estricta en el job de release. (ref: n8n)
- **Cobertura con umbral tipo ratchet** (`coverage.thresholds` de vitest, exit 1
  si baja). Es barra propia del repo, no consenso: el mecanismo es estándar, pero
  varios repos top no gatean cobertura. remeda sí, y es el precedente.
- `.gitattributes` con `* text=auto eol=lf`, y `.gitignore` versionado que cubre
  secretos y artefactos de proceso: la protección viaja con el repo, no con la
  máquina.

### Documentación

- **El README nombra al proyecto igual que el manifest.** El `name` y la
  `description` del `package.json`, el título del README y lo que el paquete hace
  son la misma cosa. Si se renombra el paquete, se renombra en todos lados en el
  mismo commit.
- **No se linkea a archivos que no existen.** Todo link relativo apunta a algo
  presente en el repo (el workflow de links es el gate, no la memoria).
- **No es un molde reciclado.** Nada de secciones genéricas copiadas de otro
  repo: las props, las teclas y los ejemplos son los de ESTE paquete y compilan.
  Un ejemplo que no se puede pegar y correr es un ejemplo roto.
- Non-goals explícitos: qué NO hace y cuándo conviene otra librería. Presencia de
  esa sección es lo que distingue alcance deliberado de deriva. (ref: SQLite
  "Distinctive Features", ripgrep "Why shouldn't I use ripgrep?")
- Versionado y migración escritos: qué garantiza cada segmento hoy, qué falta
  para 1.0, y el paso de migración desde nombres anteriores.
- Una decisión relevante, un ADR, con contexto y consecuencias. (ref: formato de
  ADR de Nygard; `docs/adr/`)

### Estado de enforcement

Distinguir lo verificado por máquina de lo que hoy es criterio de review:

| Regla | Cómo se verifica hoy |
|---|---|
| tsconfig estricto centralizado | `npm run typecheck` (gate de CI) |
| Type-tests del API pública | `vitest --typecheck` sobre `*.test-d.ts` |
| Cobertura no baja | `coverage.thresholds` en `vitest.config.ts`, exit 1 |
| Presupuesto de bundle | `bundle-budget.test.ts` |
| Accesibilidad | `Table.a11y.test.tsx` con axe-core |
| Links del README | workflow `links.yml` (lychee) |
| Higiene de secretos | `hygiene-gate.yml` + `.gitignore` versionado |
| Lint | **sin gate** (no hay ESLint en el repo todavía) |
| `attw` / `publint` | **sin gate** |
| Matriz de React 18/19 en CI | **sin gate** |
| Resto de las reglas de arriba | criterio de review |

## Pre-PR checklist

1. La librería buildea: `npm run build`.
2. Los tipos cierran: `npm run typecheck`.
3. La suite pasa con el gate de cobertura: `npm test`.
4. Storybook levanta sin errores: `npm run -w react-dynamic-tables storybook`.
5. Si tocaste lógica/dominio, dejá un test que lo cubra.
6. Repasá el piso de Craft (a-j) y la cláusula de Documentación para lo que tocaste.

## Commits

Conventional commits en **español** (`feat(scope): …`, `fix(…)`, `chore(…)`,
`docs(…)`, `refactor(…)`). El mensaje describe el cambio. Sin atribución
automática.
