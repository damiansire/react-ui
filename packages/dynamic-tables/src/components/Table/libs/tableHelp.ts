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
