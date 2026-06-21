import React, { useState, useEffect, useRef, useCallback } from "react";
import "./table.css";
import { Row } from "./interfaces/Row";
import { useTableSelection } from "./useTableSelection";
import { Header } from "./interfaces/Header";
import { ICell, TableProps, TableOptions } from "./interfaces/TableProps";
import { getHeadersFromRows, isWritableCharacter } from "./libs/tableHelp";

const Cell = ({ value, isSelected, columnName }: ICell) => (
  <td
    className={isSelected ? "selected" : ""}
    column-id={columnName}
    tabIndex={-1}
  >
    {value}
  </td>
);

const TableComponent = ({
  rows = [],
  headers = [],
  options = {},
}: TableProps) => {
  const noRowsText = options.noRowsText ? options.noRowsText : "No data";

  let rendersHeaders: Header[] = headers;
  if (rendersHeaders.length === 0 && options.HeadersAutoFill) {
    rendersHeaders = getHeadersFromRows(rows);
  }
  // State para manejar el contenido editado de la celda
  const [editedCellValues, setEditedCellValues] = useState<{
    [rowId: string]: { [columnId: string]: string };
  }>({});

  const tableRef = useRef<HTMLTableElement>(null);

  const [selectedCell, handleBodyTrClick] = useTableSelection(
    rows,
    rendersHeaders,
    tableRef
  );

  const isSelectedCell = useCallback(
    (cellId: string, expenseId: string) => {
      return selectedCell.trId === expenseId && selectedCell.columnId === cellId;
    },
    [selectedCell]
  );

  const renderRow = useCallback(
    (row: Row, rowHeaders: Header[]) => {
      return (
        <tr
          key={row.id}
          row-id={row.id}
          onClick={handleBodyTrClick}
          className={isSelectedCell("", row.id) ? "selected" : ""}
        >
          {rowHeaders.map((data) => {
            let cellValue = row[data.attributeName];
            if (editedCellValues[row.id]) {
              cellValue = editedCellValues[row.id][data.attributeName];
            }
            return (
              <Cell
                key={data.attributeName}
                value={cellValue}
                columnName={data.attributeName}
                isSelected={isSelectedCell(data.attributeName, row.id)}
              />
            );
          })}
        </tr>
      );
    },
    [isSelectedCell, handleBodyTrClick, editedCellValues]
  );

  //Handle edit
  useEffect(() => {
    function pressKey(event: KeyboardEvent) {
      const { key } = event;
      const trId = selectedCell.trId;
      const columnId = selectedCell.columnId;
      if (isWritableCharacter(event) && trId && columnId) {
        setEditedCellValues((lastCellValues) => {
          // Obtiene la fila actual del dataset original
          const currentRow = rows.find((x) => x.id === trId);

          // Valor base: el ya editado si existe, sino el del dataset original
          const baseRow = lastCellValues[trId] ?? currentRow;
          const currentValue = baseRow ? baseRow[columnId] ?? "" : "";
          const newRowValue = currentValue + key;

          // Copia inmutable de cada nivel tocado (no muta el estado previo)
          return {
            ...lastCellValues,
            [trId]: {
              ...(lastCellValues[trId] ?? currentRow),
              [columnId]: newRowValue,
            },
          };
        });
      }
    }

    const tableNode = tableRef.current;
    if (!tableNode) return;

    tableNode.addEventListener("keydown", pressKey);
    return () => {
      tableNode.removeEventListener("keydown", pressKey);
    };
  }, [selectedCell, editedCellValues, rows]);

  const renderRows = () => {
    return (
      <>
        {rows.length > 0 ? (
          rows.map((row) => renderRow(row, rendersHeaders))
        ) : (
          <tr>
            <td colSpan={rendersHeaders.length || 1} className="no-data">
              {noRowsText}
            </td>
          </tr>
        )}
      </>
    );
  };

  return (
    <table ref={tableRef} tabIndex={0} className="table">
      <thead>
        <tr>
          {rendersHeaders.length > 0 ? (
            rendersHeaders.map((x) => <th key={x.attributeName}>{x.displayText}</th>)
          ) : (
            <th>No headers. Consider adding autofill option</th>
          )}
        </tr>
      </thead>
      <tbody>{renderRows()}</tbody>
    </table>
  );
};

export default TableComponent;
