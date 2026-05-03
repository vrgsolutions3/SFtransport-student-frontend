import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LicenseActionCard from "./LicenseActionCard";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const baseProps = {
  loading: false,
  hasLicense: false,
  isUnderReview: false,
  isRejected: false,
  isWaitlisted: false,
  hasOpenEnrollmentPeriod: true,
  rejectionReason: null,
};

describe("LicenseActionCard", () => {
  describe("estado de carregamento", () => {
    it("exibe skeleton animado quando loading=true", () => {
      const { container } = render(<LicenseActionCard {...baseProps} loading={true} />);
      expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    });

    it("nao exibe nenhum texto de estado quando loading", () => {
      render(<LicenseActionCard {...baseProps} loading={true} />);
      expect(screen.queryByText(/carteirinha/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/fila/i)).not.toBeInTheDocument();
    });
  });

  describe("estado: na fila de espera", () => {
    it("exibe 'Na fila de espera'", () => {
      render(<LicenseActionCard {...baseProps} isWaitlisted={true} />);
      expect(screen.getByText(/na fila de espera/i)).toBeInTheDocument();
    });

    it("nao e clicavel (sem link)", () => {
      render(<LicenseActionCard {...baseProps} isWaitlisted={true} />);
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("tem prioridade sobre isUnderReview", () => {
      render(<LicenseActionCard {...baseProps} isWaitlisted={true} isUnderReview={true} />);
      expect(screen.getByText(/na fila de espera/i)).toBeInTheDocument();
      expect(screen.queryByText(/em análise/i)).not.toBeInTheDocument();
    });
  });

  describe("estado: em analise", () => {
    it("exibe 'Carteirinha em análise'", () => {
      render(<LicenseActionCard {...baseProps} isUnderReview={true} />);
      expect(screen.getByText(/carteirinha em análise/i)).toBeInTheDocument();
    });

    it("nao e clicavel (sem link)", () => {
      render(<LicenseActionCard {...baseProps} isUnderReview={true} />);
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("tem prioridade sobre isRejected", () => {
      render(<LicenseActionCard {...baseProps} isUnderReview={true} isRejected={true} />);
      expect(screen.getByText(/em análise/i)).toBeInTheDocument();
      expect(screen.queryByText(/recusada/i)).not.toBeInTheDocument();
    });
  });

  describe("estado: recusada", () => {
    it("exibe 'Carteirinha recusada'", () => {
      render(<LicenseActionCard {...baseProps} isRejected={true} />);
      expect(screen.getByText(/carteirinha recusada/i)).toBeInTheDocument();
    });

    it("exibe o motivo da recusa quando fornecido", () => {
      render(
        <LicenseActionCard
          {...baseProps}
          isRejected={true}
          rejectionReason="Documento ilegível"
        />,
      );
      expect(screen.getByText(/documento ilegível/i)).toBeInTheDocument();
    });

    it("nao exibe campo de motivo quando rejectionReason e null", () => {
      render(<LicenseActionCard {...baseProps} isRejected={true} rejectionReason={null} />);
      expect(screen.queryByText(/motivo/i)).not.toBeInTheDocument();
    });

    it("exibe link para solicitar novamente", () => {
      render(<LicenseActionCard {...baseProps} isRejected={true} />);
      expect(screen.getByRole("link", { name: /solicitar novamente/i })).toHaveAttribute(
        "href",
        "/dashboard/request-license",
      );
    });
  });

  describe("estado: sem licenca e sem periodo aberto", () => {
    it("exibe 'Inscrições encerradas'", () => {
      render(<LicenseActionCard {...baseProps} hasOpenEnrollmentPeriod={false} />);
      expect(screen.getByText(/inscrições encerradas/i)).toBeInTheDocument();
    });

    it("nao e clicavel (sem link)", () => {
      render(<LicenseActionCard {...baseProps} hasOpenEnrollmentPeriod={false} />);
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
  });

  describe("estado: sem licenca com periodo aberto", () => {
    it("exibe 'Criar carteirinha'", () => {
      render(<LicenseActionCard {...baseProps} />);
      expect(screen.getByText(/criar carteirinha/i)).toBeInTheDocument();
    });

    it("link aponta para /dashboard/request-license", () => {
      render(<LicenseActionCard {...baseProps} />);
      expect(screen.getByRole("link")).toHaveAttribute("href", "/dashboard/request-license");
    });
  });

  describe("estado: com licenca aprovada", () => {
    it("exibe 'Carteirinha aprovada'", () => {
      render(<LicenseActionCard {...baseProps} hasLicense={true} />);
      expect(screen.getByText(/carteirinha aprovada/i)).toBeInTheDocument();
    });

    it("link aponta para /dashboard/license-configuration", () => {
      render(<LicenseActionCard {...baseProps} hasLicense={true} />);
      expect(screen.getByRole("link")).toHaveAttribute(
        "href",
        "/dashboard/license-configuration",
      );
    });
  });

  describe("ordem de prioridade dos estados", () => {
    it("isWaitlisted sobrepoe todos os outros estados negativos", () => {
      render(
        <LicenseActionCard
          {...baseProps}
          isWaitlisted={true}
          isUnderReview={true}
          isRejected={true}
        />,
      );
      expect(screen.getByText(/na fila de espera/i)).toBeInTheDocument();
      expect(screen.queryByText(/em análise/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/recusada/i)).not.toBeInTheDocument();
    });

    it("hasLicense com outros flags nao exibe estados de solicitacao", () => {
      render(
        <LicenseActionCard
          {...baseProps}
          hasLicense={true}
          isUnderReview={false}
          isRejected={false}
          isWaitlisted={false}
        />,
      );
      expect(screen.getByText(/carteirinha aprovada/i)).toBeInTheDocument();
    });
  });
});
