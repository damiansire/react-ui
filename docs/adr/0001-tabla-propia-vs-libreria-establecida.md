# 0001. Tabla propia (react-dynamic-tables) vs librería establecida

## Contexto

`react-dynamic-tables` es un componente de tabla editable con navegación e
edición por teclado. Existen alternativas maduras y ampliamente adoptadas
(TanStack Table, AG Grid, react-data-grid) que ya resuelven virtualización,
ordenamiento, filtrado y edición de celdas. Este ADR documenta por qué existe
una implementación propia en vez de envolver una de ellas, y en qué condiciones
convendría reconsiderar esa decisión.

## Comparación

| | react-dynamic-tables | TanStack Table | AG Grid | react-data-grid |
|---|---|---|---|---|
| Bundle (min+gzip) | ~7.8 KB (React y `@tanstack/react-virtual` externos) | ~15 KB (headless, sin UI) | Community: ~470 KB · Enterprise: más | ~60 KB |
| Virtualización (10k+ filas) | Sí, opt-in (`options.virtualized`, vía `@tanstack/virtual`) — 10k filas: ~144x más rápido al montar | No incluida (se compone con `@tanstack/virtual`) | Sí, nativa | Sí, nativa |
| Edición de celdas por teclado | Sí, es el foco del componente | No (headless, hay que construirlo) | Sí (Community) | Sí |
| Licencia | MIT (propio) | MIT | MIT (Community) / comercial (Enterprise) | MIT |
| Curva de adopción para consumidores | Cero dependencias externas de tabla | Requiere componer headless + UI propia | API grande, curva de aprendizaje mayor | API media |

## Decisión

Se mantiene la implementación propia por ahora. El motivo real no es técnico
sino de alcance: el componente resuelve un caso de uso específico (edición
tipo spreadsheet por teclado) que ninguna de las alternativas cubre "out of
the box" sin trabajo de composición equivalente. Adoptar TanStack Table headless
movería el problema (construir la UI de edición) sin eliminarlo.

## Lo que falta para que esta decisión sea defendible con datos, no solo con
## intuición

- ~~**ru-2**: benchmark de render con 10k+ filas y virtualización real~~ —
  **resuelto.** `options.virtualized` (vía `@tanstack/react-virtual`) monta solo
  las filas del viewport + overscan; benchmark real en
  `src/components/Table/virtualization.bench.test.ts`: 10.000 filas pasan de
  ~6768ms a ~47ms al montar (~144x), y de 10.000 nodos `<tr>` a un puñado fijo.
  La navegación por teclado (incluido el wraparound de flechas) sigue
  funcionando cruzando el límite virtualizado. Detalle y la tabla completa en
  el README del paquete, sección "Performance".
- Medir el bundle size real: el entry ESM (React externo, sin
  `@tanstack/react-virtual` inlineado) pesa ~7.8 KB gzip
  (`src/components/Table/bundle-budget.test.ts`, presupuesto 10 KB) — ya
  comparable a la fila "Bundle" de arriba, falta solo actualizar esa celda.
- **ru-6**: conseguir al menos un consumidor real fuera de este monorepo — sin
  eso, la comparación es hipotética.

## Alternativas descartadas

- **AG Grid Community**: bundle mucho más pesado (~470 KB) para un caso de uso
  que no necesita el 90% de sus features (pivoting, agrupamiento server-side).
- **react-data-grid**: más liviano, resuelve virtualización, pero su modelo de
  edición por teclado es más genérico y menos adaptado al flujo específico que
  motivó este componente.

## Consecuencias

`ru-2` (virtualización + benchmark) está cerrado con evidencia: la tabla ya
escala a datasets grandes sin pagar el costo de montar cada fila. Sigue
pendiente `ru-6` (un consumidor real fuera de este monorepo) para que la
comparación deje de ser hipotética del todo. Este documento se debe revisar
cuando eso se resuelva.
