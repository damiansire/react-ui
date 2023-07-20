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
  ArrowDown = "ArrowDown",
  ArrowUp = "ArrowUp",
  ArrowLeft = "ArrowLeft",
  ArrowRight = "ArrowRight",
}

const isMovementKey = (keyEvent: string) => {
  return Object.values(MovementKey).includes(keyEvent);
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
      eventKey: any,
      rowCount: number,
      columnId: string | null
    ) => {
      const columnIndex = headers.findIndex(
        (x) => x.attributeName === columnId
      );
      const columnLength = headers.length;
      let newColumnIndex;
      let nextRowIndex;

      if (eventKey === MovementKey.ArrowUp) {
        nextRowIndex = (rowIndex - 1 + rowCount) % rowCount;
        window.scrollBy(0, -50);
      } else if (eventKey === MovementKey.ArrowDown) {
        nextRowIndex = (rowIndex + 1) % rowCount;
        window.scrollBy(0, 50);
      } else if (eventKey === MovementKey.ArrowLeft) {
        newColumnIndex = (columnIndex - 1 + columnLength) % columnLength;
      } else if (eventKey === MovementKey.ArrowRight) {
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
      if (isMovementKey(event.key) && selectedCell.trId !== null) {
        event.preventDefault();
        const rowIndex = rows.findIndex(
          (expense) => expense.id === selectedCell.trId
        );
        const { nextRowIndex, columnId } = getNextIndex(
          rowIndex,
          event.key,
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
