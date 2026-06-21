import { describe, it, expect } from "vitest";
import {
  getHeadersFromRows,
  getWrappedIndex,
  isWritableCharacter,
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
