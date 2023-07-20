import React, { useState, useEffect, useRef } from "react";
import "./table.css";

export interface TableProps {
  rows: any;
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

const headers = [
  { attributeName: "name", displayText: "Nombre" },
  { attributeName: "description", displayText: "Descripcion" },
  { attributeName: "amount", displayText: "Cantidad" },
];

export default function ExpenseTableComponent({ rows }: TableProps) {
  const [selectedCell, setSelectedCell] = useState<SelectedCell>({
    trId: null,
    columnId: null,
  });
  const tableRef = useRef<HTMLTableElement>(null);

  const getNextIndex = (rowIndex, eventKey, expenseLength, columnId) => {
    const columnIndex = headers.findIndex((x) => x.attributeName === columnId);
    const columnLength = headers.length;
    let newColumnIndex;
    let nextIndex;
    if (eventKey === MovementKey.ArrowUp) {
      nextIndex = (rowIndex - 1 + expenseLength) % expenseLength;
      window.scrollBy(0, -50);
    } else if (eventKey === MovementKey.ArrowDown) {
      nextIndex = (rowIndex + 1) % expenseLength;
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
    const finalIndex = nextIndex !== undefined ? nextIndex : rowIndex;
    return { rowId: finalIndex, columnId: columnIdFinal };
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
        const { rowId, columnId } = getNextIndex(
          rowIndex,
          event.key,
          rows.length,
          selectedCell.columnId
        );
        const nextExpense = rows[rowId];
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

  const renderRow = (expense: any) => {
    return (
      <tr
        key={expense.id}
        row-id={expense.id}
        onClick={handleBodyTrClick}
        className={
          isSelectedCell(selectedCell, "", expense.id) ? "selected" : ""
        }
      >
        {headers.map((data) => (
          <td
            className={
              isSelectedCell(selectedCell, data.attributeName, expense.id)
                ? "selected"
                : ""
            }
            column-id={data.attributeName}
            key={data.attributeName}
          >
            {expense[data.attributeName]}
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
            <th> {x.displayText}</th>
          ))}
        </tr>
      </thead>
      <tbody>{rows.map(renderRow)}</tbody>
    </table>
  );
}
