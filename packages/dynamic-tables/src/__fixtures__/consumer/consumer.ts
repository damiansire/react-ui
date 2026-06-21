// Consumidor sintético: importa el paquete CONSTRUIDO por su nombre publicado,
// igual que lo haría un usuario externo. Sirve para verificar que el
// `exports`/`types` map resuelve `dist/index.d.ts` y que los tipos públicos
// compilan desde afuera del paquete.
import DefaultTable, { Table, getCell } from "react-dinamic-tables";
import type {
  TableProps,
  TableOptions,
  Header,
  Row,
} from "react-dinamic-tables";

// Table debe ser usable como componente con sus props públicas.
const _component: typeof Table = Table;
void _component;

// El default export documentado en el README debe resolver desde el .d.ts.
const _default: typeof Table = DefaultTable;
void _default;

const headers: Header[] = [
  { attributeName: "name", displayText: "Nombre" },
];

const rows: Row[] = [{ id: "1", name: "Alice", amount: 10 }];

const options: TableOptions = { noRowsText: "Vacío", label: "Demo" };

const props: TableProps = { headers, rows, options };
void props;

// getCell expone el tipo de retorno correcto.
declare const ref: React.RefObject<HTMLTableElement>;
const cell: HTMLTableCellElement | null = getCell(ref, "1", "name");
void cell;

// @ts-expect-error: 'foo' no existe en TableOptions (el .d.ts mantiene el contrato).
const bad: TableOptions = { foo: true };
void bad;
