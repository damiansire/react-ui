import { describe, it, expect } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { createElement } from "react";
import Table from "./Table";
import { Header } from "./interfaces/Header";
import { Row } from "./interfaces/Row";

// ru-2: benchmark real (no estimado) de render con 10k+ filas, con y sin
// virtualización. No es un test de regresión de performance con umbral
// estricto (jsdom no tiene el motor de layout real de un browser, así que
// los tiempos absolutos no son comparables 1:1 con producción) — es la
// evidencia empírica de que `options.virtualized` reduce drásticamente el
// trabajo de render, que es justo lo que el ADR 0001 pedía medir antes de
// poder defender la decisión de mantener una tabla propia.
//
// El número real medido en esta máquina se documenta en el README del
// paquete (sección "Rendimiento").

const ROW_COUNT = 10_000;

const headers: Header[] = [
  { attributeName: "name", displayText: "Nombre" },
  { attributeName: "email", displayText: "Email" },
  { attributeName: "amount", displayText: "Monto" },
];

const bigRows: Row[] = Array.from({ length: ROW_COUNT }, (_, i) => ({
  id: String(i),
  name: `Usuario ${i}`,
  email: `usuario${i}@ejemplo.com`,
  amount: String(i * 1.5),
}));

const measureRender = (element: ReturnType<typeof createElement>): number => {
  const start = performance.now();
  const view = render(element);
  const elapsed = performance.now() - start;
  view.unmount();
  cleanup();
  return elapsed;
};

describe("Table - benchmark de render con 10k+ filas (ru-2)", () => {
  it(`monta ${ROW_COUNT} filas SIN virtualización y lo documenta en consola`, () => {
    const ms = measureRender(
      createElement(Table, { headers, rows: bigRows })
    );
    // eslint-disable-next-line no-console
    console.log(
      `[benchmark] ${ROW_COUNT} filas SIN virtualizar: ${ms.toFixed(2)}ms`
    );
    expect(ms).toBeGreaterThan(0);
  });

  it(`monta ${ROW_COUNT} filas CON virtualización y lo documenta en consola`, () => {
    const ms = measureRender(
      createElement(Table, {
        headers,
        rows: bigRows,
        options: { virtualized: true, rowHeight: 37, height: 500 },
      })
    );
    // eslint-disable-next-line no-console
    console.log(
      `[benchmark] ${ROW_COUNT} filas CON virtualizar: ${ms.toFixed(2)}ms`
    );
    expect(ms).toBeGreaterThan(0);
  });

  it("con virtualización, monta un orden de magnitud menos nodos <tr> que sin ella", () => {
    const { container: withoutVirtualization } = render(
      createElement(Table, { headers, rows: bigRows })
    );
    const rowsWithout = withoutVirtualization.querySelectorAll(
      "tbody tr[row-id]"
    ).length;
    expect(rowsWithout).toBe(ROW_COUNT);
    cleanup();

    const { container: withVirtualization } = render(
      createElement(Table, {
        headers,
        rows: bigRows,
        options: { virtualized: true, rowHeight: 37, height: 500 },
      })
    );
    const rowsWith = withVirtualization.querySelectorAll(
      "tbody tr[row-id]"
    ).length;
    cleanup();

    // El viewport (500px / 37px por fila ≈ 14 filas) + overscan (6 default)
    // es un puñado de filas, muy lejos de las 10.000 reales.
    expect(rowsWith).toBeLessThan(100);
    expect(rowsWith).toBeLessThan(rowsWithout / 100);
  });
});
