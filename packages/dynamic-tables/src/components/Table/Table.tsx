import React, { useState, useEffect, useRef, useCallback } from "react";
import "./table.css";
import { Row } from "./interfaces/Row";
import { useTableSelection } from "./useTableSelection";
import { Header } from "./interfaces/Header";
import { ICell, TableProps, TableOptions } from "./interfaces/TableProps";

interface NewCell {
  trId: string;
  columnId: string;
}

const Cell = ({ value, isSelected, columnName }: ICell) => (
  <td className={isSelected ? "selected" : ""} column-id={columnName}>
    {value}
  </td>
);

const getHeadersFromRows = (rows: Row[]): Header[] => {
  const headersSet = rows.reduce((accumulator, currentValue) => {
    Object.keys(currentValue).forEach((key) => {
      accumulator.add(key);
    });
    return accumulator;
  }, new Set<string>());

  const headersArray = Array.from(headersSet);

  // Mapear el array de claves en un array de objetos Header
  const headerObjects: Header[] = headersArray.map((attributeName) => ({
    attributeName,
    displayText: attributeName, // Puedes establecer el valor predeterminado
  }));

  return headerObjects;
};

const TableComponent = ({ rows, headers, options }: TableProps) => {
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

  const [selectedCell, handleKey, handleBodyTrClick] = useTableSelection(
    rows,
    headers,
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

  const isWritableCharacter = (event: KeyboardEvent) => {
    // Acepta cualquier carácter imprimible (incluido el espacio y Unicode);
    // descarta teclas de control y combinaciones con modificadores.
    return (
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    );
  };

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

    window.addEventListener("keydown", pressKey);
    return () => {
      window.removeEventListener("keydown", pressKey);
    };
  }, [selectedCell, editedCellValues, rows]);

  const renderRows = () => {
    return (
      <>
        {rows.length > 0 ? (
          rows.map((row) => renderRow(row, rendersHeaders))
        ) : (
          <tr>
            <td colSpan={headers.length} className="no-data">
              {noRowsText}
            </td>
          </tr>
        )}
      </>
    );
  };

  return (
    <table ref={tableRef}>
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

TableComponent.defaultProps = {
  headers: [],
  rows: [],
  options: {},
};

export default TableComponent;
