import { describe, it, expect } from "vitest";
import {
  getHeadersFromRows,
  getWrappedIndex,
  isWritableCharacter,
  nextSortDirection,
  compareCellValues,
  sortRows,
} from "./tableHelp";
import { Row } from "../interfaces/Row";

describe("getHeadersFromRows", () => {
  it("deduplica claves entre filas heterogéneas", () => {
    const rows: Row[] = [
      { id: "1", name: "A", amount: "10" },
      { id: "2", name: "B", description: "x" },
    ];
    const headers = getHeadersFromRows(rows);
    const names = headers.map((h) => h.attributeName);
    expect(names).toEqual(["name", "amount", "description"]);
  });

  it("excluye la columna interna 'id'", () => {
    const rows: Row[] = [{ id: "1", name: "A" }];
    const headers = getHeadersFromRows(rows);
    expect(headers.map((h) => h.attributeName)).not.toContain("id");
  });

  it("devuelve [] cuando no hay filas", () => {
    expect(getHeadersFromRows([])).toEqual([]);
  });
});

describe("getWrappedIndex", () => {
  it("avanza y vuelve al inicio (wraparound hacia adelante)", () => {
    expect(getWrappedIndex(2, 1, 3)).toBe(0);
  });

  it("retrocede desde 0 al final (wraparound hacia atrás)", () => {
    expect(getWrappedIndex(0, -1, 3)).toBe(2);
  });

  it("no produce NaN cuando length es 0", () => {
    expect(getWrappedIndex(0, 1, 0)).toBe(0);
    expect(getWrappedIndex(5, -1, 0)).toBe(5);
  });
});

describe("isWritableCharacter", () => {
  const base = { ctrlKey: false, metaKey: false, altKey: false };

  it("acepta letras, números, espacio y Unicode", () => {
    expect(isWritableCharacter({ ...base, key: "a" })).toBe(true);
    expect(isWritableCharacter({ ...base, key: "1" })).toBe(true);
    expect(isWritableCharacter({ ...base, key: " " })).toBe(true);
    expect(isWritableCharacter({ ...base, key: "ñ" })).toBe(true);
    expect(isWritableCharacter({ ...base, key: "é" })).toBe(true);
  });

  it("rechaza teclas de control (longitud > 1)", () => {
    expect(isWritableCharacter({ ...base, key: "ArrowLeft" })).toBe(false);
    expect(isWritableCharacter({ ...base, key: "Enter" })).toBe(false);
  });

  it("rechaza combinaciones con modificadores", () => {
    expect(isWritableCharacter({ ...base, key: "a", ctrlKey: true })).toBe(false);
    expect(isWritableCharacter({ ...base, key: "a", metaKey: true })).toBe(false);
    expect(isWritableCharacter({ ...base, key: "a", altKey: true })).toBe(false);
  });
});

describe("nextSortDirection", () => {
  it("cicla null → asc → desc → null", () => {
    expect(nextSortDirection(null)).toBe("asc");
    expect(nextSortDirection("asc")).toBe("desc");
    expect(nextSortDirection("desc")).toBe(null);
  });
});

describe("compareCellValues", () => {
  it("compara numéricamente cuando ambos son números (o strings numéricos)", () => {
    // Lexicográficamente "10" < "9"; numéricamente 9 < 10. Debe ser numérico.
    expect(compareCellValues("9", "10")).toBeLessThan(0);
    expect(compareCellValues(10, 9)).toBeGreaterThan(0);
    expect(compareCellValues("2.5", "2.5")).toBe(0);
  });

  it("compara como texto cuando algún valor no es numérico", () => {
    expect(compareCellValues("Ana", "Bruno")).toBeLessThan(0);
    expect(compareCellValues("Bruno", "Ana")).toBeGreaterThan(0);
    // Un número y un texto → cae a comparación de texto, no rompe.
    expect(typeof compareCellValues("10", "diez")).toBe("number");
  });

  it("trata el string vacío como texto (no como 0)", () => {
    // "" no debe colar como numérico y ordenar antes que números negativos.
    expect(compareCellValues("", "5")).toBe("".localeCompare("5"));
  });
});

describe("sortRows", () => {
  const rows: Row[] = [
    { id: "1", name: "Bruno", amount: "20" },
    { id: "2", name: "Ana", amount: "100" },
    { id: "3", name: "Ana", amount: "9" },
  ];

  it("ordena ascendente por texto sin mutar el array original", () => {
    const original = [...rows];
    const sorted = sortRows(rows, "name", "asc");
    expect(sorted.map((r) => r.id)).toEqual(["2", "3", "1"]);
    expect(rows).toEqual(original); // no mutó la entrada
  });

  it("ordena numéricamente (no lexicográficamente) por columna de números-string", () => {
    const sorted = sortRows(rows, "amount", "asc");
    expect(sorted.map((r) => r.amount)).toEqual(["9", "20", "100"]);
  });

  it("desc invierte el orden", () => {
    const sorted = sortRows(rows, "amount", "desc");
    expect(sorted.map((r) => r.amount)).toEqual(["100", "20", "9"]);
  });

  it("es estable: filas con igual valor conservan su orden original", () => {
    // "2" (Ana) y "3" (Ana) empatan por name; "2" venía antes → sigue antes.
    const sorted = sortRows(rows, "name", "asc");
    const anas = sorted.filter((r) => r.name === "Ana").map((r) => r.id);
    expect(anas).toEqual(["2", "3"]);
  });
});
