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
}
