import { describe, it, expectTypeOf } from "vitest";
import type { ComponentType } from "react";
// Importamos desde el barrel público del paquete (mismo punto de entrada que el consumidor).
import { Table, getCell } from "../../index";
import type {
  TableProps,
  TableOptions,
  Header,
  Row,
} from "../../index";

describe("API público: tipos", () => {
  it("Table es un componente React que acepta TableProps", () => {
    expectTypeOf(Table).toMatchTypeOf<ComponentType<TableProps>>();
  });

  it("TableProps tiene headers/rows/options opcionales y bien tipados", () => {
    expectTypeOf<TableProps["headers"]>().toEqualTypeOf<Header[] | undefined>();
    expectTypeOf<TableProps["rows"]>().toEqualTypeOf<Row[] | undefined>();
    expectTypeOf<TableProps["options"]>().toEqualTypeOf<
      TableOptions | undefined
    >();
  });

  it("Header expone attributeName/displayText como string", () => {
    expectTypeOf<Header>().toEqualTypeOf<{
      attributeName: string;
      displayText: string;
    }>();
  });

  it("Row tiene id string e índice de string | number", () => {
    expectTypeOf<Row["id"]>().toEqualTypeOf<string>();
    expectTypeOf<Row[string]>().toEqualTypeOf<string | number>();
  });

  it("TableOptions tiene flags opcionales", () => {
    expectTypeOf<TableOptions["noRowsText"]>().toEqualTypeOf<
      string | undefined
    >();
    expectTypeOf<TableOptions["HeadersAutoFill"]>().toEqualTypeOf<
      boolean | undefined
    >();
    expectTypeOf<TableOptions["label"]>().toEqualTypeOf<string | undefined>();
  });

  it("getCell devuelve HTMLTableCellElement | null", () => {
    expectTypeOf(getCell).returns.toEqualTypeOf<HTMLTableCellElement | null>();
  });

  it("rechaza props desconocidas en el uso (negativo)", () => {
    const ok: TableProps = { rows: [], headers: [] };
    expectTypeOf(ok).toMatchTypeOf<TableProps>();

    // @ts-expect-error: 'foo' no es una opción válida de TableOptions
    const bad: TableOptions = { foo: 1 };
    void bad;
  });
});
