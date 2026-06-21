import { useCallback, useEffect, useState } from "react";
import { Header } from "./interfaces/Header";
import { Row } from "./interfaces/Row";
import { getCell, getWrappedIndex } from "./libs/tableHelp";

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

const isMovementKey = (keyEvent: string): keyEvent is MovementKey => {
  return (Object.values(MovementKey) as string[]).includes(keyEvent);
};

export const useTableSelection = (
  rows: Row[],
  headers: Header[],
  tableRef: React.RefObject<HTMLTableElement>,
  isEditing = false
): [
  SelectedCell,
  (event: React.MouseEvent<HTMLTableRowElement, MouseEvent>) => void,
  React.Dispatch<React.SetStateAction<SelectedCell>>
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
        nextRowIndex = getWrappedIndex(currentRowIndex, -1, rowCount);
      } else if (eventKey === MovementKey.ArrowDown) {
        nextRowIndex = getWrappedIndex(currentRowIndex, 1, rowCount);
      } else if (eventKey === MovementKey.ArrowLeft) {
        newColumnIndex = getWrappedIndex(columnIndex, -1, columnLength);
      } else if (eventKey === MovementKey.ArrowRight) {
        newColumnIndex = getWrappedIndex(columnIndex, 1, columnLength);
      }

      const columnIdFinal =
        newColumnIndex !== undefined
          ? headers[newColumnIndex]?.attributeName ?? currentColumnId
          : currentColumnId;

      const finalIndex =
        nextRowIndex !== undefined ? nextRowIndex : currentRowIndex;
      return { nextRowIndex: finalIndex, columnId: columnIdFinal };
    },
    []
  );

  const handleKey = useCallback(
    (event: KeyboardEvent) => {
      // No interceptar la navegación mientras se edita una celda (el input
      // necesita las flechas para mover el caret).
      if (isEditing) return;
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
        if (!nextExpense || columnId === null) {
          return;
        }
        const nextCell = getCell(tableRef, nextExpense.id, columnId);

        if (nextCell) {
          nextCell.focus();
          // Mantener la celda visible sin scrollear toda la ventana
          // (reemplaza el `window.scrollBy` global e impredecible).
          if (typeof nextCell.scrollIntoView === "function") {
            nextCell.scrollIntoView({ block: "nearest", inline: "nearest" });
          }
          setSelectedCell({ trId: nextExpense.id, columnId });
        }
      }
    },
    [rows, selectedCell, headers, getNextIndex, tableRef, isEditing]
  );

  useEffect(() => {
    const tableNode = tableRef.current;
    if (!tableNode) return;

    tableNode.addEventListener("keydown", handleKey);
    return () => {
      tableNode.removeEventListener("keydown", handleKey);
    };
  }, [handleKey, tableRef]);

  const handleBodyTrClick = useCallback(
    (event: React.MouseEvent<HTMLTableRowElement, MouseEvent>) => {
      const trId = event.currentTarget.getAttribute("row-id");
      const columnId = (event.target as HTMLElement).getAttribute("column-id");
      setSelectedCell({ columnId, trId });
    },
    []
  );

  return [selectedCell, handleBodyTrClick, setSelectedCell];
};
