import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import Table from "./Table";
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

  it("edita el contenido de una celda al tipear un carácter imprimible", () => {
    const { container } = render(<Table headers={headers} rows={rows} />);
    const table = container.querySelector("table") as HTMLTableElement;

    const cell = screen.getByText("Alice").closest("td") as HTMLTableCellElement;
    fireEvent.click(cell);

    fireEvent.keyDown(table, {
      key: "X",
      ctrlKey: false,
      metaKey: false,
      altKey: false,
    });

    expect(screen.getByText("AliceX")).toBeInTheDocument();
  });

  it("ignora teclas de control para la edición", () => {
    const { container } = render(<Table headers={headers} rows={rows} />);
    const table = container.querySelector("table") as HTMLTableElement;

    const cell = screen.getByText("Alice").closest("td") as HTMLTableCellElement;
    fireEvent.click(cell);

    fireEvent.keyDown(table, { key: "Enter" });

    expect(screen.getByText("Alice")).toBeInTheDocument();
  });
});
