/**
 * Regresiones de defectos reales encontrados en auditoría. Cada test nombra el
 * síntoma que reproducía el bug: si alguno vuelve a fallar, el defecto volvió.
 */
import { StrictMode } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import Table from "./Table";
import type { Header } from "./interfaces/Header";
import type { Row } from "./interfaces/Row";

const headers: Header[] = [
  { attributeName: "name", displayText: "Nombre" },
  { attributeName: "amount", displayText: "Monto" },
];

const rows: Row[] = [
  { id: "1", name: "Alice", amount: "10" },
  { id: "2", name: "Bob", amount: "20" },
];

const cellOf = (text: string) =>
  screen.getByText(text).closest("td") as HTMLTableCellElement;

const columnValues = (container: HTMLElement, columnId: string): string[] =>
  Array.from(
    container.querySelectorAll(`tbody td[column-id="${columnId}"]`)
  ).map((node) => node.textContent ?? "");

describe("Regresión - el commit de una edición es un efecto, no un updater", () => {
  it("bajo StrictMode, onCellEdit se dispara UNA sola vez por commit", () => {
    const onCellEdit = vi.fn();
    const { container } = render(
      <StrictMode>
        <Table headers={headers} rows={rows} options={{ onCellEdit }} />
      </StrictMode>
    );
    const table = container.querySelector("table") as HTMLTableElement;

    fireEvent.click(cellOf("Alice"));
    fireEvent.keyDown(table, { key: "Enter" });
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Alicia" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onCellEdit).toHaveBeenCalledTimes(1);
    expect(onCellEdit).toHaveBeenCalledWith("1", "name", "Alicia");
  });
});

describe("Regresión - el foco vuelve a la celda al cerrar el editor", () => {
  it("tras confirmar con Enter el foco queda en la celda, no en <body>", () => {
    const { container } = render(<Table headers={headers} rows={rows} />);
    const table = container.querySelector("table") as HTMLTableElement;
    const cell = cellOf("Alice");

    fireEvent.click(cell);
    fireEvent.keyDown(table, { key: "Enter" });
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Alicia" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(document.activeElement).toBe(cellOf("Alicia"));
  });

  it("y el teclado sigue vivo: una flecha sobre el elemento enfocado mueve la selección", () => {
    const { container } = render(<Table headers={headers} rows={rows} />);
    const table = container.querySelector("table") as HTMLTableElement;

    fireEvent.click(cellOf("Alice"));
    fireEvent.keyDown(table, { key: "Enter" });
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Alicia" } });
    fireEvent.keyDown(input, { key: "Enter" });

    // Sin target explícito: el evento sale del elemento realmente enfocado.
    fireEvent.keyDown(document.activeElement as HTMLElement, {
      key: "ArrowDown",
    });

    expect(cellOf("Bob")).toHaveClass("selected");
  });
});

describe("Regresión - el teclado del encabezado no lo intercepta la grilla", () => {
  it("Enter y Space sobre el botón de ordenar conservan la activación nativa", () => {
    render(
      <Table headers={headers} rows={rows} options={{ sortable: true }} />
    );
    // Con una celda ya seleccionada: es el caso en el que los handlers de la
    // grilla se quedaban con la tecla del encabezado.
    fireEvent.click(cellOf("Alice"));
    const button = screen.getByRole("button", { name: /Nombre/ });

    // fireEvent devuelve false si el handler llamó preventDefault: eso es lo
    // que cancelaba el click nativo del <button> y hacía inaccesible el orden.
    expect(fireEvent.keyDown(button, { key: "Enter" })).toBe(true);
    expect(fireEvent.keyDown(button, { key: " " })).toBe(true);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("tabular hasta el botón de ordenar no selecciona una celda ajena", () => {
    render(
      <Table headers={headers} rows={rows} options={{ sortable: true }} />
    );
    fireEvent.focus(screen.getByRole("button", { name: /Nombre/ }));

    expect(screen.getByRole("status")).toHaveTextContent(
      "Sin celda seleccionada"
    );
  });
});

describe("Regresión - clickear dentro del editor no destruye la selección", () => {
  it("el click en el input conserva la celda seleccionada", () => {
    const { container } = render(<Table headers={headers} rows={rows} />);
    const table = container.querySelector("table") as HTMLTableElement;

    fireEvent.click(cellOf("Alice"));
    fireEvent.keyDown(table, { key: "Enter" });
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.click(input);

    const selected = container.querySelector("tbody td.selected");
    expect(selected).not.toBeNull();
    expect(selected).toBe(input.closest("td"));
    expect(screen.getByRole("status")).not.toHaveTextContent(
      "Sin celda seleccionada"
    );
  });
});

describe("Regresión - la prop `rows` le gana al estado interno de edición", () => {
  it("un rerender con otro valor para la celda editada muestra el valor de la prop", () => {
    const { container, rerender } = render(
      <Table headers={headers} rows={rows} />
    );
    const table = container.querySelector("table") as HTMLTableElement;

    fireEvent.click(cellOf("Alice"));
    fireEvent.keyDown(table, { key: "Enter" });
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Alicia" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText("Alicia")).toBeInTheDocument();

    // El consumidor persiste y devuelve otro valor (normalizado o rechazado).
    rerender(
      <Table
        headers={headers}
        rows={[
          { id: "1", name: "SERVIDOR", amount: "10" },
          { id: "2", name: "Bob", amount: "20" },
        ]}
      />
    );

    expect(screen.getByText("SERVIDOR")).toBeInTheDocument();
    expect(screen.queryByText("Alicia")).not.toBeInTheDocument();
  });

  it("mientras la prop no cambie, la edición local se conserva", () => {
    const { container, rerender } = render(
      <Table headers={headers} rows={rows} />
    );
    const table = container.querySelector("table") as HTMLTableElement;

    fireEvent.click(cellOf("Alice"));
    fireEvent.keyDown(table, { key: "Enter" });
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Alicia" } });
    fireEvent.keyDown(input, { key: "Enter" });

    // Mismos datos, otra identidad de array (rerender cualquiera del host).
    rerender(<Table headers={headers} rows={rows.map((row) => ({ ...row }))} />);

    expect(screen.getByText("Alicia")).toBeInTheDocument();
  });
});

describe("Regresión - el orden usa los valores que se ven", () => {
  it("ordenar por una columna editada usa el valor editado, no el original", () => {
    const sortRowsData: Row[] = [
      { id: "1", name: "Ana", amount: "1" },
      { id: "2", name: "Bruno", amount: "2" },
      { id: "3", name: "Carla", amount: "3" },
    ];
    const { container } = render(
      <Table
        headers={headers}
        rows={sortRowsData}
        options={{ sortable: true }}
      />
    );
    const table = container.querySelector("table") as HTMLTableElement;

    fireEvent.click(cellOf("1"));
    fireEvent.keyDown(table, { key: "Enter" });
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "999" } });
    fireEvent.keyDown(input, { key: "Enter" });

    fireEvent.click(screen.getByRole("button", { name: /Monto/ }));

    expect(columnValues(container, "amount")).toEqual(["2", "3", "999"]);
  });
});

describe("Regresión - el editor no deja el estado colgado al desmontarse", () => {
  it("si la fila en edición deja de renderizarse, la tabla sigue aceptando teclado", () => {
    const onCellEdit = vi.fn();
    const { container, rerender } = render(
      <Table headers={headers} rows={rows} options={{ onCellEdit }} />
    );
    const table = container.querySelector("table") as HTMLTableElement;

    fireEvent.click(cellOf("Alice"));
    fireEvent.keyDown(table, { key: "Enter" });
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Alicia" } });

    // El host deja de renderizar la fila en edición: el <input> se desmonta
    // sin pasar por blur.
    rerender(
      <Table
        headers={headers}
        rows={[{ id: "2", name: "Bob", amount: "20" }]}
        options={{ onCellEdit }}
      />
    );

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(onCellEdit).toHaveBeenCalledTimes(1);
    expect(onCellEdit).toHaveBeenCalledWith("1", "name", "Alicia");

    // Lo que estaba roto: `editing` quedaba no-nulo y ambos handlers de teclado
    // cortaban en seco, así que la tabla ya no abría ningún editor.
    fireEvent.click(cellOf("Bob"));
    fireEvent.keyDown(table, { key: "x" });
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });
});

describe("Regresión - resolver una celda es O(1), no un escaneo de `rows`", () => {
  it("el render no escanea `rows` una vez por celda", () => {
    const ROW_COUNT = 150;
    let idReads = 0;
    const countingRows: Row[] = Array.from({ length: ROW_COUNT }, (_, i) =>
      Object.defineProperties({} as Row, {
        id: {
          enumerable: true,
          get() {
            idReads += 1;
            return `r${i}`;
          },
        },
        name: { enumerable: true, writable: true, value: `Nombre ${i}` },
        amount: { enumerable: true, writable: true, value: String(i) },
      })
    );

    const { container } = render(
      <Table headers={headers} rows={countingRows} />
    );
    expect(
      within(container).getAllByRole("row").length
    ).toBeGreaterThan(ROW_COUNT - 1);

    // Con un `find` por celda las lecturas eran O(filas² × columnas): ~22.000
    // para este caso. Con índice por id son unas pocas por fila.
    expect(idReads).toBeLessThan(ROW_COUNT * 12);
  });
});
