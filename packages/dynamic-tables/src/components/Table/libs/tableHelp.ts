import { Header } from "../interfaces/Header";
import { Row } from "../interfaces/Row";

/**
 * Deriva las columnas a mostrar a partir de las claves de las filas.
 * Deduplica y excluye campos internos no mostrables (p. ej. la clave 'id').
 */
export const getHeadersFromRows = (rows: Row[]): Header[] => {
  const headersSet = rows.reduce((accumulator, currentValue) => {
    Object.keys(currentValue).forEach((key) => {
      accumulator.add(key);
    });
    return accumulator;
  }, new Set<string>());

  headersSet.delete("id");

  return Array.from(headersSet).map((attributeName) => ({
    attributeName,
    displayText: attributeName,
  }));
};

/**
 * Indica si una tecla representa un carácter imprimible editable
 * (incluye espacio y Unicode; descarta combinaciones con modificadores).
 */
export const isWritableCharacter = (event: {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
}): boolean => {
  return (
    event.key.length === 1 &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey
  );
};

/**
 * Devuelve el índice resultante de moverse `delta` posiciones con wraparound
 * modular. Si `length` es 0 (no hay columnas/filas) devuelve `current` sin
 * producir NaN.
 */
export const getWrappedIndex = (
  current: number,
  delta: number,
  length: number
): number => {
  if (length <= 0) {
    return current;
  }
  return (((current + delta) % length) + length) % length;
};

export const getCell = (
  tableRef: React.RefObject<HTMLTableElement>,
  rowId: string,
  columnId: string
): HTMLTableCellElement | null => {
  const escapedRowId = CSS.escape(rowId);
  const escapedColumnId = CSS.escape(columnId);
  return tableRef.current?.querySelector(
    `tr[row-id="${escapedRowId}"] td[column-id="${escapedColumnId}"]`
  ) as HTMLTableCellElement | null;
};
