import React from "react";
import { Header } from "./Header";
import { Row } from "./Row";

export interface TableProps {
    headers?: Header[];
    rows?: Row[];
    options?: TableOptions;
}

export interface ICell {
    value: string | number;
    columnName: string;
    isSelected: boolean;
    isEditing?: boolean;
    draftValue?: string;
    onDraftChange?: (value: string) => void;
    onCommit?: () => void;
    onCancel?: () => void;
    editInputRef?: React.RefObject<HTMLInputElement>;
}


export interface TableOptions {
    noRowsText?: string;
    HeadersAutoFill?: boolean;
    /** Etiqueta accesible de la tabla (`aria-label`). */
    label?: string;
    /**
     * Se invoca cuando el usuario confirma (commit) la edición de una celda.
     * Es la única forma de leer hacia afuera lo que se editó: sin esto la
     * edición es write-only (el estado vive interno en el componente).
     */
    onCellEdit?: (rowId: string, columnId: string, value: string) => void;
    /**
     * Habilita el ordenamiento por columna: cada encabezado pasa a ser un botón
     * que cicla sin-orden → ascendente → descendente → sin-orden. Opt-in: sin
     * esto los encabezados son estáticos y las filas conservan el orden de `rows`.
     */
    sortable?: boolean;
    /**
     * Habilita la virtualización de filas (@tanstack/react-virtual): solo se
     * montan al DOM las filas visibles en el viewport (+ overscan), no las
     * `rows` completas. Opt-in porque cambia el contenedor de scroll (pasa a
     * ser un `<div>` de altura fija en vez de que la tabla crezca con el
     * documento). Pensado para datasets grandes (10k+ filas).
     */
    virtualized?: boolean;
    /** Alto en px de cada fila. Requerido por el virtualizador para estimar el
     * tamaño total antes de medir filas reales. Default: 37 (padding 12px +
     * línea de texto + borde, según `table.css`). */
    rowHeight?: number;
    /** Alto en px del viewport con scroll cuando `virtualized` está activo.
     * Default: 400. */
    height?: number;
    /** Filas extra renderizadas fuera del viewport visible (arriba/abajo), para
     * que el scroll rápido y la navegación por teclado no muestren huecos en
     * blanco mientras el DOM se pone al día. Default: 6. */
    overscan?: number;
}
