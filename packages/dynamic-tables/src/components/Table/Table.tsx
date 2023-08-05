import React, { useState, useEffect, useRef, useCallback } from "react";
import "./table.css";
import { Row } from "./interfaces/Row";
import { useTableSelection } from "./useTableSelection";
import { Header } from "./interfaces/Header";

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
  // State para manejar el contenido editado de la celda
  const [editedCellValues, setEditedCellValues] = useState<{
    [key: string]: string;
  }>({});

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
          {headers.map((data) => {
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
    [headers, isSelectedCell, handleBodyTrClick]
  );

  const isWritableCharacter = (key: string) => {
    // Comprueba si la key es una letra (mayúscula o minúscula), un símbolo o un número
    const letrasSimbolosYnumeros =
      /^[A-Za-z0-9!"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]$/;
    return letrasSimbolosYnumeros.test(key);
  };

  //Handle edit
  useEffect(() => {
    function pressKey({ key }: { key: string }) {
      if (
        isWritableCharacter(key) &&
        selectedCell.trId &&
        selectedCell.columnId
      ) {
        setEditedCellValues((lastCellValues) => {
          // Copia inmutable del objeto de valores editados
          const newCellValues = { ...lastCellValues };

          // Obtiene la fila actual
          const currentRow = rows.find((x) => x.id === selectedCell.trId);

          // Si la celda está en la lista de filas modificadas, toma el valor de allí
          if (newCellValues.hasOwnProperty(selectedCell.trId)) {
            let currentValue =
              newCellValues[selectedCell.trId][selectedCell.columnId];
            const newRowValue = currentValue + key;
            newCellValues[selectedCell.trId][selectedCell.columnId] =
              newRowValue;
          } else {
            let currentValue = currentRow[selectedCell.columnId];
            const newRowValue = currentValue + key;
            newCellValues[selectedCell.trId] = { ...currentRow };
            newCellValues[selectedCell.trId][selectedCell.columnId] =
              newRowValue;
          }

          return newCellValues;
        });
      }
    }

    window.addEventListener("keydown", pressKey);
    return () => {
      window.removeEventListener("keydown", pressKey);
    };
  }, [selectedCell, editedCellValues, rows]);

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
