import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  forwardRef,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import "./table.css";
import { Row } from "./interfaces/Row";
import { useTableSelection } from "./useTableSelection";
import { Header } from "./interfaces/Header";
import { ICell, TableProps } from "./interfaces/TableProps";
import {
  getCell,
  getHeadersFromRows,
  isWritableCharacter,
  nextSortDirection,
  sortRows,
  SortDirection,
} from "./libs/tableHelp";

const Cell = ({
  value,
  isSelected,
  columnName,
  isEditing,
  draftValue,
  onDraftChange,
  onCommit,
  onCancel,
  editInputRef,
}: ICell) => (
  <td
    role="gridcell"
    className={isSelected ? "selected" : ""}
    column-id={columnName}
    tabIndex={isSelected ? 0 : -1}
    aria-selected={isSelected}
  >
    {isEditing ? (
      <input
        ref={editInputRef}
        className="cell-editor"
        aria-label={`Editar ${columnName}`}
        value={draftValue}
        onChange={(event) => onDraftChange?.(event.target.value)}
        onBlur={() => onCommit?.()}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onCommit?.();
          } else if (event.key === "Escape") {
            event.preventDefault();
            onCancel?.();
          }
        }}
      />
    ) : (
      value
    )}
  </td>
);

const TableComponent = forwardRef<HTMLTableElement, TableProps>(
  ({ rows = [], headers = [], options = {} }, forwardedRef) => {
    const noRowsText = options.noRowsText ? options.noRowsText : "No data";
    const isVirtualized = Boolean(options.virtualized);
    const rowHeight = options.rowHeight ?? 37;
    const viewportHeight = options.height ?? 400;
    const overscan = options.overscan ?? 6;

    let rendersHeaders: Header[] = headers;
    if (rendersHeaders.length === 0 && options.HeadersAutoFill) {
      rendersHeaders = getHeadersFromRows(rows);
    }

    // Orden por columna (opt-in vía options.sortable). null = orden original.
    const [sort, setSort] = useState<{
      columnId: string;
      direction: SortDirection;
    } | null>(null);

    // Las filas tal como se muestran: ordenadas si hay `sort` activo, o las
    // originales. La edición se indexa por rowId (estable), así que un reorden
    // no pierde valores ya editados. Todo lo demás (selección, foco, teclado)
    // opera sobre ESTAS filas para seguir el orden visible.
    const displayedRows = useMemo(() => {
      if (!options.sortable || !sort) return rows;
      return sortRows(rows, sort.columnId, sort.direction);
    }, [rows, sort, options.sortable]);

    const toggleSort = useCallback((columnId: string) => {
      setSort((current) => {
        const currentDir =
          current && current.columnId === columnId ? current.direction : null;
        const next = nextSortDirection(currentDir);
        return next === null ? null : { columnId, direction: next };
      });
    }, []);

    // Valores ya comprometidos (commit) por celda.
    const [editedCellValues, setEditedCellValues] = useState<{
      [rowId: string]: { [columnId: string]: string | number };
    }>({});

    // Celda actualmente en modo edición (input abierto) y su borrador.
    const [editing, setEditing] = useState<{
      trId: string;
      columnId: string;
    } | null>(null);
    const [draftValue, setDraftValue] = useState<string>("");

    // El componente siempre usa `internalRef` para su lógica interna (selección,
    // foco, getCell). El `setTableRef` mergea: setea internalRef y propaga el
    // nodo al ref del consumidor, sea objeto o callback ref.
    const internalRef = useRef<HTMLTableElement | null>(null);
    const tableRef = internalRef;
    const setTableRef = useCallback(
      (node: HTMLTableElement | null) => {
        internalRef.current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [forwardedRef]
    );
    const editInputRef = useRef<HTMLInputElement>(null);

    // Contenedor con scroll propio cuando `virtualized` está activo. Sin
    // virtualización el scroll lo maneja el documento como siempre (no se usa).
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);

    const rowVirtualizer = useVirtualizer({
      count: displayedRows.length,
      getScrollElement: () => scrollContainerRef.current,
      estimateSize: () => rowHeight,
      overscan,
      enabled: isVirtualized,
      // Sin esto, el primer render depende de que ResizeObserver reporte el
      // tamaño real del contenedor (async) antes de poder calcular qué filas
      // van dentro del viewport — un parpadeo de tabla vacía en el primer
      // paint. Como `options.height` YA fija el alto del contenedor, se lo
      // pasamos de entrada: el virtualizador puede pintar filas reales desde
      // el primer render, y el ResizeObserver solo corrige después si el
      // tamaño real difiere (p. ej. el consumidor no fijó `height` en px).
      initialRect: { width: 0, height: viewportHeight },
    });

    const [selectedCell, handleBodyTrClick, setSelectedCell] =
      useTableSelection(
        displayedRows,
        rendersHeaders,
        tableRef,
        Boolean(editing),
        isVirtualized ? rowVirtualizer : undefined
      );

    // Permite iniciar la navegación con teclado: al enfocar la tabla sin
    // selección previa, seleccionar la primera celda [0,0] (patrón APG Data Grid).
    // Antes, las flechas no hacían nada hasta clickear con el mouse.
    const handleTableFocus = useCallback(() => {
      if (selectedCell.trId !== null) return;
      const firstRow = displayedRows[0];
      const firstColumn = rendersHeaders[0];
      if (firstRow && firstColumn) {
        setSelectedCell({
          trId: firstRow.id,
          columnId: firstColumn.attributeName,
        });
      }
    }, [selectedCell.trId, displayedRows, rendersHeaders, setSelectedCell]);

    const isSelectedCell = useCallback(
      (columnId: string, rowId: string) => {
        return (
          selectedCell.trId === rowId && selectedCell.columnId === columnId
        );
      },
      [selectedCell]
    );

    const getCommittedValue = useCallback(
      (trId: string, columnId: string): string | number => {
        const editedRow = editedCellValues[trId];
        if (editedRow && columnId in editedRow) {
          return editedRow[columnId] ?? "";
        }
        const originalRow = rows.find((r) => r.id === trId);
        return originalRow ? originalRow[columnId] ?? "" : "";
      },
      [editedCellValues, rows]
    );

    const startEditing = useCallback(
      (trId: string, columnId: string, initial?: string) => {
        const base =
          initial !== undefined
            ? initial
            : String(getCommittedValue(trId, columnId));
        setDraftValue(base);
        setEditing({ trId, columnId });
      },
      [getCommittedValue]
    );

    const onCellEdit = options.onCellEdit;
    const commitEdit = useCallback(() => {
      setEditing((current) => {
        if (!current) return null;
        const { trId, columnId } = current;
        setEditedCellValues((last) => ({
          ...last,
          [trId]: {
            ...(last[trId] ?? {}),
            [columnId]: draftValue,
          },
        }));
        // Notificar hacia afuera el valor confirmado (lectura del consumidor).
        onCellEdit?.(trId, columnId, draftValue);
        return null;
      });
    }, [draftValue, onCellEdit]);

    const cancelEdit = useCallback(() => {
      setEditing(null);
    }, []);

    // Al entrar en edición, llevar el caret al input.
    useEffect(() => {
      if (editing && editInputRef.current) {
        const input = editInputRef.current;
        input.focus();
        const end = input.value.length;
        input.setSelectionRange(end, end);
      }
    }, [editing]);

    const renderRow = useCallback(
      (row: Row, rowHeaders: Header[]) => {
        return (
          <tr
            key={row.id}
            role="row"
            row-id={row.id}
            onClick={handleBodyTrClick}
          >
            {rowHeaders.map((data) => {
              const cellValue = getCommittedValue(row.id, data.attributeName);
              const cellIsEditing =
                editing?.trId === row.id &&
                editing?.columnId === data.attributeName;
              return (
                <Cell
                  key={data.attributeName}
                  value={cellValue}
                  columnName={data.attributeName}
                  isSelected={isSelectedCell(data.attributeName, row.id)}
                  isEditing={cellIsEditing}
                  draftValue={cellIsEditing ? draftValue : ""}
                  onDraftChange={setDraftValue}
                  onCommit={commitEdit}
                  onCancel={cancelEdit}
                  editInputRef={cellIsEditing ? editInputRef : undefined}
                />
              );
            })}
          </tr>
        );
      },
      [
        isSelectedCell,
        handleBodyTrClick,
        getCommittedValue,
        editing,
        draftValue,
        commitEdit,
        cancelEdit,
      ]
    );

    // Abre la edición al tipear un carácter imprimible sobre la celda seleccionada.
    useEffect(() => {
      function pressKey(event: KeyboardEvent) {
        if (editing) return;
        const { trId, columnId } = selectedCell;
        if (isWritableCharacter(event) && trId && columnId) {
          event.preventDefault();
          // El primer carácter tipeado reemplaza el contenido (modo "edición rápida").
          startEditing(trId, columnId, event.key);
        } else if (
          (event.key === "Backspace" || event.key === "Delete") &&
          trId &&
          columnId
        ) {
          // Backspace/Delete abren el editor vaciando la celda (permite corregir).
          event.preventDefault();
          startEditing(trId, columnId, "");
        } else if (event.key === "Enter" && trId && columnId) {
          // Enter sobre la celda seleccionada abre el editor con el valor actual.
          event.preventDefault();
          startEditing(trId, columnId);
        }
      }

      const tableNode = tableRef.current;
      if (!tableNode) return;

      tableNode.addEventListener("keydown", pressKey);
      return () => {
        tableNode.removeEventListener("keydown", pressKey);
      };
    }, [selectedCell, editing, startEditing, tableRef]);

    // Devolver el foco a la celda tras cerrar el editor.
    useEffect(() => {
      if (!editing && selectedCell.trId && selectedCell.columnId) {
        // Reusar getCell (escapa con CSS.escape) en vez de duplicar el selector
        // crudo, que reintroducía la inyección que getCell ya resuelve.
        const cell = getCell(
          tableRef,
          selectedCell.trId,
          selectedCell.columnId
        );
        // Solo reenfocar si el foco quedó fuera de una celda (p. ej. tras commit del input).
        if (cell && document.activeElement?.tagName === "INPUT") {
          cell.focus();
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editing]);

    const emptyRow = (
      <tr role="row">
        <td
          role="gridcell"
          colSpan={rendersHeaders.length || 1}
          className="no-data"
        >
          {noRowsText}
        </td>
      </tr>
    );

    const renderRows = () => {
      if (displayedRows.length === 0) return emptyRow;

      if (!isVirtualized) {
        return displayedRows.map((row) => renderRow(row, rendersHeaders));
      }

      // Solo montamos las filas visibles (+ overscan). El resto del espacio se
      // simula con dos <tr> "espaciadoras" cuya altura reserva el lugar de las
      // filas no montadas, así el scrollbar del contenedor refleja el tamaño
      // TOTAL de `displayedRows`, no solo el de las filas presentes en el DOM.
      const virtualItems = rowVirtualizer.getVirtualItems();
      const totalSize = rowVirtualizer.getTotalSize();
      const firstVirtualItem = virtualItems[0];
      const lastVirtualItem = virtualItems[virtualItems.length - 1];
      const paddingTop = firstVirtualItem ? firstVirtualItem.start : 0;
      const paddingBottom = lastVirtualItem
        ? totalSize - lastVirtualItem.end
        : 0;

      return (
        <>
          {paddingTop > 0 && (
            <tr aria-hidden="true" style={{ height: paddingTop }}>
              <td colSpan={rendersHeaders.length || 1} />
            </tr>
          )}
          {virtualItems.map((virtualRow) => {
            const row = displayedRows[virtualRow.index];
            return row ? renderRow(row, rendersHeaders) : null;
          })}
          {paddingBottom > 0 && (
            <tr aria-hidden="true" style={{ height: paddingBottom }}>
              <td colSpan={rendersHeaders.length || 1} />
            </tr>
          )}
        </>
      );
    };

    const selectionLabel =
      selectedCell.trId && selectedCell.columnId
        ? `Celda seleccionada: ${selectedCell.columnId}${
            editing ? " (editando)" : ""
          }`
        : "Sin celda seleccionada";

    const table = (
      <table
        ref={setTableRef}
        tabIndex={0}
        role="grid"
        aria-label={options.label ?? "Tabla de datos"}
        className="table"
        onFocus={handleTableFocus}
      >
        <thead>
          <tr role="row">
            {rendersHeaders.length > 0 ? (
              rendersHeaders.map((x) => {
                if (!options.sortable) {
                  return (
                    <th key={x.attributeName} role="columnheader" scope="col">
                      {x.displayText}
                    </th>
                  );
                }
                const active = sort?.columnId === x.attributeName;
                const ariaSort = !active
                  ? "none"
                  : sort?.direction === "asc"
                    ? "ascending"
                    : "descending";
                const indicator = !active ? "" : sort?.direction === "asc" ? " ▲" : " ▼";
                return (
                  <th
                    key={x.attributeName}
                    role="columnheader"
                    scope="col"
                    aria-sort={ariaSort}
                  >
                    <button
                      type="button"
                      className="th-sort"
                      onClick={() => toggleSort(x.attributeName)}
                    >
                      {x.displayText}
                      <span aria-hidden="true">{indicator}</span>
                    </button>
                  </th>
                );
              })
            ) : (
              <th role="columnheader" scope="col">
                No headers. Consider adding autofill option
              </th>
            )}
          </tr>
        </thead>
        <tbody>{renderRows()}</tbody>
      </table>
    );

    return (
      <>
        {isVirtualized ? (
          <div
            ref={scrollContainerRef}
            className="table-scroll-container"
            style={{ height: viewportHeight, overflow: "auto" }}
          >
            {table}
          </div>
        ) : (
          table
        )}
        <div
          className="table-sr-status"
          role="status"
          aria-live="polite"
        >
          {selectionLabel}
        </div>
      </>
    );
  }
);

TableComponent.displayName = "Table";

export default TableComponent;
