# Table Component

The Table Component is a React component that allows you to display data in a table format. It provides features for selecting and editing cells within the table. This component is designed to make it easy to display and interact with tabular data in your web applications.

## Installation

To use the Table Component in your React project, you can install it via npm or yarn:

```bash
npm install react-dynamic-tables
# or
yarn add react-dynamic-tables
```

## Usage

To use the Table Component in your React application, you can import it and include it in your component hierarchy. Here's an example of how to use it:

```jsx
import React from "react";
import TableComponent from "react-dynamic-tables";

function App() {
  const headers = [
    { attributeName: "name", displayText: "Name" },
    { attributeName: "description", displayText: "Description" },
    { attributeName: "amount", displayText: "Amount" },
  ];

  const data = [
    {
      id: "1",
      name: "Item 1",
      description: "Description of Item 1",
      amount: 10.99,
    },
    // ... Add more data
  ];

  return (
    <div>
      <h1>Table Example</h1>
      <TableComponent headers={headers} rows={data} />
    </div>
  );
}

export default App;
```

## Features

- Display tabular data with customizable headers.
- Allow selection of cells within the table.
- Edit cell content by typing.
- Handles keyboard navigation within the table.

### New Features

- **Empty Table Message**: You can now display a custom message when the table is empty. We will use the `EmptyTableMessage` story to demonstrate it:

```jsx
import React from "react";
import TableComponent from "react-dynamic-tables";

function App() {
  const headers = [
    { attributeName: "name", displayText: "Name" },
    { attributeName: "description", displayText: "Description" },
    { attributeName: "amount", displayText: "Amount" },
  ];

  const data = []; // Empty table

  return (
    <div>
      <h1>Empty Table Message Example</h1>
      <TableComponent headers={headers} rows={data} />
    </div>
  );
}

export default App;
```

In this example, the table is empty, and no custom message is displayed. Use the `EmptyTableMessage` story to see how a message is shown when the table is empty.

- **Custom Empty Table Message**: You can customize the message displayed when there are no rows in the table. We will use the `CustomEmptyTableMessage` story to demonstrate it:

```jsx
import React from "react";
import TableComponent from "react-dynamic-tables";

function App() {
  const headers = [
    { attributeName: "name", displayText: "Name" },
    { attributeName: "description", displayText: "Description" },
    { attributeName: "amount", displayText: "Amount" },
  ];

  const data = []; // Empty table

  // Customize the empty table message
  const options = {
    noRowsText: "Hey, check your data, there are no rows.",
  };

  return (
    <div>
      <h1>Custom Empty Table Message Example</h1>
      <TableComponent headers={headers} rows={data} options={options} />
    </div>
  );
}

export default App;
```

In this example, we have defined a custom message in the `noRowsText` option. When the table is empty, the custom message is displayed.

- **No Headers**: You can display a table without headers by providing an empty array for the `headers` prop. Here's an example:

```jsx
import React from "react";
import TableComponent from "react-dynamic-tables";

function App() {
  const headers = []; // Empty array, no headers

  const data = [
    {
      id: "1",
      name: "Item 1",
      description: "Description of Item 1",
      amount: 10.99,
    },
    // ... Add more data
  ];

  return (
    <div>
      <h1>No Headers Example</h1>
      <TableComponent headers={headers} rows={data} />
    </div>
  );
}

export default App;
```

In this example, we provided an empty array for `headers`, resulting in a table without headers.

- **Headers Auto-Fill**: You can automatically generate headers based on the data in your table by setting the `HeadersAutoFill` option to `true`. Here's an example:

```jsx
import React from "react";
import TableComponent from "react-dynamic-tables";

function App() {
  const headers = []; // Empty array

  const data = [
    {
      id: "1",
      name: "Item 1",
      description: "Description of Item 1",
      amount: 10.99,
    },
    // ... Add more data
  ];

  // Enable automatic header generation
  const options = {
    HeadersAutoFill: true,
  };

  return (
    <div>
      <h1>Headers Auto-Fill Example</h1>
      <TableComponent headers={headers} rows={data} options={options} />
    </div>
  );
}

export default App;
```

In this example, we have enabled automatic header generation with the `HeadersAutoFill` option. Headers are automatically generated based on the data in the table.

## API

### TableComponent

- `headers`: An array of header objects that define the column headers of the table.
- `rows`: An array of data objects, each representing a row in the table.
- `options`: Optional configuration object:
  - `noRowsText` (`string`): custom message shown when there are no rows.
  - `HeadersAutoFill` (`boolean`): when `true` and `headers` is empty, the column
    headers are generated automatically from the keys of the row data.
  - `onCellEdit` (`(rowId, columnId, value) => void`): called when a cell edit is
    committed. This is how you read back what the user edited.
  - `sortable` (`boolean`): when `true`, each column header becomes a button that
    cycles unsorted → ascending → descending → unsorted. Numeric columns (including
    numeric strings like `"10"`) sort numerically; everything else sorts as text.
    The sort is stable and non-destructive — a third click restores the original
    row order. Sorting reorders the displayed rows only; committed edits are keyed
    by row id, so they follow their row across sorts. The active column exposes
    `aria-sort` for screen readers.
  - `virtualized` (`boolean`): when `true`, only the rows inside the visible
    viewport (+ overscan) are mounted to the DOM, via
    [`@tanstack/react-virtual`](https://tanstack.com/virtual). Opt-in: it changes
    the table's scroll container from the document to a fixed-height `<div>`. See
    [Performance](#performance) below for real numbers and the other three options
    it comes with (`rowHeight`, `height`, `overscan`).
  - `rowHeight` (`number`): px height per row, used by the virtualizer to estimate
    total scroll size. Only relevant when `virtualized` is `true`. Default: `37`.
  - `height` (`number`): px height of the scrollable viewport when `virtualized`
    is `true`. Default: `400`.
  - `overscan` (`number`): extra rows rendered outside the visible viewport
    (above/below), so fast scroll and keyboard navigation don't show blank gaps
    while the DOM catches up. Only relevant when `virtualized` is `true`. Default: `6`.

## Performance

Without `options.virtualized`, every row in `rows` is mounted to the DOM — fine
for small datasets, but it doesn't scale. With it, only the rows inside the
viewport (+ overscan) are ever mounted, regardless of how large `rows` is.
Keyboard navigation (arrows, wraparound) still works across the virtualized
boundary: moving to a row outside the mounted window scrolls it into view first,
then focuses it once it mounts.

Real benchmark (`src/components/Table/virtualization.bench.test.ts`, measured
with `performance.now()` around the full mount, jsdom/Vitest on this machine —
absolute numbers vary by environment, but the *ratio* is the point):

| Rows   | Without `virtualized` | With `virtualized` |
| ------ | ---------------------- | ------------------- |
| 10,000 | ~6768 ms                | ~47 ms               |

That's roughly a **144x** reduction in mount time, and the DOM node count drops
from 10,000 `<tr>` elements to a couple dozen (viewport + overscan) regardless of
dataset size.

```jsx
<TableComponent
  headers={headers}
  rows={tenThousandRows}
  options={{ virtualized: true, rowHeight: 37, height: 400 }}
/>
```

### getCell

A utility function that can be used to retrieve a specific cell within the table.

```jsx
import { getCell } from "react-dynamic-tables";

const tableRef = React.createRef();
const cell = getCell(tableRef, "rowId", "columnId");
```
