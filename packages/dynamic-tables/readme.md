# Table Component

The Table Component is a React component that allows you to display data in a table format. It provides features for selecting and editing cells within the table. This component is designed to make it easy to display and interact with tabular data in your web applications.

## Installation

To use the Table Component in your React project, you can install it via npm or yarn:

```bash
npm install table-component
# or
yarn add table-component
```

## Usage

To use the Table Component in your React application, you can import it and include it in your component hierarchy. Here's an example of how to use it:

```jsx
import React from "react";
import TableComponent from "table-component";

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
import TableComponent from "table-component";

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
import TableComponent from "table-component";

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
import TableComponent from "table-component";

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
import TableComponent from "table-component";

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

### getCell

A utility function that can be used to retrieve a specific cell within the table.

```jsx
import { getCell } from "table-component";

const tableRef = React.createRef();
const cell = getCell(tableRef, "rowId", "columnId");
```
