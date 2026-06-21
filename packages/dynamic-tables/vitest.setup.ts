import "@testing-library/jest-dom/vitest";

// La navegación por flechas usa `element.scrollIntoView` (reemplaza al antiguo
// `window.scrollBy` global e impredecible). jsdom no lo implementa; el
// componente lo invoca de forma defensiva (guarda con typeof), pero stubeamos
// igual para cubrir entornos que sí lo definan parcialmente.
if (typeof Element.prototype.scrollIntoView !== "function") {
  Element.prototype.scrollIntoView = () => {};
}
