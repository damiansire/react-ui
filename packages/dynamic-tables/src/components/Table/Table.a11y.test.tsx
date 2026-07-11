import { describe, it, expect } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import Table from "./Table";
import { Header } from "./interfaces/Header";
import { Row } from "./interfaces/Row";

// ru-4: hasta ahora la única cobertura de a11y era `@storybook/addon-a11y`
// (chequeo visual manual, no corre en CI ni falla un build). Estos tests
// corren axe-core de verdad sobre el HTML renderizado por Vitest/jsdom, en el
// mismo `npm test` que ya gatea CI — si el componente introduce una violación
// ARIA real, el test falla.

const headers: Header[] = [
  { attributeName: "name", displayText: "Nombre" },
  { attributeName: "amount", displayText: "Monto" },
];

const rows: Row[] = [
  { id: "1", name: "Alice", amount: "10" },
  { id: "2", name: "Bob", amount: "20" },
];

describe("Table - accesibilidad (axe, ru-4)", () => {
  it("sin violaciones con encabezados y filas normales", async () => {
    const { container } = render(
      <Table headers={headers} rows={rows} options={{ label: "Gastos" }} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("sin violaciones con una celda en edición activa (input abierto)", async () => {
    const { container } = render(
      <Table headers={headers} rows={rows} options={{ label: "Gastos" }} />
    );
    const table = container.querySelector("table") as HTMLTableElement;
    const cell = screen.getByText("Alice").closest("td") as HTMLTableCellElement;
    fireEvent.click(cell);
    fireEvent.keyDown(table, { key: "Enter" });

    // Confirma que el editor está realmente abierto antes de auditar —si esto
    // fallara, el test de abajo estaría auditando la tabla en reposo sin darse
    // cuenta.
    expect(screen.getByRole("textbox")).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("sin violaciones con la tabla vacía (mensaje de 'sin datos')", async () => {
    const { container } = render(
      <Table headers={headers} rows={[]} options={{ label: "Gastos" }} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("sin violaciones con ordenamiento activo (options.sortable, botones en el header)", async () => {
    const { container } = render(
      <Table
        headers={headers}
        rows={rows}
        options={{ label: "Gastos", sortable: true }}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
