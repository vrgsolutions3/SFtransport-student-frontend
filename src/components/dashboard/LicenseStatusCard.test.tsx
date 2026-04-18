import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LicenseStatusCard from "./LicenseStatusCard";

const mocks = vi.hoisted(() => ({
  authState: { isAuthenticated: true, isLoading: false },
  periodState: { hasOpenPeriod: true, loading: false },
  licenseState: {
    license: null as {
      _id: string;
      status: "active" | "inactive" | "expired";
      expirationDate: string;
    } | null,
    loading: false,
    hasLicense: false,
    isWaitlisted: false,
  },
  requested: "false",
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === "requested" ? mocks.requested : null),
  }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mocks.authState,
}));

vi.mock("@/contexts/EnrollmentPeriodContext", () => ({
  useEnrollmentPeriodContext: () => mocks.periodState,
}));

vi.mock("@/contexts/LicenseContext", () => ({
  useLicenseContext: () => mocks.licenseState,
}));

describe("LicenseStatusCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authState = { isAuthenticated: true, isLoading: false };
    mocks.periodState = { hasOpenPeriod: true, loading: false };
    mocks.licenseState = { license: null, loading: false, hasLicense: false, isWaitlisted: false };
    mocks.requested = "false";
  });

  describe("loading", () => {
    it("exibe skeleton quando license loading=true", () => {
      mocks.licenseState = { ...mocks.licenseState, loading: true };
      const { container } = render(<LicenseStatusCard />);

      expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    });

    it("exibe skeleton quando period loading=true", () => {
      mocks.periodState = { hasOpenPeriod: true, loading: true };
      const { container } = render(<LicenseStatusCard />);

      expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    });
  });

  describe("sem licenca", () => {
    it("exibe 'Inscricoes encerradas' quando periodo fechado", () => {
      mocks.periodState = { hasOpenPeriod: false, loading: false };
      render(<LicenseStatusCard />);

      expect(screen.getByText("Inscrições encerradas")).toBeInTheDocument();
      expect(
        screen.getByText(/aguarde a abertura de um novo período/i),
      ).toBeInTheDocument();
    });

    it("exibe 'Na fila de espera' quando isWaitlisted=true e periodo aberto", () => {
      mocks.licenseState = { ...mocks.licenseState, isWaitlisted: true };
      render(<LicenseStatusCard />);

      expect(screen.getByText("Na fila de espera")).toBeInTheDocument();
      expect(
        screen.getByText(/você será notificado quando uma vaga for liberada/i),
      ).toBeInTheDocument();
    });

    it("exibe 'Pedido enviado!' quando ?requested=true", () => {
      mocks.requested = "true";
      render(<LicenseStatusCard />);

      expect(screen.getByText("Pedido enviado!")).toBeInTheDocument();
      expect(screen.getByText(/aguardando análise do responsável/i)).toBeInTheDocument();
    });

    it("exibe link 'Criar carteirinha' apontando para /dashboard/request-license", () => {
      render(<LicenseStatusCard />);

      const link = screen.getByRole("link", { name: /criar carteirinha/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/dashboard/request-license");
    });

    it("isWaitlisted tem prioridade sobre justRequested=true", () => {
      mocks.licenseState = { ...mocks.licenseState, isWaitlisted: true };
      mocks.requested = "true";
      render(<LicenseStatusCard />);

      expect(screen.getByText("Na fila de espera")).toBeInTheDocument();
      expect(screen.queryByText("Pedido enviado!")).not.toBeInTheDocument();
    });

    it("periodo fechado tem prioridade sobre isWaitlisted=true", () => {
      mocks.periodState = { hasOpenPeriod: false, loading: false };
      mocks.licenseState = { ...mocks.licenseState, isWaitlisted: true };
      render(<LicenseStatusCard />);

      expect(screen.getByText("Inscrições encerradas")).toBeInTheDocument();
      expect(screen.queryByText("Na fila de espera")).not.toBeInTheDocument();
    });
  });

  describe("com licenca ativa", () => {
    it("exibe link 'Carteirinha ativa' apontando para /dashboard/card", () => {
      mocks.licenseState = {
        hasLicense: true,
        loading: false,
        isWaitlisted: false,
        license: {
          _id: "lic-1",
          status: "active",
          expirationDate: "2027-06-15",
        },
      };
      render(<LicenseStatusCard />);

      const link = screen.getByRole("link", { name: /carteirinha ativa/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/dashboard/card");
    });

    it("exibe data de expiracao formatada em pt-BR", () => {
      mocks.licenseState = {
        hasLicense: true,
        loading: false,
        isWaitlisted: false,
        license: {
          _id: "lic-1",
          status: "active",
          expirationDate: "2027-06-15",
        },
      };
      render(<LicenseStatusCard />);

      expect(screen.getByText(/válida até/i)).toBeInTheDocument();
      // Data formatada em pt-BR: "15 de junho de 2027"
      expect(screen.getByText(/junho/i)).toBeInTheDocument();
      expect(screen.getByText(/2027/)).toBeInTheDocument();
    });

    it("exibe badge 'Ativa' para status active", () => {
      mocks.licenseState = {
        hasLicense: true,
        loading: false,
        isWaitlisted: false,
        license: { _id: "lic-1", status: "active", expirationDate: "2027-01-01" },
      };
      render(<LicenseStatusCard />);

      const badge = screen.getByText("Ativa");
      expect(badge).toBeInTheDocument();
      expect(badge.className).toMatch(/text-success/);
    });

    it("exibe badge 'Inativa' para status inactive", () => {
      mocks.licenseState = {
        hasLicense: true,
        loading: false,
        isWaitlisted: false,
        license: { _id: "lic-1", status: "inactive", expirationDate: "2027-01-01" },
      };
      render(<LicenseStatusCard />);

      const badge = screen.getByText("Inativa");
      expect(badge).toBeInTheDocument();
      expect(badge.className).toMatch(/text-warning/);
    });

    it("exibe badge 'Expirada' para status expired", () => {
      mocks.licenseState = {
        hasLicense: true,
        loading: false,
        isWaitlisted: false,
        license: { _id: "lic-1", status: "expired", expirationDate: "2024-01-01" },
      };
      render(<LicenseStatusCard />);

      const badge = screen.getByText("Expirada");
      expect(badge).toBeInTheDocument();
      expect(badge.className).toMatch(/text-error/);
    });
  });
});
