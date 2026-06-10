import { vi } from 'vitest';

// Проверяем, что мы находимся в окружении DOM (jsdom/happy-dom)
if (typeof window !== 'undefined') {
  // 1. Полифил для matchMedia (Таига UI использует для адаптивности)
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  }

  // 2. Полифил для IntersectionObserver (Критично для бесконечных скроллов, выпадашек Taiga)
  if (!window.IntersectionObserver) {
    class IntersectionObserverMock {
      observe = vi.fn();
      disconnect = vi.fn();
      unobserve = vi.fn();
    }
    Object.defineProperty(window, 'IntersectionObserver', {
      writable: true,
      configurable: true,
      value: IntersectionObserverMock,
    });
  }

  // 3. Полифил для ResizeObserver (Используется Taiga UI для калькуляции размеров меню)
  if (!window.ResizeObserver) {
    class ResizeObserverMock {
      observe = vi.fn();
      disconnect = vi.fn();
      unobserve = vi.fn();
    }
    Object.defineProperty(window, 'ResizeObserver', {
      writable: true,
      configurable: true,
      value: ResizeObserverMock,
    });
  }
}
