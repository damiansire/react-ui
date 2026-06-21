import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import Table from "./Table";
// El barrel público: named + default deben resolver al mismo componente.
import DefaultTable, { Table as NamedTable } from "../../index";
import { Header } from "./interfaces/Header";
import { Row } from "./interfaces/Row";

const headers: Header[] = [
  { attributeName: "name", displayText: "Nombre" },
  { attributeName: "amount", displayText: "Monto" },
];

const rows: Row[] = [
  { id: "1", name: "Alice", amount: "10" },
  { id: "2", name: "Bob", amount: "20" },
];

describe("Table - barrel público (default + named export)", () => {
  it("expone un default export que renderiza (README: import Table from ...)", () => {
    expect(DefaultTable).toBeDefined();
    render(<DefaultTable headers={headers} rows={rows} />);
    expect(
      screen.getByRole("columnheader", { name: "Nombre" })
    ).toBeInTheDocument();
  });

  it("el default export es el mismo componente que el named export", () => {
    expect(DefaultTable).toBe(NamedTable);
  });
});

describe("Table - render", () => {
  it("renderiza los encabezados con su displayText", () => {
    render(<Table headers={headers} rows={rows} />);
    expect(
      screen.getByRole("columnheader", { name: "Nombre" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Monto" })
    ).toBeInTheDocument();
  });

  it("renderiza una fila por cada row con sus valores", () => {
    render(<Table headers={headers} rows={rows} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("muestra el texto de vacío cuando no hay filas", () => {
    render(<Table headers={headers} rows={[]} options={{ noRowsText: "Sin datos" }} />);
    expect(screen.getByText("Sin datos")).toBeInTheDocument();
  });

  it("deriva los encabezados desde las filas con HeadersAutoFill", () => {
    render(<Table rows={rows} options={{ HeadersAutoFill: true }} />);
    expect(screen.getByRole("columnheader", { name: "name" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "amount" })).toBeInTheDocument();
  });

  it("avisa cuando no hay encabezados ni autofill", () => {
    render(<Table rows={rows} />);
    expect(
      screen.getByText(/No headers/i)
    ).toBeInTheDocument();
  });
});

describe("Table - interacción", () => {
  it("marca la celda como seleccionada al hacer click", () => {
    render(<Table headers={headers} rows={rows} />);
    const cell = screen.getByText("Alice").closest("td") as HTMLTableCellElement;
    expect(cell).not.toHaveClass("selected");
    fireEvent.click(cell);
    expect(cell).toHaveClass("selected");
  });

  it("mueve la selección con flechas (ArrowDown navega a la fila siguiente)", () => {
    const { container } = render(<Table headers={headers} rows={rows} />);
    const table = container.querySelector("table") as HTMLTableElement;

    const firstCell = screen.getByText("Alice").closest("td") as HTMLTableCellElement;
    fireEvent.click(firstCell);
    expect(firstCell).toHaveClass("selected");

    fireEvent.keyDown(table, { key: "ArrowDown" });

    const secondRowCell = within(
      screen.getByText("Bob").closest("tr") as HTMLTableRowElement
    ).getByText("Bob").closest("td") as HTMLTableCellElement;
    expect(secondRowCell).toHaveClass("selected");
    expect(firstCell).not.toHaveClass("selected");
  });

  it("selecciona [0,0] al enfocar la tabla con teclado (sin click previo)", () => {
    const { container } = render(<Table headers={headers} rows={rows} />);
    const table = container.querySelector("table") as HTMLTableElement;

    // Sin selección inicial.
    expect(
      container.querySelector("td.selected")
    ).not.toBeInTheDocument();

    // El usuario de teclado tabula hasta la tabla: debe quedar [0,0] seleccionada.
    fireEvent.focus(table);

    const firstCell = screen
      .getByText("Alice")
      .closest("td") as HTMLTableCellElement;
    expect(firstCell).toHaveClass("selected");
  });

  it("permite navegar con flechas iniciando solo con teclado (focus + ArrowDown)", () => {
    const { container } = render(<Table headers={headers} rows={rows} />);
    const table = container.querySelector("table") as HTMLTableElement;

    // Sin ningún click: foco por teclado y luego flecha.
    fireEvent.focus(table);
    fireEvent.keyDown(table, { key: "ArrowDown" });

    const secondRowCell = within(
      screen.getByText("Bob").closest("tr") as HTMLTableRowElement
    )
      .getByText("Bob")
      .closest("td") as HTMLTableCellElement;
    expect(secondRowCell).toHaveClass("selected");
  });

  it("ignora teclas de control (no abre el editor con Escape)", () => {
    const { container } = render(<Table headers={headers} rows={rows} />);
    const table = container.querySelector("table") as HTMLTableElement;

    const cell = screen.getByText("Alice").closest("td") as HTMLTableCellElement;
    fireEvent.click(cell);

    fireEvent.keyDown(table, { key: "Escape" });

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });
});

describe("Table - edición de celda con <input>", () => {
  it("abre un <input> al tipear un carácter imprimible y reemplaza el valor", () => {
    const { container } = render(<Table headers={headers} rows={rows} />);
    const table = container.querySelector("table") as HTMLTableElement;

    const cell = screen.getByText("Alice").closest("td") as HTMLTableCellElement;
    fireEvent.click(cell);
    fireEvent.keyDown(table, { key: "Z" });

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe("Z");
  });

  it("abre el editor con Enter conservando el valor actual y ubica el caret al final", () => {
    const { container } = render(<Table headers={headers} rows={rows} />);
    const table = container.querySelector("table") as HTMLTableElement;

    const cell = screen.getByText("Alice").closest("td") as HTMLTableCellElement;
    fireEvent.click(cell);
    fireEvent.keyDown(table, { key: "Enter" });

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("Alice");
    expect(input.selectionStart).toBe("Alice".length);
  });

  it("commitea el valor con Enter desde el input", () => {
    const { container } = render(<Table headers={headers} rows={rows} />);
    const table = container.querySelector("table") as HTMLTableElement;

    const cell = screen.getByText("Alice").closest("td") as HTMLTableCellElement;
    fireEvent.click(cell);
    fireEvent.keyDown(table, { key: "Enter" });

    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Alicia" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByText("Alicia")).toBeInTheDocument();
  });

  it("commitea el valor al perder el foco (blur)", () => {
    const { container } = render(<Table headers={headers} rows={rows} />);
    const table = container.querySelector("table") as HTMLTableElement;

    const cell = screen.getByText("Bob").closest("td") as HTMLTableCellElement;
    fireEvent.click(cell);
    fireEvent.keyDown(table, { key: "Enter" });

    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Bobby" } });
    fireEvent.blur(input);

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByText("Bobby")).toBeInTheDocument();
  });

  it("cancela la edición con Escape y restaura el valor original", () => {
    const { container } = render(<Table headers={headers} rows={rows} />);
    const table = container.querySelector("table") as HTMLTableElement;

    const cell = screen.getByText("Alice").closest("td") as HTMLTableCellElement;
    fireEvent.click(cell);
    fireEvent.keyDown(table, { key: "Enter" });

    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "descartado" } });
    fireEvent.keyDown(input, { key: "Escape" });

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.queryByText("descartado")).not.toBeInTheDocument();
  });

  it("no navega con flechas mientras se edita (las flechas son para el caret)", () => {
    const { container } = render(<Table headers={headers} rows={rows} />);
    const table = container.querySelector("table") as HTMLTableElement;

    const cell = screen.getByText("Alice").closest("td") as HTMLTableCellElement;
    fireEvent.click(cell);
    fireEvent.keyDown(table, { key: "Enter" });

    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.keyDown(input, { key: "ArrowDown" });

    // El editor sigue abierto: la flecha no movió la selección.
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });
});

describe("Table - lectura de la edición (onCellEdit)", () => {
  it("invoca onCellEdit con (rowId, columnId, valor) al commitear", () => {
    const onCellEdit = vi.fn();
    const { container } = render(
      <Table headers={headers} rows={rows} options={{ onCellEdit }} />
    );
    const table = container.querySelector("table") as HTMLTableElement;

    const cell = screen.getByText("Alice").closest("td") as HTMLTableCellElement;
    fireEvent.click(cell);
    fireEvent.keyDown(table, { key: "Enter" });

    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Alicia" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onCellEdit).toHaveBeenCalledTimes(1);
    expect(onCellEdit).toHaveBeenCalledWith("1", "name", "Alicia");
  });

  it("no invoca onCellEdit si se cancela con Escape", () => {
    const onCellEdit = vi.fn();
    const { container } = render(
      <Table headers={headers} rows={rows} options={{ onCellEdit }} />
    );
    const table = container.querySelector("table") as HTMLTableElement;

    const cell = screen.getByText("Alice").closest("td") as HTMLTableCellElement;
    fireEvent.click(cell);
    fireEvent.keyDown(table, { key: "Enter" });

    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "descartado" } });
    fireEvent.keyDown(input, { key: "Escape" });

    expect(onCellEdit).not.toHaveBeenCalled();
  });

  it("Backspace abre el editor vaciando la celda (permite borrar)", () => {
    const onCellEdit = vi.fn();
    const { container } = render(
      <Table headers={headers} rows={rows} options={{ onCellEdit }} />
    );
    const table = container.querySelector("table") as HTMLTableElement;

    const cell = screen.getByText("Alice").closest("td") as HTMLTableCellElement;
    fireEvent.click(cell);
    fireEvent.keyDown(table, { key: "Backspace" });

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("");

    fireEvent.keyDown(input, { key: "Enter" });
    expect(onCellEdit).toHaveBeenCalledWith("1", "name", "");
  });
});

describe("Table - accesibilidad (grid semantics)", () => {
  it("expone role=grid en la tabla con aria-label", () => {
    render(<Table headers={headers} rows={rows} options={{ label: "Gastos" }} />);
    const grid = screen.getByRole("grid", { name: "Gastos" });
    expect(grid).toBeInTheDocument();
  });

  it("expone gridcell con aria-selected reflejando la selección", () => {
    render(<Table headers={headers} rows={rows} />);
    const cell = screen.getByText("Alice").closest("td") as HTMLTableCellElement;
    expect(cell).toHaveAttribute("role", "gridcell");
    expect(cell).toHaveAttribute("aria-selected", "false");

    fireEvent.click(cell);
    expect(cell).toHaveAttribute("aria-selected", "true");
    // La celda seleccionada es enfocable por teclado (tabindex=0).
    expect(cell).toHaveAttribute("tabindex", "0");
  });

  it("anuncia la celda seleccionada vía región aria-live", () => {
    render(<Table headers={headers} rows={rows} />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Sin celda seleccionada");

    const cell = screen.getByText("Alice").closest("td") as HTMLTableCellElement;
    fireEvent.click(cell);
    expect(status).toHaveTextContent("Celda seleccionada: name");
  });

  it("el input de edición tiene una etiqueta accesible", () => {
    const { container } = render(<Table headers={headers} rows={rows} />);
    const table = container.querySelector("table") as HTMLTableElement;
    const cell = screen.getByText("Alice").closest("td") as HTMLTableCellElement;
    fireEvent.click(cell);
    fireEvent.keyDown(table, { key: "Enter" });

    expect(screen.getByRole("textbox", { name: /editar name/i })).toBeInTheDocument();
  });
});
