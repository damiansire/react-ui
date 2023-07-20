import { useCallback, useEffect, useRef, useState } from "react";
import { Header } from "./interfaces/Header";
import { Row } from "./interfaces/Row";

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

export const useTableSelection = (
  rows: Row[],
  headers: Header[],
  tableRef: React.RefObject<HTMLTableElement>
): [
  SelectedCell,
  (event: KeyboardEvent) => void,
  (event: React.MouseEvent<HTMLTableRowElement, MouseEvent>) => void
] => {
  const [selectedCell, setSelectedCell] = useState<SelectedCell>({
    trId: null,
    columnId: null,
  });

  const getNextIndex = useCallback(
    (
      rowIndex: number,
      eventKey: string,
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

  const handleBodyTrClick = useCallback(
    (event: React.MouseEvent<HTMLTableRowElement, MouseEvent>) => {
      const trId = event.currentTarget.getAttribute("row-id");
      const columnId = event.target.getAttribute("column-id");
      setSelectedCell({ columnId, trId });
    },
    []
  );

  return [selectedCell, handleKey, handleBodyTrClick];
};
