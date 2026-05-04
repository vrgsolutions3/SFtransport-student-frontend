import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RequestLicensePage from "./page";

const mocks = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  pushMock: vi.fn(),
  backMock: vi.fn(),
  authState: { isAuthenticated: true, isLoading: false },
  licenseState: {
    isUnderReview: false,
    isWaitlisted: false,
    loading: false,
    licenseRequest: null as { type: string; status: string } | null,
    refresh: vi.fn(),
  },
  periodState: { loading: false, hasOpenPeriod: true },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mocks.replaceMock,
    push: mocks.pushMock,
    back: mocks.backMock,
  }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mocks.authState,
}));

vi.mock("@/contexts/LicenseContext", () => ({
  useLicenseContext: () => mocks.licenseState,
}));

vi.mock("@/contexts/EnrollmentPeriodContext", () => ({
  useEnrollmentPeriodContext: () => mocks.periodState,
}));

// next/dynamic: retorna um placeholder para evitar problemas com lazy loading
vi.mock("next/dynamic", () => ({
  default: () => () => <div data-testid="step2">Step 2</div>,
}));

vi.mock("@/components/dashboard/license-request/RequestLicenseSkeleton", () => ({
  default: () => <div data-testid="request-license-skeleton" />,
}));

vi.mock("@/components/dashboard/license-request/StepIndicator", () => ({
  default: ({ currentStep }: { currentStep: number }) => (
    <div data-testid="step-indicator" data-step={currentStep} />
  ),
}));

vi.mock("@/components/dashboard/license-request/Step1InfoForm", () => ({
  default: ({ onContinue }: { onContinue: () => void }) => (
    <div data-testid="step1">
      <button type="button" onClick={onContinue}>
        Continuar
      </button>
    </div>
  ),
}));

vi.mock("@/components/dashboard/license-request/Step3grade", () => ({
  default: () => <div data-testid="step3" />,
}));

vi.mock("@/components/dashboard/license-request/ConfirmSubmitModal", () => ({
  default: () => null,
}));

vi.mock("@/components/dashboard/license-request/LicenseStepFooter", () => ({
  LicenseStepFooter: () => null,
}));

vi.mock("@/components/dashboard/license-request/LicenseErrorBanner", () => ({
  LicenseErrorBanner: () => null,
}));

vi.mock("@/components/ui/ThemeToggle", () => ({
  ThemeToggle: () => <button type="button">toggle</button>,
}));

vi.mock("@/lib/storageWithTTL", () => ({
  getWithTTL: () => null,
  setWithTTL: () => undefined,
  removeWithTTL: () => undefined,
  ONE_DAY_MS: 86_400_000,
}));

vi.mock("@/lib/documentEntries", () => ({
  makeEmptyEntries: () => ({}),
  deserializeDocumentEntries: () => Promise.resolve({}),
  serializeDocumentEntries: () => Promise.resolve({}),
}));

vi.mock("@/lib/api", () => ({
  api: { postForm: vi.fn() },
}));

vi.mock("@/constants/license-documents", () => ({
  LICENSE_DOCUMENTS: [],
}));

describe("RequestLicensePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authState = { isAuthenticated: true, isLoading: false };
    mocks.licenseState = {
      isUnderReview: false,
      isWaitlisted: false,
      loading: false,
      licenseRequest: null,
      refresh: vi.fn(),
    };
    mocks.periodState = { loading: false, hasOpenPeriod: true };
  });

  describe("guards de autenticacao", () => {
    it("redireciona para /login quando nao autenticado", async () => {
      mocks.authState = { isAuthenticated: false, isLoading: false };
      render(<RequestLicensePage />);

      await waitFor(() =>
        expect(mocks.replaceMock).toHaveBeenCalledWith("/login"),
      );
    });

    it("exibe skeleton quando authLoading=true", () => {
      mocks.authState = { isAuthenticated: false, isLoading: true };
      render(<RequestLicensePage />);

      expect(screen.getByTestId("request-license-skeleton")).toBeInTheDocument();
    });

    it("exibe skeleton enquanto isAuthenticated e indefinido (loading)", () => {
      mocks.authState = { isAuthenticated: true, isLoading: true };
      render(<RequestLicensePage />);

      expect(screen.getByTestId("request-license-skeleton")).toBeInTheDocument();
    });
  });

  describe("guards de licenca", () => {
    it("redireciona para /dashboard quando isUnderReview=true (pedido inicial)", async () => {
      mocks.licenseState = {
        isUnderReview: true,
        isWaitlisted: false,
        loading: false,
        licenseRequest: { type: "initial", status: "pending" },
        refresh: vi.fn(),
      };
      render(<RequestLicensePage />);

      await waitFor(() =>
        expect(mocks.replaceMock).toHaveBeenCalledWith("/dashboard"),
      );
    });

    it("redireciona para /dashboard quando isWaitlisted=true (pedido inicial)", async () => {
      mocks.licenseState = {
        isUnderReview: false,
        isWaitlisted: true,
        loading: false,
        licenseRequest: { type: "initial", status: "waitlisted" },
        refresh: vi.fn(),
      };
      render(<RequestLicensePage />);

      await waitFor(() =>
        expect(mocks.replaceMock).toHaveBeenCalledWith("/dashboard"),
      );
    });

    it("nao redireciona para /dashboard quando licenseRequest e de atualizacao (type=update)", async () => {
      mocks.licenseState = {
        isUnderReview: true,
        isWaitlisted: false,
        loading: false,
        licenseRequest: { type: "update", status: "pending" },
        refresh: vi.fn(),
      };
      render(<RequestLicensePage />);

      // garante que o efeito rodou
      await waitFor(() => expect(mocks.authState.isAuthenticated).toBe(true));

      expect(mocks.replaceMock).not.toHaveBeenCalledWith("/dashboard");
    });

    it("exibe skeleton quando license loading=true", () => {
      mocks.licenseState = { ...mocks.licenseState, loading: true };
      render(<RequestLicensePage />);

      expect(screen.getByTestId("request-license-skeleton")).toBeInTheDocument();
    });

    it("exibe skeleton quando period loading=true", () => {
      mocks.periodState = { loading: true, hasOpenPeriod: true };
      render(<RequestLicensePage />);

      expect(screen.getByTestId("request-license-skeleton")).toBeInTheDocument();
    });
  });

  describe("estado de periodo fechado", () => {
    it("exibe 'Inscricoes encerradas' quando hasOpenPeriod=false", () => {
      mocks.periodState = { loading: false, hasOpenPeriod: false };
      render(<RequestLicensePage />);

      expect(screen.getByText("Inscrições encerradas")).toBeInTheDocument();
    });

    it("exibe botao de voltar ao dashboard quando periodo fechado", () => {
      mocks.periodState = { loading: false, hasOpenPeriod: false };
      render(<RequestLicensePage />);

      expect(
        screen.getByRole("button", { name: /voltar ao dashboard/i }),
      ).toBeInTheDocument();
    });

    it("nao exibe StepIndicator quando periodo fechado", () => {
      mocks.periodState = { loading: false, hasOpenPeriod: false };
      render(<RequestLicensePage />);

      expect(screen.queryByTestId("step-indicator")).not.toBeInTheDocument();
    });
  });

  describe("formulario de solicitacao", () => {
    it("renderiza Step 1 por padrao quando autenticado e periodo aberto", () => {
      render(<RequestLicensePage />);

      expect(screen.getByTestId("step1")).toBeInTheDocument();
      expect(screen.getByTestId("step-indicator")).toBeInTheDocument();
    });

    it("nao exibe step2 ou step3 inicialmente", () => {
      render(<RequestLicensePage />);

      expect(screen.queryByTestId("step2")).not.toBeInTheDocument();
      expect(screen.queryByTestId("step3")).not.toBeInTheDocument();
    });

    it("titulo 'Solicitar Carteirinha' e visivel no header", () => {
      render(<RequestLicensePage />);

      expect(screen.getByText("Solicitar Carteirinha")).toBeInTheDocument();
    });
  });
});
