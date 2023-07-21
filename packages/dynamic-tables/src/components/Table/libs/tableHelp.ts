export const getCell = (
  tableRef: React.RefObject<HTMLTableElement>,
  rowId: string,
  columnId: string
): HTMLTableCellElement | null => {
  return tableRef.current?.querySelector(
    `tr[row-id="${rowId}"] td[column-id="${columnId}"]`
  ) as HTMLTableCellElement | null;
};
