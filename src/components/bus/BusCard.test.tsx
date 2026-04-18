import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BusCard, type BusRoute } from "./BusCard";

const makeUniversity = (overrides: Partial<{ _id: string; name: string; acronym: string; address: string }> = {}) => ({
  _id: "uni-1",
  name: "Instituto Federal do Rio de Janeiro",
  acronym: "IFRJ",
  address: "Rua Lúcio Tavares, 1045 - Nilópolis",
  ...overrides,
});

const baseRoute: BusRoute = {
  _id: "bus-1",
  identifier: "VRG-01",
  capacity: 40,
  universityIds: [],
};

describe("BusCard", () => {
  it("exibe o identificador da rota", () => {
    render(<BusCard route={baseRoute} />);
    expect(screen.getByText("VRG-01")).toBeInTheDocument();
  });

  it("exibe a capacidade de passageiros", () => {
    render(<BusCard route={baseRoute} />);
    expect(screen.getByText(/40 lugares/i)).toBeInTheDocument();
  });

  it("exibe mensagem quando nao ha universidades vinculadas", () => {
    render(<BusCard route={baseRoute} />);
    expect(screen.getByText(/nenhuma instituição vinculada/i)).toBeInTheDocument();
  });

  it("nao exibe mensagem de sem vinculo quando ha universidades", () => {
    render(<BusCard route={{ ...baseRoute, universityIds: [makeUniversity()] }} />);
    expect(screen.queryByText(/nenhuma instituição vinculada/i)).not.toBeInTheDocument();
  });

  it("exibe nome e sigla da universidade vinculada", () => {
    render(<BusCard route={{ ...baseRoute, universityIds: [makeUniversity()] }} />);
    expect(screen.getByText(/Instituto Federal do Rio de Janeiro/i)).toBeInTheDocument();
    expect(screen.getByText(/IFRJ/i)).toBeInTheDocument();
  });

  it("exibe endereco da universidade", () => {
    render(<BusCard route={{ ...baseRoute, universityIds: [makeUniversity()] }} />);
    expect(screen.getByText(/Nilópolis/i)).toBeInTheDocument();
  });

  it("exibe multiplas universidades vinculadas", () => {
    const universities = [
      makeUniversity(),
      makeUniversity({ _id: "uni-2", name: "Universidade do Estado do Rio de Janeiro", acronym: "UERJ", address: "Rua São Francisco Xavier" }),
    ];
    render(<BusCard route={{ ...baseRoute, universityIds: universities }} />);
    expect(screen.getByText(/Instituto Federal/i)).toBeInTheDocument();
    expect(screen.getByText(/Universidade do Estado do Rio de Janeiro/i)).toBeInTheDocument();
    expect(screen.getByText(/UERJ/i)).toBeInTheDocument();
  });

  it("renderiza rota com capacidade zero sem erros", () => {
    render(<BusCard route={{ ...baseRoute, capacity: 0 }} />);
    expect(screen.getByText(/0 lugares/i)).toBeInTheDocument();
  });
});
