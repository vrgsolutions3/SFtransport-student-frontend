import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BusCard, type BusRoute } from "./BusCard";

const baseRoute: BusRoute = {
  _id: "bus-1",
  lineNumber: "VRG-01",
  destinations: [],
  active: true,
};

describe("BusCard", () => {
  it("exibe o numero da rota", () => {
    render(<BusCard route={baseRoute} />);
    expect(screen.getByText("VRG-01")).toBeInTheDocument();
  });

  it("exibe o status da rota", () => {
    render(<BusCard route={baseRoute} />);
    expect(screen.getByText(/rota ativa/i)).toBeInTheDocument();
  });

  it("exibe mensagem quando nao ha destinos ativos", () => {
    render(<BusCard route={baseRoute} />);
    expect(screen.getByText(/nenhum destino ativo vinculado/i)).toBeInTheDocument();
  });

  it("nao exibe mensagem de sem vinculo quando ha destinos ativos", () => {
    render(
      <BusCard
        route={{
          ...baseRoute,
          destinations: [{ name: "Campus Centro", active: true }],
        }}
      />,
    );
    expect(screen.queryByText(/nenhum destino ativo vinculado/i)).not.toBeInTheDocument();
  });

  it("exibe os destinos ativos", () => {
    render(
      <BusCard
        route={{
          ...baseRoute,
          destinations: [
            { name: "Campus Centro", active: true },
            { name: "Terminal Rodoviário", active: true },
          ],
        }}
      />,
    );
    expect(screen.getByText(/Campus Centro/i)).toBeInTheDocument();
    expect(screen.getByText(/Terminal Rodoviário/i)).toBeInTheDocument();
  });

  it("exibe somente destinos ativos", () => {
    render(
      <BusCard
        route={{
          ...baseRoute,
          destinations: [
            { name: "Campus Centro", active: true },
            { name: "Destino Inativo", active: false },
          ],
        }}
      />,
    );
    expect(screen.getByText(/Campus Centro/i)).toBeInTheDocument();
    expect(screen.queryByText(/Destino Inativo/i)).not.toBeInTheDocument();
  });
});
