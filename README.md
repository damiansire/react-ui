# react-ui

Reusable React UI components, organized as an npm-workspaces monorepo. Each
package is published to npm under its own name, but they all evolve together in
this repository.

## Packages

| Package | npm | What it does |
|---|---|---|
| [`dynamic-tables`](packages/dynamic-tables) | [`react-dinamic-tables`](https://www.npmjs.com/package/react-dinamic-tables) | Dynamic, interactive tables with keyboard-driven cell selection and editing. |

---

## `react-dinamic-tables`

A `Table` component that renders tabular data and lets you **select** and
**edit** cells directly with the keyboard. Built to display and interact with
data in web apps, with solid accessibility support (`role="grid"`,
`aria-selected`, state announced via `aria-live`).

### Installation

```bash
npm i react-dinamic-tables
```

> Requires `react` and `react-dom` 18 as _peer dependencies_.

### Usage

The component takes `headers` (column definitions), `rows` (data), and an
optional `options` object.

```jsx
import React from "react";
import { Table } from "react-dinamic-tables";

const headers = [
  { attributeName: "name", displayText: "Name" },
  { attributeName: "description", displayText: "Description" },
  { attributeName: "amount", displayText: "Amount" },
];

const rows = [
  { id: "1", name: "Item 1", description: "Description 1", amount: 10.99 },
  { id: "2", name: "Item 2", description: "Description 2", amount: 5.49 },
  { id: "3", name: "Item 3", description: "Description 3", amount: 20.0 },
];

export default function App() {
  return <Table headers={headers} rows={rows} />;
}
```

`Table` is also available as a _default export_:

```jsx
import Table from "react-dinamic-tables";
```

### Main props

| Prop | Type | Description |
|---|---|---|
| `headers` | `Header[]` | Columns to render. Each `Header` is `{ attributeName, displayText }`: `attributeName` is the key in each row and `displayText` is the header text. |
| `rows` | `Row[]` | The data. Each `Row` must have a unique `id`; the remaining keys are mapped by `attributeName`. |
| `options` | `TableOptions` | Optional configuration (see below). |

`TableOptions`:

| Option | Type | Description |
|---|---|---|
| `noRowsText` | `string` | Message shown when there are no rows (defaults to `"No data"`). |
| `HeadersAutoFill` | `boolean` | If `true` and `headers` is empty, columns are generated automatically from the rows' keys. |
| `label` | `string` | Accessible label for the table (`aria-label`). |
| `onCellEdit` | `(rowId, columnId, value) => void` | Called when a cell edit is confirmed. This is how you read out what the user edited. |

### Keyboard interaction

- Clicking a row or navigating focuses and selects the cell.
- Typing a printable character opens the editor, replacing the value.
- `Enter` on the selected cell opens the editor with the current value.
- `Backspace` / `Delete` open the editor with the cell cleared (to delete).
- `Enter` confirms the edit; `Escape` cancels it.
- To read the edited value, pass `options.onCellEdit(rowId, columnId, value)`.

### Auto-generating columns

```jsx
<Table
  rows={rows}
  options={{ HeadersAutoFill: true, noRowsText: "No data yet" }}
/>
```

### `getCell` utility

Retrieves a specific cell from a table `ref`:

```jsx
import { getCell } from "react-dinamic-tables";

const tableRef = React.useRef(null);
const cell = getCell(tableRef, "rowId", "columnId");
```

## Stack

- **React 18** + **TypeScript**
- **Rollup** for the library _build_ (ESM + CJS + `.d.ts`)
- **Storybook** for development and visual documentation of the components

---

> **Note:** the name published on npm is `react-dinamic-tables` (with the typo
> "dinamic" instead of "dynamic"). The installation examples use the real
> published name on purpose.
