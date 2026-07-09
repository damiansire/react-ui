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

export type SortDirection = "asc" | "desc";

/**
 * Cicla el estado de orden de una columna en 3 pasos (patrón de datagrid):
 * sin-orden (`null`) → `"asc"` → `"desc"` → sin-orden. Permite volver al orden
 * original de las filas con un tercer clic, sin un botón "limpiar" aparte.
 */
export const nextSortDirection = (
  current: SortDirection | null
): SortDirection | null => {
  if (current === null) return "asc";
  if (current === "asc") return "desc";
  return null;
};

/**
 * Compara dos valores de celda. Si AMBOS son numéricos (número real o string
 * que parsea a número finito) compara numéricamente —así "9" < "10" en vez del
 * orden lexicográfico "10" < "9"—; si no, compara como texto con `localeCompare`
 * (sensible a acentos/locale, p. ej. "á" ordena junto a "a").
 */
export const compareCellValues = (
  a: string | number,
  b: string | number
): number => {
  const numA = typeof a === "number" ? a : Number(a);
  const numB = typeof b === "number" ? b : Number(b);
  const bothNumeric =
    a !== "" && b !== "" && Number.isFinite(numA) && Number.isFinite(numB);
  if (bothNumeric) {
    return numA - numB;
  }
  return String(a).localeCompare(String(b));
};

/**
 * Devuelve una copia ordenada de `rows` por la columna `columnName`. El orden es
 * ESTABLE (las filas con igual valor conservan su posición relativa original,
 * usando el índice como desempate) para no barajar filas equivalentes. Nunca
 * muta el array de entrada.
 */
export const sortRows = (
  rows: Row[],
  columnName: string,
  direction: SortDirection
): Row[] => {
  const factor = direction === "asc" ? 1 : -1;
  return rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => {
      const cmp = compareCellValues(
        left.row[columnName] ?? "",
        right.row[columnName] ?? ""
      );
      return cmp !== 0 ? cmp * factor : left.index - right.index;
    })
    .map((decorated) => decorated.row);
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
