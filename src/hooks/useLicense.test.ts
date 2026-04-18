import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLicense } from "./useLicense";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock("@/lib/apiClient", () => ({
  apiClient: {
    get: (...args: unknown[]) => mocks.get(...args),
    post: (...args: unknown[]) => mocks.post(...args),
  },
}));

const makeLicense = () => ({
  _id: "lic-1",
  studentId: "student-1",
  status: "active" as const,
  expirationDate: "2027-01-01",
  imageLicense: "data:image/jpeg;base64,abc",
  verificationCode: "uuid-1",
  qrCodeUrl: "https://qr.example.com/uuid-1",
});

const makeLicenseRequest = (status: string, rejectionReason?: string) => ({
  _id: "req-1",
  studentId: "student-1",
  status,
  type: "initial",
  rejectionReason: rejectionReason ?? null,
});

describe("useLicense", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // SSE token falha silenciosamente — evita que connectSse interfira nos testes
    mocks.post.mockRejectedValue(new Error("SSE indisponivel"));
  });

  describe("enabled = false", () => {
    it("nao faz nenhuma requisicao", () => {
      renderHook(() => useLicense({ enabled: false }));
      expect(mocks.get).not.toHaveBeenCalled();
    });

    it("retorna todos os valores como defaults", () => {
      const { result } = renderHook(() => useLicense({ enabled: false }));
      expect(result.current.license).toBeNull();
      expect(result.current.licenseRequest).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.hasLicense).toBe(false);
      expect(result.current.isUnderReview).toBe(false);
      expect(result.current.isRejected).toBe(false);
      expect(result.current.isWaitlisted).toBe(false);
      expect(result.current.rejectionReason).toBeNull();
    });
  });

  describe("quando /license/me retorna licenca", () => {
    it("seta hasLicense=true e limpa todos os flags", async () => {
      mocks.get.mockResolvedValueOnce(makeLicense());

      const { result } = renderHook(() => useLicense());

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.hasLicense).toBe(true);
      expect(result.current.license).toMatchObject({ _id: "lic-1" });
      expect(result.current.isUnderReview).toBe(false);
      expect(result.current.isRejected).toBe(false);
      expect(result.current.isWaitlisted).toBe(false);
      expect(result.current.licenseRequest).toBeNull();
      expect(result.current.rejectionReason).toBeNull();
    });
  });

  describe("quando /license/me falha e ha licenseRequest", () => {
    beforeEach(() => {
      mocks.get.mockRejectedValueOnce(new Error("sem licenca"));
    });

    it("status pending → isUnderReview=true", async () => {
      mocks.get.mockResolvedValueOnce(makeLicenseRequest("pending"));

      const { result } = renderHook(() => useLicense());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.isUnderReview).toBe(true);
      expect(result.current.isRejected).toBe(false);
      expect(result.current.isWaitlisted).toBe(false);
      expect(result.current.hasLicense).toBe(false);
    });

    it("status waitlisted → isWaitlisted=true", async () => {
      mocks.get.mockResolvedValueOnce(makeLicenseRequest("waitlisted"));

      const { result } = renderHook(() => useLicense());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.isWaitlisted).toBe(true);
      expect(result.current.isUnderReview).toBe(false);
      expect(result.current.isRejected).toBe(false);
    });

    it("status rejected → isRejected=true com rejectionReason", async () => {
      mocks.get.mockResolvedValueOnce(makeLicenseRequest("rejected", "Documento ilegivel"));

      const { result } = renderHook(() => useLicense());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.isRejected).toBe(true);
      expect(result.current.rejectionReason).toBe("Documento ilegivel");
      expect(result.current.isUnderReview).toBe(false);
      expect(result.current.isWaitlisted).toBe(false);
    });

    it("status rejected sem motivo → rejectionReason e null", async () => {
      mocks.get.mockResolvedValueOnce(makeLicenseRequest("rejected", undefined));
      // rejectionReason: null
      const req = makeLicenseRequest("rejected");
      req.rejectionReason = null as unknown as string;
      mocks.get.mockReset();
      mocks.get.mockRejectedValueOnce(new Error("sem licenca"));
      mocks.get.mockResolvedValueOnce(req);

      const { result } = renderHook(() => useLicense());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.isRejected).toBe(true);
      expect(result.current.rejectionReason).toBeNull();
    });

    it("status desconhecido → todos os flags false", async () => {
      mocks.get.mockResolvedValueOnce(makeLicenseRequest("approved"));

      const { result } = renderHook(() => useLicense());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.isUnderReview).toBe(false);
      expect(result.current.isRejected).toBe(false);
      expect(result.current.isWaitlisted).toBe(false);
    });

    it("licenseRequest null → todos os flags false", async () => {
      mocks.get.mockResolvedValueOnce(null);

      const { result } = renderHook(() => useLicense());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.licenseRequest).toBeNull();
      expect(result.current.isUnderReview).toBe(false);
      expect(result.current.isRejected).toBe(false);
      expect(result.current.isWaitlisted).toBe(false);
    });
  });

  describe("quando ambas as APIs falham", () => {
    it("retorna todos os flags false e loading=false", async () => {
      mocks.get
        .mockRejectedValueOnce(new Error("sem licenca"))
        .mockRejectedValueOnce(new Error("sem request"));

      const { result } = renderHook(() => useLicense());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.hasLicense).toBe(false);
      expect(result.current.licenseRequest).toBeNull();
      expect(result.current.isUnderReview).toBe(false);
      expect(result.current.isRejected).toBe(false);
      expect(result.current.isWaitlisted).toBe(false);
      expect(result.current.rejectionReason).toBeNull();
    });
  });

  describe("refresh", () => {
    it("e uma funcao exposta no retorno do hook", () => {
      mocks.get.mockResolvedValue(null);
      const { result } = renderHook(() => useLicense({ enabled: false }));
      expect(typeof result.current.refresh).toBe("function");
    });

    it("ao chamar refresh dispara novo fetch", async () => {
      mocks.get
        .mockResolvedValueOnce(makeLicense()) // carga inicial
        .mockResolvedValueOnce(makeLicense()); // refresh

      const { result } = renderHook(() => useLicense());
      await waitFor(() => expect(result.current.loading).toBe(false));

      const callsBefore = mocks.get.mock.calls.length;
      result.current.refresh();

      await waitFor(() => expect(mocks.get.mock.calls.length).toBeGreaterThan(callsBefore));
    });
  });

  describe("loading", () => {
    it("comeca como true e vai para false apos o fetch", async () => {
      mocks.get.mockResolvedValueOnce(makeLicense());

      const { result } = renderHook(() => useLicense());
      expect(result.current.loading).toBe(true);

      await waitFor(() => expect(result.current.loading).toBe(false));
    });
  });
});
