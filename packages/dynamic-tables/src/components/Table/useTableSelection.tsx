import { useCallback, useEffect, useRef, useState } from "react";
import { Header } from "./interfaces/Header";
import { Row } from "./interfaces/Row";
import { getCell } from "./libs/tableHelp";

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
      currentRowIndex: number,
      eventKey: string,
      rowCount: number,
      currentColumnId: string | null,
      headers: Header[]
    ) => {
      const columnIndex = headers.findIndex(
        (x) => x.attributeName === currentColumnId
      );
      const columnLength = headers.length;
      let newColumnIndex;
      let nextRowIndex;

      if (eventKey === MovementKey.ArrowUp) {
        nextRowIndex = (currentRowIndex - 1 + rowCount) % rowCount;
        window.scrollBy(0, -50);
      } else if (eventKey === MovementKey.ArrowDown) {
        nextRowIndex = (currentRowIndex + 1) % rowCount;
        window.scrollBy(0, 50);
      } else if (eventKey === MovementKey.ArrowLeft) {
        newColumnIndex = (columnIndex - 1 + columnLength) % columnLength;
      } else if (eventKey === MovementKey.ArrowRight) {
        newColumnIndex = (columnIndex + 1) % columnLength;
      }

      const columnIdFinal =
        newColumnIndex !== undefined
          ? headers[newColumnIndex].attributeName
          : currentColumnId;

      const finalIndex =
        nextRowIndex !== undefined ? nextRowIndex : currentRowIndex;
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
          selectedCell.columnId,
          headers
        );

        const nextExpense = rows[nextRowIndex];
        const nextCell = getCell(tableRef, nextExpense.id, columnId);

        if (nextCell) {
          nextCell.focus();
          setSelectedCell({ trId: nextExpense.id, columnId });
        }
      }
    },
    [rows, selectedCell]
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
      const columnId = (event.target as HTMLElement).getAttribute("column-id");
      setSelectedCell({ columnId, trId });
    },
    []
  );

  return [selectedCell, handleKey, handleBodyTrClick];
};
