import "@testing-library/jest-dom/vitest";

// jsdom no implementa window.scrollBy; el componente lo invoca en la
// navegacion por flechas. Lo neutralizamos para no ensuciar la salida de
// los tests (el reemplazo opt-in del side-effect es trabajo de Fase 3).
window.scrollBy = () => {};
