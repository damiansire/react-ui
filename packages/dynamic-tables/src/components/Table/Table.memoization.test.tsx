/**
 * Regresión del memo de `Cell` (perf): tipear en el editor cambia el borrador
 * en la raíz de la tabla; sin `memo`, cada tecla volvía a ejecutar el cuerpo
 * de TODAS las celdas (re-reconciliación del cuerpo entero). Con `memo` y
 * props estables, solo la celda en edición se re-renderiza.
 *
 * Instrumentación: el cuerpo de `Cell` crea su `<td>` vía el JSX runtime
 * (esbuild `jsx: "automatic"`); si `memo` saltea el render, esa llamada no
 * ocurre. Contamos creaciones de elementos `"td"` envolviendo el runtime con
 * un wrapper pasante. Vive en archivo propio para que el mock del runtime no
 * toque al resto de la suite.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Table from "./Table";
import type { Header } from "./interfaces/Header";
import type { Row } from "./interfaces/Row";

const counters = vi.hoisted(() => ({ tdCreations: 0 }));

vi.mock("react/jsx-runtime", async (importOriginal) => {
  const mod = await importOriginal<typeof import("react/jsx-runtime")>();
  const count = (type: unknown) => {
    if (type === "td") counters.tdCreations += 1;
  };
  return {
    ...mod,
    jsx: (type: unknown, props: unknown, key: unknown) => {
      count(type);
      return (mod.jsx as CallableFunction)(type, props, key);
    },
    jsxs: (type: unknown, props: unknown, key: unknown) => {
      count(type);
      return (mod.jsxs as CallableFunction)(type, props, key);
    },
  };
});

vi.mock("react/jsx-dev-runtime", async (importOriginal) => {
  const mod =
    await importOriginal<typeof import("react/jsx-dev-runtime")>();
  return {
    ...mod,
    jsxDEV: (type: unknown, ...rest: unknown[]) => {
      if (type === "td") counters.tdCreations += 1;
      return (mod.jsxDEV as CallableFunction)(type, ...rest);
    },
  };
});

const headers: Header[] = [
  { attributeName: "name", displayText: "Nombre" },
  { attributeName: "amount", displayText: "Monto" },
];

const ROW_COUNT = 120;
const rows: Row[] = Array.from({ length: ROW_COUNT }, (_, i) => ({
  id: `r${i}`,
  name: `Nombre ${i}`,
  amount: String(i),
}));

describe("Regresión - tipear no re-renderiza las celdas ajenas a la edición", () => {
  it("una tecla en el editor ejecuta el cuerpo de O(1) celdas, no de todas", () => {
    const { container } = render(<Table headers={headers} rows={rows} />);
    const table = container.querySelector("table") as HTMLTableElement;
    const firstCell = screen
      .getByText("Nombre 0")
      .closest("td") as HTMLTableCellElement;

    fireEvent.click(firstCell);
    fireEvent.keyDown(table, { key: "Enter" });
    const input = screen.getByRole("textbox") as HTMLInputElement;

    // Sanidad de la instrumentación: el montaje sí pasó por el wrapper
    // (ROW_COUNT filas × 2 columnas de <td> como mínimo). Si esto falla, el
    // conteo de abajo estaría midiendo un runtime que la tabla no usa.
    expect(counters.tdCreations).toBeGreaterThan(ROW_COUNT);

    counters.tdCreations = 0;
    fireEvent.change(input, { target: { value: "Zoe" } });

    // La tecla llegó de verdad al editor.
    expect(input.value).toBe("Zoe");
    // Sin `memo` este render creaba ~ROW_COUNT × 2 <td> (240). Con `memo` y
    // props estables: la celda en edición más el emptyRow del cuerpo (~2).
    expect(counters.tdCreations).toBeLessThan(10);
  });
});
