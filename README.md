# react-ui

Componentes de UI de React reutilizables, organizados como un monorepo de
npm workspaces. Cada paquete se publica en npm bajo su propio nombre, pero
todos evolucionan juntos en este repositorio.

## Paquetes

| Paquete | npm | Qué hace |
|---|---|---|
| [`dynamic-tables`](packages/dynamic-tables) | [`react-dinamic-tables`](https://www.npmjs.com/package/react-dinamic-tables) | Tablas dinámicas e interactivas con selección y edición de celdas por teclado. |

---

## `react-dinamic-tables`

Componente `Table` que renderiza datos tabulares y permite **seleccionar** y
**editar** celdas directamente con el teclado. Pensado para mostrar e interactuar
con datos en aplicaciones web, con buen soporte de accesibilidad
(`role="grid"`, `aria-selected`, estado anunciado vía `aria-live`).

### Instalación

```bash
npm i react-dinamic-tables
```

> Requiere `react` y `react-dom` 18 como _peer dependencies_.

### Uso

El componente recibe `headers` (definición de columnas), `rows` (datos) y un
objeto opcional `options`.

```jsx
import React from "react";
import { Table } from "react-dinamic-tables";

const headers = [
  { attributeName: "name", displayText: "Nombre" },
  { attributeName: "description", displayText: "Descripción" },
  { attributeName: "amount", displayText: "Cantidad" },
];

const rows = [
  { id: "1", name: "Item 1", description: "Descripción 1", amount: 10.99 },
  { id: "2", name: "Item 2", description: "Descripción 2", amount: 5.49 },
  { id: "3", name: "Item 3", description: "Descripción 3", amount: 20.0 },
];

export default function App() {
  return <Table headers={headers} rows={rows} />;
}
```

`Table` también está disponible como _default export_:

```jsx
import Table from "react-dinamic-tables";
```

### Props principales

| Prop | Tipo | Descripción |
|---|---|---|
| `headers` | `Header[]` | Columnas a renderizar. Cada `Header` es `{ attributeName, displayText }`: `attributeName` es la clave en cada fila y `displayText` el texto del encabezado. |
| `rows` | `Row[]` | Datos. Cada `Row` debe tener un `id` único; el resto de claves se mapean por `attributeName`. |
| `options` | `TableOptions` | Configuración opcional (ver abajo). |

`TableOptions`:

| Opción | Tipo | Descripción |
|---|---|---|
| `noRowsText` | `string` | Mensaje cuando no hay filas (por defecto `"No data"`). |
| `HeadersAutoFill` | `boolean` | Si es `true` y `headers` está vacío, genera las columnas automáticamente a partir de las claves de las filas. |
| `label` | `string` | Etiqueta accesible de la tabla (`aria-label`). |
| `onCellEdit` | `(rowId, columnId, value) => void` | Se invoca al confirmar la edición de una celda. Es la forma de leer hacia afuera lo que el usuario editó. |

### Interacción por teclado

- Clic en una fila o navegación enfoca y selecciona la celda.
- Empezar a tipear un carácter imprimible abre el editor reemplazando el valor.
- `Enter` sobre la celda seleccionada abre el editor con el valor actual.
- `Backspace` / `Delete` abren el editor vaciando la celda (para borrar).
- `Enter` confirma la edición; `Escape` la cancela.
- Para leer lo editado, pasá `options.onCellEdit(rowId, columnId, value)`.

### Generar columnas automáticamente

```jsx
<Table
  rows={rows}
  options={{ HeadersAutoFill: true, noRowsText: "Sin datos por ahora" }}
/>
```

### Utilidad `getCell`

Recupera una celda concreta a partir de una `ref` de la tabla:

```jsx
import { getCell } from "react-dinamic-tables";

const tableRef = React.useRef(null);
const cell = getCell(tableRef, "rowId", "columnId");
```

## Stack

- **React 18** + **TypeScript**
- **Rollup** para el _build_ de la librería (ESM + CJS + `.d.ts`)
- **Storybook** para el desarrollo y la documentación visual de los componentes

---

> **Nota:** el nombre publicado en npm es `react-dinamic-tables` (con el typo
> "dinamic" en lugar de "dynamic"). Los ejemplos de instalación usan el nombre
> real publicado a propósito.
