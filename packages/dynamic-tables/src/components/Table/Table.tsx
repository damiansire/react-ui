import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo,
  forwardRef,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import "./table.css";
import type { Row } from "./interfaces/Row";
import { useTableSelection } from "./useTableSelection";
import type { Header } from "./interfaces/Header";
import type { ICell, TableProps } from "./interfaces/TableProps";
import {
  getCell,
  getHeadersFromRows,
  isWritableCharacter,
  nextSortDirection,
  sortRows,
} from "./libs/tableHelp";
import type { SortDirection } from "./libs/tableHelp";

/** Celda con el editor abierto. */
interface EditingCell {
  trId: string;
  columnId: string;
}

/** Edición commiteada: el valor nuevo y el que traía la prop al commitear
 * (si la prop cambia respecto de ese `base`, gana la prop). */
interface CommittedEdit {
  value: string | number;
  base: string | number;
}

/** ¿El evento nació en el <thead> (p. ej. el botón de ordenar)? Los listeners
 * viven en el <table> y reciben por burbujeo lo que no es de la grilla. */
const isFromHeader = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement && target.closest("thead") !== null;

// `memo`: cada tecla tipeada cambia el borrador en la raiz y volvia a
// reconciliar el cuerpo entero. Con las props de celda estables (los callbacks
// lo son), las celdas ajenas a la edicion ya no se re-renderizan.
const Cell = memo(function Cell({
  value,
  isSelected,
  columnName,
  isEditing,
  draftValue,
  onDraftChange,
  onCommit,
  onCancel,
  editInputRef,
}: ICell) {
  return (
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
});

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

    // Valores commiteados por celda. El `base` permite detectar después que la
    // prop cambió (rechazo, normalización, refresh) y devolverle la prioridad.
    const [editedCellValues, setEditedCellValues] = useState<{
      [rowId: string]: { [columnId: string]: CommittedEdit };
    }>({});

    // Índice por id: resolver una celda es O(1). Con un `find` por celda el
    // render era O(filas² × columnas).
    const rawRowsById = useMemo(
      () => new Map<string, Row>(rows.map((row) => [row.id, row] as const)),
      [rows]
    );
    const rawRowsByIdRef = useRef(rawRowsById);
    useEffect(() => {
      rawRowsByIdRef.current = rawRowsById;
    }, [rawRowsById]);

    // Fuente de verdad ÚNICA del render: `rows` con las ediciones locales
    // encima. La edición local sobrevive solo mientras la prop no cambie.
    const effectiveRows = useMemo(() => {
      if (Object.keys(editedCellValues).length === 0) return rows;
      return rows.map((row) => {
        const edits = editedCellValues[row.id];
        if (!edits) return row;
        let merged: Row | null = null;
        for (const [columnId, edit] of Object.entries(edits)) {
          if ((row[columnId] ?? "") !== edit.base) continue;
          if (!merged) merged = { ...row };
          merged[columnId] = edit.value;
        }
        return merged ?? row;
      });
    }, [rows, editedCellValues]);

    const rowsById = useMemo(
      () =>
        new Map<string, Row>(
          effectiveRows.map((row) => [row.id, row] as const)
        ),
      [effectiveRows]
    );

    // Podar el overlay al cambiar `rows`: sin esto crece sin techo y sus
    // valores viejos reaparecen sobre filas nuevas que reusan el id.
    useEffect(() => {
      setEditedCellValues((previous) => {
        let changed = false;
        const next: typeof previous = {};
        for (const [rowId, edits] of Object.entries(previous)) {
          const row = rawRowsById.get(rowId);
          if (!row) {
            changed = true;
            continue;
          }
          const kept: { [columnId: string]: CommittedEdit } = {};
          for (const [columnId, edit] of Object.entries(edits)) {
            if ((row[columnId] ?? "") !== edit.base) {
              changed = true;
              continue;
            }
            kept[columnId] = edit;
          }
          if (Object.keys(kept).length > 0) next[rowId] = kept;
        }
        return changed ? next : previous;
      });
    }, [rawRowsById]);

    // Filas como se muestran. Se ordena sobre `effectiveRows` (las que se
    // pintan), no sobre la prop cruda: si no, ordena por lo que no muestra.
    const displayedRows = useMemo(() => {
      if (!options.sortable || !sort) return effectiveRows;
      return sortRows(effectiveRows, sort.columnId, sort.direction);
    }, [effectiveRows, sort, options.sortable]);

    const toggleSort = useCallback((columnId: string) => {
      setSort((current) => {
        const currentDir =
          current && current.columnId === columnId ? current.direction : null;
        const next = nextSortDirection(currentDir);
        return next === null ? null : { columnId, direction: next };
      });
    }, []);

    // Celda actualmente en modo edición (input abierto) y su borrador.
    const [editing, setEditing] = useState<EditingCell | null>(null);
    const [draftValue, setDraftValue] = useState<string>("");
    // Espejos síncronos: los handlers del editor (Enter, blur, desmontaje)
    // pueden caer en el mismo tick; el ref garantiza UN commit por edición.
    const editingRef = useRef<EditingCell | null>(null);
    const draftValueRef = useRef<string>("");

    const setDraft = useCallback((value: string) => {
      draftValueRef.current = value;
      setDraftValue(value);
    }, []);

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
    const editInputRef = useRef<HTMLInputElement | null>(null);

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
    const handleTableFocus = useCallback(
      (event: React.FocusEvent<HTMLTableElement>) => {
        // Tabular hasta un botón de ordenar no es "entrar a la grilla".
        if (isFromHeader(event.target)) return;
        if (selectedCell.trId !== null) return;
        const firstRow = displayedRows[0];
        const firstColumn = rendersHeaders[0];
        if (firstRow && firstColumn) {
          setSelectedCell({
            trId: firstRow.id,
            columnId: firstColumn.attributeName,
          });
        }
      },
      [selectedCell.trId, displayedRows, rendersHeaders, setSelectedCell]
    );

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
        const row = rowsById.get(trId);
        return row ? row[columnId] ?? "" : "";
      },
      [rowsById]
    );

    const startEditing = useCallback(
      (trId: string, columnId: string, initial?: string) => {
        const base =
          initial !== undefined
            ? initial
            : String(getCommittedValue(trId, columnId));
        setDraft(base);
        editingRef.current = { trId, columnId };
        setEditing({ trId, columnId });
      },
      [getCommittedValue, setDraft]
    );

    const onCellEdit = options.onCellEdit;
    // El commit NO vive en un updater de `setState`: deben ser puros y React
    // los invoca dos veces bajo StrictMode, lo que duplicaba `onCellEdit`.
    const commitEdit = useCallback(() => {
      const current = editingRef.current;
      if (!current) return;
      const { trId, columnId } = current;
      const value = draftValueRef.current;
      editingRef.current = null;
      setEditing(null);
      const rawRow = rawRowsByIdRef.current.get(trId);
      const base = rawRow ? rawRow[columnId] ?? "" : "";
      setEditedCellValues((last) => ({
        ...last,
        [trId]: {
          ...(last[trId] ?? {}),
          [columnId]: { value, base },
        },
      }));
      // Notificar hacia afuera el valor confirmado (lectura del consumidor).
      onCellEdit?.(trId, columnId, value);
    }, [onCellEdit]);

    const cancelEdit = useCallback(() => {
      editingRef.current = null;
      setEditing(null);
    }, []);

    // `commitEdit` cambia con `onCellEdit`; el ref lo hace accesible desde
    // callbacks que deben ser estables (el ref del editor).
    const commitEditRef = useRef(commitEdit);
    useEffect(() => {
      commitEditRef.current = commitEdit;
    }, [commitEdit]);

    // Ref callback ESTABLE. Si el input desaparece sin blur (fila fuera de la
    // ventana virtualizada, o el host deja de renderizarla), `editing` quedaba
    // colgado y el teclado muerto. Commiteamos igual que en blur.
    const setEditInputRef = useCallback((node: HTMLInputElement | null) => {
      const previous = editInputRef.current;
      editInputRef.current = node;
      if (node === null && previous !== null && editingRef.current) {
        commitEditRef.current();
      }
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
                  onDraftChange={setDraft}
                  onCommit={commitEdit}
                  onCancel={cancelEdit}
                  editInputRef={cellIsEditing ? setEditInputRef : undefined}
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
        setDraft,
        commitEdit,
        cancelEdit,
        setEditInputRef,
      ]
    );

    // Abre la edición al tipear un carácter imprimible sobre la celda seleccionada.
    useEffect(() => {
      function pressKey(event: KeyboardEvent) {
        if (editing) return;
        // Sin este filtro, Enter/Space sobre un botón de ordenar cancelaban su
        // activación nativa (preventDefault) y abrían el editor de otra celda.
        if (isFromHeader(event.target)) return;
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
        // Reenfocar si el foco quedó FUERA de la tabla. Al correr este efecto
        // el <input> ya se desmontó y el foco está en <body>: exigir que
        // `activeElement` fuera un INPUT no se cumplía nunca.
        if (cell && !tableRef.current?.contains(document.activeElement)) {
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
