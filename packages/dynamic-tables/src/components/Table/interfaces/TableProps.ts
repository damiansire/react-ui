import { Header } from "./Header";
import { Row } from "./Row";

export interface TableProps {
    headers: Header[];
    rows: Row[];
}

export interface ICell {
    value: string;
    columnName: string;
    isSelected: boolean;
}
