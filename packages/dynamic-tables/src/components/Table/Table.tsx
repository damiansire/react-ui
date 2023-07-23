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

  const isWritableCharacter = (key: string) => {
    // Comprueba si la key es una letra (mayúscula o minúscula), un símbolo o un número
    const letrasSimbolosYnumeros =
      /^[A-Za-z0-9!"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]$/;
    return letrasSimbolosYnumeros.test(key);
  };

  // State para manejar el contenido editado de la celda
  const [editedCellValue, setEditedCellValue] = useState<string | null>(null);

  //Handle edit
  useEffect(() => {
    function pressKey({ key }: { key: string }) {
      if (
        isWritableCharacter(key) &&
        selectedCell.trId &&
        selectedCell.columnId
      ) {
        // Establece el contenido editado solo si hay una celda seleccionada
        setEditedCellValue(key);
      }
    }

    function updateCellValue() {
      if (editedCellValue !== null) {
        // Aquí puedes manejar la actualización del contenido de la celda en tu estado o enviarlo a la API, etc.
        // Por ahora, actualicemos solo el valor de la celda seleccionada en el estado del componente
        // Esto dependerá de cómo tengas estructurado el estado para tus celdas en la tabla.
        // Reemplaza 'selectedCell.trId' y 'selectedCell.columnId' con las propiedades correctas en tu estado.
        // E.g., `selectedCell.trId` sería el ID de la fila seleccionada y `selectedCell.columnId` el nombre de la columna.
        console.log(
          "Celda actualizada:",
          selectedCell.trId,
          selectedCell.columnId,
          editedCellValue
        );
        setEditedCellValue(null);
      }
    }

    window.addEventListener("keydown", pressKey);
    window.addEventListener("keyup", updateCellValue);
    return () => {
      window.removeEventListener("keydown", pressKey);
      window.removeEventListener("keyup", updateCellValue);
    };
  }, [selectedCell, editedCellValue]);

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
