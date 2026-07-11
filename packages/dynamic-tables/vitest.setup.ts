import "@testing-library/jest-dom/vitest";
import { expect } from "vitest";
import { toHaveNoViolations } from "jest-axe";

// jest-axe expone su matcher con la convención de Jest (`toHaveNoViolations`);
// no depende de ninguna API propia de Jest más allá de eso, así que registrarlo
// en `expect` de Vitest alcanza para usarlo en toda la suite (ver
// Table.a11y.test.tsx).
expect.extend(toHaveNoViolations);

// La navegación por flechas usa `element.scrollIntoView` (reemplaza al antiguo
// `window.scrollBy` global e impredecible). jsdom no lo implementa; el
// componente lo invoca de forma defensiva (guarda con typeof), pero stubeamos
// igual para cubrir entornos que sí lo definan parcialmente.
if (typeof Element.prototype.scrollIntoView !== "function") {
  Element.prototype.scrollIntoView = () => {};
}

// @tanstack/react-virtual (virtualización de filas, ver options.virtualized)
// llama a `scrollElement.scrollTo(...)` para traer un índice a la vista y
// espera el evento `scroll` resultante para recalcular qué filas renderizar.
// jsdom no implementa layout real: `scrollTo` es un no-op y nunca dispara
// `scroll`. Lo parcheamos para que mueva `scrollTop`/`scrollLeft` y emita el
// evento, así el comportamiento se puede probar de verdad en jsdom.
if (!("scrollTo" in Element.prototype) || true) {
  Element.prototype.scrollTo = function scrollTo(
    this: HTMLElement,
    optionsOrX?: ScrollToOptions | number,
    y?: number
  ) {
    if (typeof optionsOrX === "object" && optionsOrX !== null) {
      if (typeof optionsOrX.top === "number") this.scrollTop = optionsOrX.top;
      if (typeof optionsOrX.left === "number") this.scrollLeft = optionsOrX.left;
    } else if (typeof optionsOrX === "number") {
      this.scrollLeft = optionsOrX;
      if (typeof y === "number") this.scrollTop = y;
    }
    this.dispatchEvent(new Event("scroll"));
  };
}

// jsdom no calcula layout real: `offsetHeight`/`offsetWidth` son siempre 0.
// @tanstack/react-virtual (options.virtualized) lee ESTOS campos —no
// `getBoundingClientRect`— para medir el contenedor de scroll de forma
// síncrona al montar (antes incluso de que exista un ResizeObserver real),
// así que sin este parche el viewport medido es siempre 0px y no se
// renderiza ninguna fila. Devolvemos el alto/ancho fijado por `style` inline
// (options.height, que el componente siempre pasa) y delegamos al resto.
const offsetHeightDescriptor = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "offsetHeight"
);
const offsetWidthDescriptor = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "offsetWidth"
);
Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
  configurable: true,
  get(this: HTMLElement) {
    const styleHeight = parseFloat(this.style.height || "");
    if (!Number.isNaN(styleHeight)) return styleHeight;
    return offsetHeightDescriptor?.get?.call(this) ?? 0;
  },
});
Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
  configurable: true,
  get(this: HTMLElement) {
    const styleWidth = parseFloat(this.style.width || "");
    if (!Number.isNaN(styleWidth)) return styleWidth;
    // Ancho por defecto realista para que el virtualizador no colapse a 0
    // columnas visibles cuando el test no fija `width` explícito.
    return offsetWidthDescriptor?.get?.call(this) || 1024;
  },
});

// `scrollToIndex(count - 1)` (p. ej. wraparound de ArrowUp a la última fila)
// resuelve el offset máximo con `scrollElement.scrollHeight -
// scrollElement.clientHeight` —NO con las mediciones internas del
// virtualizador— así que sin parchear estos dos también, ese caso puntual
// sigue clampeando a 0 aunque `offsetHeight` ya esté corregido arriba.
const clientHeightDescriptor = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "clientHeight"
);
Object.defineProperty(HTMLElement.prototype, "clientHeight", {
  configurable: true,
  get(this: HTMLElement) {
    const styleHeight = parseFloat(this.style.height || "");
    if (!Number.isNaN(styleHeight)) return styleHeight;
    return clientHeightDescriptor?.get?.call(this) ?? 0;
  },
});
Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
  configurable: true,
  get() {
    // No hay layout real que sumar: un valor grande fijo alcanza para que
    // `scrollHeight - clientHeight` nunca clampee a 0 con los datasets de
    // los tests (miles de filas cuanto mucho).
    return 10_000_000;
  },
});

// jsdom no implementa ResizeObserver y @tanstack/react-virtual lo referencia
// al montar (auto-remedición del contenedor de scroll cuando cambia de
// tamaño). Con el parche de arriba la medición SÍNCRONA inicial ya es
// correcta, así que acá alcanza con un stub inerte que evite el
// `ReferenceError` de la API faltante.
if (typeof globalThis.ResizeObserver === "undefined") {
  class ResizeObserverStub implements ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}
