import { render, screen, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SwipeNavigator, swipeDisabledRef } from "./SwipeNavigator";

const mocks = vi.hoisted(() => ({
  pushMock: vi.fn(),
  pathname: "/dashboard",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({ push: mocks.pushMock }),
}));

// framer-motion causa problemas em jsdom — substitui por div simples
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

/**
 * Captura os handlers registrados no document e os invoca diretamente,
 * evitando dependência de suporte nativo a TouchEvent no jsdom.
 */
function setupSwipeCapture() {
  let startHandler: ((e: unknown) => void) | null = null;
  let endHandler: ((e: unknown) => void) | null = null;

  const originalAdd = document.addEventListener.bind(document);
  const spy = vi.spyOn(document, "addEventListener").mockImplementation((type, handler, opts) => {
    if (type === "touchstart") startHandler = handler as (e: unknown) => void;
    else if (type === "touchend") endHandler = handler as (e: unknown) => void;
    else originalAdd(type, handler as EventListener, opts as AddEventListenerOptions);
  });

  const swipe = (dx: number, dy = 0) => {
    act(() => {
      startHandler?.({ touches: [{ clientX: 200, clientY: 200 }] });
      endHandler?.({ changedTouches: [{ clientX: 200 + dx, clientY: 200 + dy }] });
    });
  };

  const restore = () => spy.mockRestore();

  return { swipe, restore };
}

describe("SwipeNavigator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.pathname = "/dashboard";
    swipeDisabledRef.current = false;
  });

  it("renderiza os filhos passados", () => {
    const { swipe, restore } = setupSwipeCapture();
    render(<SwipeNavigator><p>conteúdo</p></SwipeNavigator>);
    expect(screen.getByText("conteúdo")).toBeInTheDocument();
    swipe(0); // silencia variavel nao usada
    restore();
  });

  describe("navegacao em /dashboard (index 1)", () => {
    it("navega para /dashboard/profile ao arrastar para esquerda (dx=-80)", () => {
      const { swipe, restore } = setupSwipeCapture();
      render(<SwipeNavigator><p>x</p></SwipeNavigator>);
      swipe(-80);
      expect(mocks.pushMock).toHaveBeenCalledWith("/dashboard/profile");
      restore();
    });

    it("navega para /dashboard/card ao arrastar para direita (dx=+80)", () => {
      const { swipe, restore } = setupSwipeCapture();
      render(<SwipeNavigator><p>x</p></SwipeNavigator>);
      swipe(80);
      expect(mocks.pushMock).toHaveBeenCalledWith("/dashboard/card");
      restore();
    });
  });

  describe("limites do NAV_ORDER", () => {
    it("nao navega para antes da primeira rota (/dashboard/card)", () => {
      mocks.pathname = "/dashboard/card";
      const { swipe, restore } = setupSwipeCapture();
      render(<SwipeNavigator><p>x</p></SwipeNavigator>);
      swipe(80);
      expect(mocks.pushMock).not.toHaveBeenCalled();
      restore();
    });

    it("nao navega para alem da ultima rota (/dashboard/profile)", () => {
      mocks.pathname = "/dashboard/profile";
      const { swipe, restore } = setupSwipeCapture();
      render(<SwipeNavigator><p>x</p></SwipeNavigator>);
      swipe(-80);
      expect(mocks.pushMock).not.toHaveBeenCalled();
      restore();
    });
  });

  describe("limiares de ativacao", () => {
    it("nao navega quando dx esta abaixo de 60px (dx=-59)", () => {
      const { swipe, restore } = setupSwipeCapture();
      render(<SwipeNavigator><p>x</p></SwipeNavigator>);
      swipe(-59);
      expect(mocks.pushMock).not.toHaveBeenCalled();
      restore();
    });

    it("navega exatamente no limite de 60px (dx=-60)", () => {
      const { swipe, restore } = setupSwipeCapture();
      render(<SwipeNavigator><p>x</p></SwipeNavigator>);
      swipe(-60);
      expect(mocks.pushMock).toHaveBeenCalledWith("/dashboard/profile");
      restore();
    });

    it("nao navega quando movimento e predominantemente vertical (|dy| > |dx|)", () => {
      const { swipe, restore } = setupSwipeCapture();
      render(<SwipeNavigator><p>x</p></SwipeNavigator>);
      swipe(-80, 100); // scroll vertical — dy > dx
      expect(mocks.pushMock).not.toHaveBeenCalled();
      restore();
    });

    it("navega quando movimento e diagonal mas horizontal e dominante", () => {
      const { swipe, restore } = setupSwipeCapture();
      render(<SwipeNavigator><p>x</p></SwipeNavigator>);
      swipe(-90, 40); // dx > dy, deve navegar
      expect(mocks.pushMock).toHaveBeenCalledWith("/dashboard/profile");
      restore();
    });
  });

  describe("rotas fora do NAV_ORDER", () => {
    it("nao navega a partir de /dashboard/documents", () => {
      mocks.pathname = "/dashboard/documents";
      const { swipe, restore } = setupSwipeCapture();
      render(<SwipeNavigator><p>x</p></SwipeNavigator>);
      swipe(-80);
      expect(mocks.pushMock).not.toHaveBeenCalled();
      restore();
    });

    it("nao navega a partir de /dashboard/request-license", () => {
      mocks.pathname = "/dashboard/request-license";
      const { swipe, restore } = setupSwipeCapture();
      render(<SwipeNavigator><p>x</p></SwipeNavigator>);
      swipe(80);
      expect(mocks.pushMock).not.toHaveBeenCalled();
      restore();
    });

    it("nao navega a partir de rotas arbitrarias", () => {
      mocks.pathname = "/qualquer-rota";
      const { swipe, restore } = setupSwipeCapture();
      render(<SwipeNavigator><p>x</p></SwipeNavigator>);
      swipe(-200);
      expect(mocks.pushMock).not.toHaveBeenCalled();
      restore();
    });
  });

  describe("swipeDisabledRef", () => {
    it("ignora o swipe quando swipeDisabledRef.current e true", () => {
      swipeDisabledRef.current = true;
      const { swipe, restore } = setupSwipeCapture();
      render(<SwipeNavigator><p>x</p></SwipeNavigator>);
      swipe(-80);
      expect(mocks.pushMock).not.toHaveBeenCalled();
      restore();
    });

    it("processa o swipe normalmente quando swipeDisabledRef.current e false", () => {
      swipeDisabledRef.current = false;
      const { swipe, restore } = setupSwipeCapture();
      render(<SwipeNavigator><p>x</p></SwipeNavigator>);
      swipe(-80);
      expect(mocks.pushMock).toHaveBeenCalledWith("/dashboard/profile");
      restore();
    });
  });

  describe("touchstart sem touchend", () => {
    it("nao navega se o touchend nunca ocorre", () => {
      let startHandler: ((e: unknown) => void) | null = null;
      const spy = vi.spyOn(document, "addEventListener").mockImplementation((type, handler) => {
        if (type === "touchstart") startHandler = handler as (e: unknown) => void;
      });

      render(<SwipeNavigator><p>x</p></SwipeNavigator>);
      act(() => { startHandler?.({ touches: [{ clientX: 200, clientY: 200 }] }); });

      expect(mocks.pushMock).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
