import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  validateCsrfTokenMock: vi.fn(),
  checkRateLimitMock: vi.fn(),
}));

vi.mock("@/lib/server/csrf", () => ({
  validateCsrfToken: mocks.validateCsrfTokenMock,
}));

vi.mock("@/lib/server/rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimitMock,
}));

vi.mock("@/lib/server/bff-auth", () => ({
  SID_COOKIE_NAME: "_tk",
  getBackendApiBaseUrl: () => "http://backend.local/api/v1",
  getServiceSecret: () => "service-secret-test",
  getSidMaxAgeSeconds: () => 3600,
}));

import { POST } from "./route";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3001/api/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "127.0.0.1",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login (student)", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    mocks.checkRateLimitMock.mockReturnValue(true);
    mocks.validateCsrfTokenMock.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("deve retornar 429 quando limite de tentativas e excedido", async () => {
    mocks.checkRateLimitMock.mockReturnValue(false);

    const response = await POST(
      makeRequest({ email: "student@test.com", password: "Senha123" }),
    );

    expect(response.status).toBe(429);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("deve retornar 403 para CSRF invalido", async () => {
    mocks.validateCsrfTokenMock.mockResolvedValue(false);

    const response = await POST(
      makeRequest({ email: "student@test.com", password: "Senha123" }),
    );

    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("deve retornar 400 para payload invalido", async () => {
    const response = await POST(makeRequest({ email: "invalido", password: "1" }));
    const body = (await response.json()) as { message?: string; errors?: Record<string, string> };

    expect(response.status).toBe(400);
    expect(body.message).toBeTruthy();
    expect(body.errors).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("deve retornar 502 quando contrato da sessao do backend e invalido", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await POST(
      makeRequest({ email: "student@test.com", password: "Senha123" }),
    );

    expect(response.status).toBe(502);
  });

  it("deve definir cookie de sessao no login bem-sucedido", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          sessionId: "507f1f77bcf86cd799439011",
          user: {
            id: "507f1f77bcf86cd799439011",
            role: "student",
            identifier: "student@test.com",
            name: "Estudante",
          },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    const response = await POST(
      makeRequest({ email: "student@test.com", password: "SenhaSegura123" }),
    );
    const body = (await response.json()) as {
      ok: boolean;
      user: { role: string; id: string };
    };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.user.role).toBe("student");
    expect(response.cookies.get("_tk")?.value).toBe("507f1f77bcf86cd799439011");
  });
});
