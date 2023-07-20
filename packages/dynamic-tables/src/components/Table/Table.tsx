import React, { useState, useEffect, useRef, useCallback } from "react";
import "./table.css";

interface Row {
  id: string;
  [key: string]: string;
}

interface Header {
  attributeName: string;
  displayText: string;
}

interface TableProps {
  headers: Header[];
  rows: Row[];
}

interface SelectedCell {
  trId: string | null;
  columnId: string | null;
}

enum MovementKey {
  ArrowDown = 40,
  ArrowUp = 38,
  ArrowLeft = 37,
  ArrowRight = 39,
}

const isMovementKey = (keyCode: number) => {
  return Object.values(MovementKey).includes(keyCode);
};

const Cell = ({
  value,
  isSelected,
  columnName,
}: {
  value: string;
  columnName: string;
  isSelected: boolean;
}) => (
  <td className={isSelected ? "selected" : ""} column-id={columnName}>
    {value}
  </td>
);

const TableComponent = ({ rows, headers }: TableProps) => {
  const [selectedCell, setSelectedCell] = useState<SelectedCell>({
    trId: null,
    columnId: null,
  });
  const tableRef = useRef<HTMLTableElement>(null);

  const getNextIndex = useCallback(
    (
      rowIndex: number,
      keyCode: number,
      rowCount: number,
      columnId: string | null
    ) => {
      const columnIndex = headers.findIndex(
        (x) => x.attributeName === columnId
      );
      const columnLength = headers.length;
      let newColumnIndex;
      let nextRowIndex;

      if (keyCode === MovementKey.ArrowUp) {
        nextRowIndex = (rowIndex - 1 + rowCount) % rowCount;
        window.scrollBy(0, -50);
      } else if (keyCode === MovementKey.ArrowDown) {
        nextRowIndex = (rowIndex + 1) % rowCount;
        window.scrollBy(0, 50);
      } else if (keyCode === MovementKey.ArrowLeft) {
        newColumnIndex = (columnIndex - 1 + columnLength) % columnLength;
      } else if (keyCode === MovementKey.ArrowRight) {
        newColumnIndex = (columnIndex + 1) % columnLength;
      }

      const columnIdFinal =
        newColumnIndex !== undefined
          ? headers[newColumnIndex].attributeName
          : columnId;

      const finalIndex = nextRowIndex !== undefined ? nextRowIndex : rowIndex;
      return { nextRowIndex: finalIndex, columnId: columnIdFinal };
    },
    [headers]
  );

  const handleKey = useCallback(
    (event: KeyboardEvent) => {
      if (isMovementKey(event.keyCode) && selectedCell.trId !== null) {
        event.preventDefault();
        const rowIndex = rows.findIndex(
          (expense) => expense.id === selectedCell.trId
        );
        const { nextRowIndex, columnId } = getNextIndex(
          rowIndex,
          event.keyCode,
          rows.length,
          selectedCell.columnId
        );

        const nextExpense = rows[nextRowIndex];
        const nextCell = tableRef.current?.querySelector(
          `tr[row-id="${nextExpense.id}"] td[column-id="${columnId}"]`
        ) as HTMLTableCellElement | null;

        if (nextCell) {
          nextCell.focus();
          setSelectedCell({ trId: nextExpense.id, columnId });
        }
      }
    },
    [rows, selectedCell, getNextIndex]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("keydown", handleKey);
    };
  }, [handleKey]);

  const isSelectedCell = useCallback(
    (cellId: string, expenseId: string) => {
      return (
        selectedCell.trId === expenseId && selectedCell.columnId === cellId
      );
    },
    [selectedCell]
  );

  const handleBodyTrClick = useCallback(
    (event: React.MouseEvent<HTMLTableRowElement, MouseEvent>) => {
      const trId = event.currentTarget.getAttribute("row-id");
      const columnId = event.target.getAttribute("column-id");
      setSelectedCell({ columnId, trId });
    },
    []
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
