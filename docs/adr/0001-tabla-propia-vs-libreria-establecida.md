# 0001. Tabla propia (react-dinamic-tables) vs librería establecida

## Contexto

`react-dinamic-tables` es un componente de tabla editable con navegación e
edición por teclado. Existen alternativas maduras y ampliamente adoptadas
(TanStack Table, AG Grid, react-data-grid) que ya resuelven virtualización,
ordenamiento, filtrado y edición de celdas. Este ADR documenta por qué existe
una implementación propia en vez de envolver una de ellas, y en qué condiciones
convendría reconsiderar esa decisión.

## Comparación

| | react-dinamic-tables | TanStack Table | AG Grid | react-data-grid |
|---|---|---|---|---|
| Bundle (min+gzip) | ~pendiente de medir (ver ru-2) | ~15 KB (headless, sin UI) | Community: ~470 KB · Enterprise: más | ~60 KB |
| Virtualización (10k+ filas) | **No implementada** (ver ru-2) | No incluida (se compone con `@tanstack/virtual`) | Sí, nativa | Sí, nativa |
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

- **ru-2**: benchmark de render con 10k+ filas y virtualización real — hoy no
  hay evidencia de que el componente escale más allá de datasets chicos, que es
  justamente donde AG Grid/react-data-grid ya tienen resuelto el problema.
- Medir el bundle size real (hoy no está documentado) y compararlo contra la
  fila de arriba.
- **ru-6**: conseguir al menos un consumidor real fuera de este monorepo — sin
  eso, la comparación es hipotética.

## Alternativas descartadas

- **AG Grid Community**: bundle mucho más pesado (~470 KB) para un caso de uso
  que no necesita el 90% de sus features (pivoting, agrupamiento server-side).
- **react-data-grid**: más liviano, resuelve virtualización, pero su modelo de
  edición por teclado es más genérico y menos adaptado al flujo específico que
  motivó este componente.

## Consecuencias

Mientras no se cierre `ru-2` (virtualización + benchmark), la elección de
mantener una implementación propia sigue siendo una apuesta sin evidencia de
que escale mejor —o peor— que las alternativas maduras. Este documento se
debe revisar cuando eso se resuelva.
