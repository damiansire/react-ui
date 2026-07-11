import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Table from "./Table";
import { Header } from "./interfaces/Header";
import { Row } from "./interfaces/Row";

// ru-2: sin `options.virtualized`, el componente monta TODAS las filas al DOM
// (comportamiento histórico, cubierto por Table.test.tsx). Estos tests
// cubren el modo opt-in: con datasets grandes, solo se monta el viewport
// visible (+ overscan), y la navegación por teclado sigue funcionando aunque
// la fila destino no esté montada todavía (debe traerla a la vista y luego
// enfocarla).

const headers: Header[] = [{ attributeName: "name", displayText: "Nombre" }];

const manyRows: Row[] = Array.from({ length: 500 }, (_, i) => ({
  id: String(i),
  name: `Fila ${i}`,
}));

describe("Table - virtualización (options.virtualized)", () => {
  it("sin la opción, renderiza las 500 filas completas (comportamiento por defecto)", () => {
    const { container } = render(<Table headers={headers} rows={manyRows} />);
    expect(container.querySelectorAll("tbody tr[row-id]").length).toBe(500);
  });

  it("con la opción activa, monta muchas menos filas de las 500 totales", () => {
    const { container } = render(
      <Table
        headers={headers}
        rows={manyRows}
        options={{ virtualized: true, rowHeight: 32, height: 300, overscan: 4 }}
      />
    );
    const mountedRows = container.querySelectorAll("tbody tr[row-id]");
    expect(mountedRows.length).toBeGreaterThan(0);
    // Ni cerca de las 500: la ventana visible + overscan es un puñado de filas.
    expect(mountedRows.length).toBeLessThan(50);
  });

  it("el contenedor de scroll reserva el alto TOTAL de las 500 filas vía filas espaciadoras", () => {
    const { container } = render(
      <Table
        headers={headers}
        rows={manyRows}
        options={{ virtualized: true, rowHeight: 32, height: 300, overscan: 4 }}
      />
    );
    const scrollContainer = container.querySelector(
      ".table-scroll-container"
    ) as HTMLElement;
    expect(scrollContainer).toBeInTheDocument();

    // Suma de: filas montadas (32px c/u) + espaciadoras top/bottom == 500*32.
    const spacerRows = Array.from(
      container.querySelectorAll('tbody tr[aria-hidden="true"]')
    ) as HTMLTableRowElement[];
    const spacerHeight = spacerRows.reduce(
      (sum, tr) => sum + parseFloat(tr.style.height || "0"),
      0
    );
    const mountedCount = container.querySelectorAll("tbody tr[row-id]").length;
    expect(spacerHeight + mountedCount * 32).toBeCloseTo(500 * 32, 0);
  });

  it("la fila 0 sigue siendo seleccionable con click (dentro del viewport inicial)", () => {
    render(
      <Table
        headers={headers}
        rows={manyRows}
        options={{ virtualized: true, rowHeight: 32, height: 300 }}
      />
    );
    const cell = screen.getByText("Fila 0").closest("td") as HTMLTableCellElement;
    fireEvent.click(cell);
    expect(cell).toHaveClass("selected");
  });

  it("navega con flechas más allá del viewport virtualizado: la fila se monta y recibe foco", async () => {
    const { container } = render(
      <Table
        headers={headers}
        rows={manyRows}
        options={{ virtualized: true, rowHeight: 32, height: 300, overscan: 4 }}
      />
    );
    const table = container.querySelector("table") as HTMLTableElement;

    const firstCell = screen
      .getByText("Fila 0")
      .closest("td") as HTMLTableCellElement;
    fireEvent.click(firstCell);
    expect(firstCell).toHaveClass("selected");

    // La última fila (índice 499) no está montada al arrancar.
    expect(screen.queryByText("Fila 499")).not.toBeInTheDocument();

    // ArrowUp desde la primera fila hace wraparound a la última (mismo
    // contrato que la tabla no-virtualizada, ver Table.test.tsx).
    fireEvent.keyDown(table, { key: "ArrowUp" });

    await waitFor(() => {
      const lastCell = screen
        .getByText("Fila 499")
        .closest("td") as HTMLTableCellElement;
      expect(lastCell).toHaveClass("selected");
      expect(lastCell).toHaveFocus();
    });
  });

  it("la edición sigue funcionando sobre una celda montada por virtualización", async () => {
    const { container } = render(
      <Table
        headers={headers}
        rows={manyRows}
        options={{ virtualized: true, rowHeight: 32, height: 300, overscan: 4 }}
      />
    );
    const table = container.querySelector("table") as HTMLTableElement;
    const firstCell = screen
      .getByText("Fila 0")
      .closest("td") as HTMLTableCellElement;
    fireEvent.click(firstCell);
    fireEvent.keyDown(table, { key: "Enter" });

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("Fila 0");
  });
});
