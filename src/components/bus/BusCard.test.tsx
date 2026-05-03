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

  it("nao exibe status nem contagem antiga", () => {
    render(<BusCard route={baseRoute} />);
    expect(screen.queryByText(/rota ativa/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/destinos ativos/i)).not.toBeInTheDocument();
  });

  it("exibe as siglas das faculdades quando existem destinos", () => {
    render(
      <BusCard
        route={{
          ...baseRoute,
          destinations: [
            { name: "IFF", active: true },
            { name: "IFB", active: true },
          ],
        }}
      />,
    );
    expect(screen.getByText(/IFF, IFB/i)).toBeInTheDocument();
  });
});
