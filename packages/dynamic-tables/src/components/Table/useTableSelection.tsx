import { useCallback, useEffect, useMemo, useState } from "react";
import type { Header } from "./interfaces/Header";
import type { Row } from "./interfaces/Row";
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

/** Subconjunto de la API de `@tanstack/react-virtual` que necesita este hook:
 * pedirle al virtualizador que traiga un índice de fila a la vista. */
export interface RowVirtualizerLike {
  scrollToIndex: (index: number, options?: { align?: "auto" | "start" | "center" | "end" }) => void;
}

// Cuántos frames reintentar el foco tras pedirle al virtualizador que traiga
// la fila a la vista, antes de resignarse (la fila tardó demasiado en montar).
const MAX_VIRTUAL_FOCUS_RETRIES = 15;

export const useTableSelection = (
  rows: Row[],
  headers: Header[],
  tableRef: React.RefObject<HTMLTableElement>,
  isEditing = false,
  rowVirtualizer?: RowVirtualizerLike
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

  // Índice fila → posición. Evita un `findIndex` lineal en cada tecla.
  const rowIndexById = useMemo(() => {
    const index = new Map<string, number>();
    rows.forEach((row, position) => index.set(row.id, position));
    return index;
  }, [rows]);

  const handleKey = useCallback(
    (event: KeyboardEvent) => {
      // No interceptar la navegación mientras se edita una celda (el input
      // necesita las flechas para mover el caret).
      if (isEditing) return;
      // El listener está en el <table> y recibe todo por burbujeo: lo que nace
      // en el <thead> no es navegación de celdas.
      const eventTarget = event.target;
      if (
        eventTarget instanceof HTMLElement &&
        eventTarget.closest("thead") !== null
      ) {
        return;
      }
      if (isMovementKey(event.key) && selectedCell.trId !== null) {
        event.preventDefault();
        const rowIndex = rowIndexById.get(selectedCell.trId) ?? -1;
        const { nextRowIndex, columnId } = getNextIndex(
          rowIndex,
          event.key,
          rows.length,
          selectedCell.columnId,
          headers
        );

        const nextRow = rows[nextRowIndex];
        if (!nextRow || columnId === null) {
          return;
        }
        const nextCell = getCell(tableRef, nextRow.id, columnId);

        if (nextCell) {
          nextCell.focus();
          // Mantener la celda visible sin scrollear toda la ventana
          // (reemplaza el `window.scrollBy` global e impredecible).
          if (typeof nextCell.scrollIntoView === "function") {
            nextCell.scrollIntoView({ block: "nearest", inline: "nearest" });
          }
          setSelectedCell({ trId: nextRow.id, columnId });
        } else if (rowVirtualizer) {
          // La fila destino no está montada (tabla virtualizada, fuera del
          // viewport renderizado). Actualizamos la selección igual —así el
          // status aria-live y el resaltado quedan consistentes de inmediato—
          // y le pedimos al virtualizador que la traiga a la vista. El nodo
          // real tarda un ciclo de render en aparecer, así que reintentamos el
          // foco en frames sucesivos (acotado) hasta que exista.
          setSelectedCell({ trId: nextRow.id, columnId });
          rowVirtualizer.scrollToIndex(nextRowIndex, { align: "auto" });

          let attempts = 0;
          const tryFocus = () => {
            const settledCell = getCell(tableRef, nextRow.id, columnId);
            if (settledCell) {
              settledCell.focus();
              if (typeof settledCell.scrollIntoView === "function") {
                settledCell.scrollIntoView({
                  block: "nearest",
                  inline: "nearest",
                });
              }
              return;
            }
            attempts += 1;
            if (attempts < MAX_VIRTUAL_FOCUS_RETRIES) {
              requestAnimationFrame(tryFocus);
            }
          };
          requestAnimationFrame(tryFocus);
        }
      }
    },
    [
      rows,
      rowIndexById,
      selectedCell,
      headers,
      getNextIndex,
      tableRef,
      isEditing,
      rowVirtualizer,
    ]
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
      // El `column-id` vive en el <td>, no en sus hijos: leerlo del target
      // directo daba null al clickear el input y borraba la selección.
      const target = event.target as HTMLElement | null;
      const cell = target?.closest("td[column-id]") ?? null;
      const columnId = cell?.getAttribute("column-id") ?? null;
      // Sin celda resoluble: conservar la selección previa.
      if (columnId === null) return;
      setSelectedCell({ columnId, trId });
    },
    []
  );

  return [selectedCell, handleBodyTrClick, setSelectedCell];
};
