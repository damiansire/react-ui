import React, { useState, useEffect, useRef, useCallback } from "react";
import "./table.css";
import { Row } from "./interfaces/Row";
import { useTableSelection } from "./useTableSelection";

interface TableProps {
  headers: Header[];
  rows: Row[];
}

interface ICell {
  value: string;
  columnName: string;
  isSelected: boolean;
}

const Cell = ({ value, isSelected, columnName }: ICell) => (
  <td className={isSelected ? "selected" : ""} column-id={columnName}>
    {value}
  </td>
);

const TableComponent = ({ rows, headers }: TableProps) => {
  const tableRef = useRef<HTMLTableElement>(null);

  const [selectedCell, handleKey, handleBodyTrClick] = useTableSelection(
    rows,
    headers,
    tableRef
  );

  const isSelectedCell = useCallback(
    (cellId: string, expenseId: string) => {
      return (
        selectedCell.trId === expenseId && selectedCell.columnId === cellId
      );
    },
    [selectedCell]
  );

  const renderRow = useCallback(
    (row: Row) => {
      return (
        <tr
          key={row.id}
          row-id={row.id}
          onClick={handleBodyTrClick}
          className={isSelectedCell("", row.id) ? "selected" : ""}
        >
          {headers.map((data) => (
            <Cell
              key={data.attributeName}
              value={row[data.attributeName]}
              columnName={data.attributeName}
              isSelected={isSelectedCell(data.attributeName, row.id)}
            />
          ))}
        </tr>
      );
    },
    [headers, isSelectedCell, handleBodyTrClick]
  );

  return (
    <table ref={tableRef}>
      <thead>
        <tr>
          {headers.map((x) => (
            <th key={x.attributeName}>{x.displayText}</th>
          ))}
        </tr>
      </thead>
      <tbody>{rows.map(renderRow)}</tbody>
    </table>
  );
};

TableComponent.defaultProps = {
  headers: [],
  rows: [],
};

export default TableComponent;
