import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DocumentsPage from "./page";

const mocks = vi.hoisted(() => ({
  pushMock: vi.fn(),
  replaceMock: vi.fn(),
  backMock: vi.fn(),
  searchUpdated: "false",
  authState: { isAuthenticated: true, isLoading: false },
  licenseState: {
    hasLicense: false,
    loading: false,
    licenseRequest: null,
  } as {
    hasLicense: boolean;
    loading: boolean;
    licenseRequest: { type: "update" | "new"; status: "pending" | "rejected" | "approved"; rejectionReason?: string } | null;
  },
  getMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.pushMock,
    replace: mocks.replaceMock,
    back: mocks.backMock,
  }),
  useSearchParams: () => ({
    get: (key: string) => (key === "updated" ? mocks.searchUpdated : null),
  }),
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

vi.mock("@/components/ui/ThemeToggle", () => ({
  ThemeToggle: () => <button type="button">toggle-theme</button>,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mocks.authState,
}));

vi.mock("@/hooks/useLicense", () => ({
  useLicense: () => mocks.licenseState,
}));

vi.mock("@/lib/apiClient", () => ({
  apiClient: {
    get: (...args: unknown[]) => mocks.getMock(...args),
  },
}));

describe("DocumentsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.searchUpdated = "false";
    mocks.authState = { isAuthenticated: true, isLoading: false };
    mocks.licenseState = {
      hasLicense: false,
      loading: false,
      licenseRequest: null,
    };
    mocks.getMock.mockResolvedValue([]);
  });

  it("deve controlar visibilidade da acao de atualizacao quando usuario nao tem licenca", async () => {
    render(<DocumentsPage />);

    await waitFor(() => {
      expect(screen.getByText(/nenhum documento enviado/i)).toBeInTheDocument();
    });

    const updateButton = screen.getByRole("button", {
      name: /solicitar alteração de documentos/i,
    });

    expect(updateButton).toBeDisabled();
    expect(
      screen.getByText(/o reenvio de documentos só pode ocorrer após a criação da carteirinha/i),
    ).toBeInTheDocument();
  });

  it("deve exibir aviso de solicitacao pendente e manter acao bloqueada", async () => {
    mocks.licenseState = {
      hasLicense: true,
      loading: false,
      licenseRequest: {
        type: "update",
        status: "pending",
      },
    };

    render(<DocumentsPage />);

    await waitFor(() => {
      expect(screen.getByText(/nenhum documento enviado/i)).toBeInTheDocument();
    });

    expect(
      screen.getByText(/já possui uma solicitação de alteração de documentos pendente/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /solicitar alteração de documentos/i }),
    ).toBeDisabled();
  });
});
