import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import BusRoutesPage from "./page";

vi.mock("@/components/bus/BusHeader", () => ({
  BusHeader: () => <header data-testid="bus-header">header</header>,
}));
vi.mock("@/components/bus/BusSkeleton", () => ({
  BusSkeleton: () => <div data-testid="skeleton">carregando</div>,
}));
vi.mock("@/components/bus/BusEmpty", () => ({
  BusEmpty: () => <div data-testid="empty">Nenhuma rota disponível</div>,
}));
vi.mock("@/components/bus/BusError", () => ({
  BusError: () => <div data-testid="error">Erro ao carregar rotas</div>,
}));
vi.mock("@/components/bus/BusCard", () => ({
  BusCard: ({ route }: { route: { identifier: string } }) => (
    <div data-testid="bus-card">{route.identifier}</div>
  ),
}));

const makeRoute = (id: string, identifier: string) => ({
  _id: id,
  identifier,
  capacity: 40,
  universityIds: [],
});

describe("BusRoutesPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("exibe skeleton enquanto a requisicao nao completa", () => {
    vi.stubGlobal("fetch", () => new Promise(() => {}));
    render(<BusRoutesPage />);
    expect(screen.getByTestId("skeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("empty")).not.toBeInTheDocument();
    expect(screen.queryByTestId("error")).not.toBeInTheDocument();
  });

  it("exibe lista de rotas quando fetch retorna dados", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([makeRoute("1", "VRG-01"), makeRoute("2", "VRG-02")]),
      }),
    );

    render(<BusRoutesPage />);

    await waitFor(() => expect(screen.queryByTestId("skeleton")).not.toBeInTheDocument());
    expect(screen.getAllByTestId("bus-card")).toHaveLength(2);
    expect(screen.getByText("VRG-01")).toBeInTheDocument();
    expect(screen.getByText("VRG-02")).toBeInTheDocument();
  });

  it("exibe '2 rotas ativas' no plural", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([makeRoute("1", "VRG-01"), makeRoute("2", "VRG-02")]),
      }),
    );

    render(<BusRoutesPage />);
    await waitFor(() => expect(screen.getByText(/2 rotas ativas/)).toBeInTheDocument());
  });

  it("exibe '1 rota ativa' no singular", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([makeRoute("1", "VRG-01")]),
      }),
    );

    render(<BusRoutesPage />);
    await waitFor(() => expect(screen.getByText(/1 rota ativa/)).toBeInTheDocument());
    expect(screen.queryByText(/rotas ativas/)).not.toBeInTheDocument();
  });

  it("exibe estado vazio quando api retorna array vazio", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      }),
    );

    render(<BusRoutesPage />);
    await waitFor(() => expect(screen.getByTestId("empty")).toBeInTheDocument());
    expect(screen.queryByTestId("bus-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("error")).not.toBeInTheDocument();
  });

  it("exibe erro quando resposta nao e ok (4xx/5xx)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503 }),
    );

    render(<BusRoutesPage />);
    await waitFor(() => expect(screen.getByTestId("error")).toBeInTheDocument());
    expect(screen.queryByTestId("empty")).not.toBeInTheDocument();
    expect(screen.queryByTestId("bus-card")).not.toBeInTheDocument();
  });

  it("exibe erro quando fetch rejeita com erro de rede", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

    render(<BusRoutesPage />);
    await waitFor(() => expect(screen.getByTestId("error")).toBeInTheDocument());
  });

  it("nao exibe erro quando fetch e abortado (AbortError)", async () => {
    const abortError = new DOMException("Aborted", "AbortError");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));

    render(<BusRoutesPage />);
    await waitFor(() => expect(screen.queryByTestId("skeleton")).not.toBeInTheDocument());
    expect(screen.queryByTestId("error")).not.toBeInTheDocument();
    expect(screen.getByTestId("empty")).toBeInTheDocument();
  });

  it("sempre renderiza o header independente do estado", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) }),
    );
    render(<BusRoutesPage />);
    expect(screen.getByTestId("bus-header")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByTestId("skeleton")).not.toBeInTheDocument());
    expect(screen.getByTestId("bus-header")).toBeInTheDocument();
  });
});
