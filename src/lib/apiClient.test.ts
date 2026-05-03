import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  apiClient,
  API_BASE_URL,
  configureApiClient,
  resetApiClientState,
} from "./apiClient";

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockClear();
  vi.stubGlobal("fetch", mockFetch);
  resetApiClientState();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function okResponse(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

function errorResponse(status: number, body: unknown = { message: "Erro" }) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

describe("apiClient", () => {
  describe("URL e credenciais", () => {
    it("envia para /api/v1/{path}", async () => {
      mockFetch.mockReturnValue(okResponse({}));
      await apiClient.get("/recurso");
      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/recurso`,
        expect.objectContaining({ credentials: "include" }),
      );
    });

    it("inclui credentials: include em todas as requisicoes", async () => {
      mockFetch.mockReturnValue(okResponse({}));
      await apiClient.post("/recurso", {});
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ credentials: "include" }),
      );
    });
  });

  describe("metodos HTTP", () => {
    it("GET envia method: GET sem body", async () => {
      mockFetch.mockReturnValue(okResponse({ ok: true }));
      const result = await apiClient.get<{ ok: boolean }>("/teste");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: "GET" }),
      );
      expect(result).toEqual({ ok: true });
    });

    it("POST serializa body como JSON", async () => {
      mockFetch.mockReturnValue(okResponse({}));
      await apiClient.post("/teste", { campo: "valor" });
      const [, opts] = mockFetch.mock.calls[0];
      expect(opts.method).toBe("POST");
      expect(opts.body).toBe(JSON.stringify({ campo: "valor" }));
      expect(opts.headers["Content-Type"]).toBe("application/json");
    });

    it("PATCH serializa body como JSON", async () => {
      mockFetch.mockReturnValue(okResponse({}));
      await apiClient.patch("/teste", { campo: "novo" });
      const [, opts] = mockFetch.mock.calls[0];
      expect(opts.method).toBe("PATCH");
      expect(JSON.parse(opts.body as string)).toEqual({ campo: "novo" });
    });

    it("DELETE envia method: DELETE", async () => {
      mockFetch.mockReturnValue(okResponse({}));
      await apiClient.delete("/teste");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: "DELETE" }),
      );
    });
  });

  describe("FormData (multipart)", () => {
    it("postForm nao adiciona Content-Type (browser define boundary)", async () => {
      mockFetch.mockReturnValue(okResponse({}));
      const form = new FormData();
      form.append("arquivo", new Blob(["conteudo"]), "doc.pdf");
      await apiClient.postForm("/upload", form);
      const [, opts] = mockFetch.mock.calls[0];
      expect(opts.method).toBe("POST");
      expect(opts.body).toBe(form);
      expect(opts.headers?.["Content-Type"]).toBeUndefined();
    });

    it("patchForm nao adiciona Content-Type", async () => {
      mockFetch.mockReturnValue(okResponse({}));
      const form = new FormData();
      await apiClient.patchForm("/upload", form);
      const [, opts] = mockFetch.mock.calls[0];
      expect(opts.method).toBe("PATCH");
      expect(opts.headers?.["Content-Type"]).toBeUndefined();
    });
  });

  describe("tratamento de erros", () => {
    it("lanca ApiError com message e status quando resposta nao e ok", async () => {
      mockFetch.mockReturnValue(errorResponse(404, { message: "Nao encontrado" }));
      await expect(apiClient.get("/recurso")).rejects.toMatchObject({
        message: "Nao encontrado",
        status: 404,
      });
    });

    it("usa mensagem padrao quando body nao tem message", async () => {
      mockFetch.mockReturnValue(errorResponse(500, {}));
      await expect(apiClient.get("/recurso")).rejects.toMatchObject({
        message: "Erro desconhecido",
        status: 500,
      });
    });

    it("status 401 dispara onUnauthorized registrado", async () => {
      const onUnauthorized = vi.fn();
      configureApiClient({ onUnauthorized });
      mockFetch.mockReturnValue(errorResponse(401, { message: "Nao autorizado" }));

      await expect(apiClient.get("/protegido")).rejects.toBeDefined();
      expect(onUnauthorized).toHaveBeenCalledTimes(1);
    });

    it("status 401 sem onUnauthorized registrado nao lanca erro adicional", async () => {
      mockFetch.mockReturnValue(errorResponse(401, {}));
      await expect(apiClient.get("/protegido")).rejects.toMatchObject({ status: 401 });
    });

    it("status 403 nao dispara onUnauthorized", async () => {
      const onUnauthorized = vi.fn();
      configureApiClient({ onUnauthorized });
      mockFetch.mockReturnValue(errorResponse(403, {}));

      await expect(apiClient.get("/recurso")).rejects.toBeDefined();
      expect(onUnauthorized).not.toHaveBeenCalled();
    });

    it("JSON corrompido na resposta ok retorna objeto vazio", async () => {
      mockFetch.mockReturnValue(
        Promise.resolve(new Response("nao-e-json", { status: 200 })),
      );
      const result = await apiClient.get("/recurso");
      expect(result).toEqual({});
    });
  });

  describe("configureApiClient e resetApiClientState", () => {
    it("resetApiClientState remove o callback de unauthorized", async () => {
      const onUnauthorized = vi.fn();
      configureApiClient({ onUnauthorized });
      resetApiClientState();

      mockFetch.mockReturnValue(errorResponse(401, {}));
      await expect(apiClient.get("/recurso")).rejects.toBeDefined();
      expect(onUnauthorized).not.toHaveBeenCalled();
    });

    it("configureApiClient sobrescreve callback anterior", async () => {
      const primeiro = vi.fn();
      const segundo = vi.fn();
      configureApiClient({ onUnauthorized: primeiro });
      configureApiClient({ onUnauthorized: segundo });

      mockFetch.mockReturnValue(errorResponse(401, {}));
      await expect(apiClient.get("/recurso")).rejects.toBeDefined();
      expect(primeiro).not.toHaveBeenCalled();
      expect(segundo).toHaveBeenCalledTimes(1);
    });
  });
});
