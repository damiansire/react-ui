import { Header } from "./Header";
import { Row } from "./Row";

export interface TableProps {
    headers: Header[];
    rows: Row[];
    options: TableOptions;
}

export interface ICell {
    value: string;
    columnName: string;
    isSelected: boolean;
}


export interface TableOptions {
    noRowsText?: string
}