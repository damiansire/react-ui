import React, { useState, useEffect, useRef } from "react";
import "./table.css";

interface Row {
  id: string;
  [key: string]: string; // Dynamic key-value pairs for each column
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

interface SelectedCell {
  trId: string | null;
  columnId: string | null;
}

const TableComponent = ({ rows, headers }: TableProps) => {
  const [selectedCell, setSelectedCell] = useState<SelectedCell>({
    trId: null,
    columnId: null,
  });
  const tableRef = useRef<HTMLTableElement>(null);

  const getNextIndex = (rowIndex, eventKey, expenseLength, columnId) => {
    const columnIndex = headers.findIndex((x) => x.attributeName === columnId);
    const columnLength = headers.length;
    let newColumnIndex;
    let nextRowIndex;
    if (eventKey === MovementKey.ArrowUp) {
      nextRowIndex = (rowIndex - 1 + expenseLength) % expenseLength;
      window.scrollBy(0, -50);
    } else if (eventKey === MovementKey.ArrowDown) {
      nextRowIndex = (rowIndex + 1) % expenseLength;
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
  };

  const isMovementKey = (keyEvent: string) => {
    return Object.values(MovementKey).includes(keyEvent);
  };

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
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
    };

    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("keydown", handleKey);
    };
  }, [rows, selectedCell]);

  const isSelectedCell = (
    selectedCell: SelectedCell,
    cellId: string,
    expenseId: string
  ) => {
    return selectedCell.trId === expenseId && selectedCell.columnId === cellId;
  };

  const handleBodyTrClick = (event: React.MouseEvent<HTMLTableRowElement>) => {
    const trId = event.currentTarget.getAttribute("row-id");
    const columnId = event.target.getAttribute("column-id");
    setSelectedCell({ columnId, trId });
  };

  const renderRow = (row: any) => {
    return (
      <tr
        key={row.id}
        row-id={row.id}
        onClick={handleBodyTrClick}
        className={isSelectedCell(selectedCell, "", row.id) ? "selected" : ""}
      >
        {headers.map((data) => (
          <td
            className={
              isSelectedCell(selectedCell, data.attributeName, row.id)
                ? "selected"
                : ""
            }
            column-id={data.attributeName}
            key={data.attributeName}
          >
            {row[data.attributeName]}
          </td>
        ))}
      </tr>
    );
  };

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

export default TableComponent;
