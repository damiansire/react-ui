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

To use the Table Component in your React application, you can import it and include it in your component hierarchy:

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

## Customization

You can customize the appearance and behavior of the Table Component by modifying the CSS and extending the functionality as needed in your project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
