import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/server/bff-auth", () => ({
  SID_COOKIE_NAME: "_tk",
  getBackendApiBaseUrl: () => "http://backend.local/api/v1",
  getServiceSecret: () => "service-secret-test",
}));

vi.mock("@/lib/server/csrf", () => ({
  getCsrfHeaderName: () => "x-csrf-token",
  setCsrfCookie: vi.fn().mockResolvedValue("csrf-token-test"),
}));

import { GET } from "./route";

function makeRequest(cookie?: string): NextRequest {
  return new NextRequest("http://localhost:3001/api/auth/session", {
    method: "GET",
    headers: cookie ? { cookie } : {},
  });
}

describe("GET /api/auth/session (student)", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("deve retornar 401 quando cookie de sessao nao existe", async () => {
    const response = await GET(makeRequest());
    const body = (await response.json()) as {
      message: string;
      csrf: { headerName: string; token: string };
    };

    expect(response.status).toBe(401);
    expect(body.csrf.headerName).toBe("x-csrf-token");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("deve limpar cookie quando auth/me retorna sessao invalida", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Sessao invalida" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await GET(makeRequest("_tk=session-abc"));

    expect(response.status).toBe(401);
    expect(response.cookies.get("_tk")?.value).toBe("");
  });

  it("deve retornar 403 quando userType nao e student", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ userId: "507f1f77bcf86cd799439011", userType: "admin" }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    const response = await GET(makeRequest("_tk=session-abc"));

    expect(response.status).toBe(403);
  });

  it("deve retornar 200 com payload de sessao valido", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ userId: "507f1f77bcf86cd799439011", userType: "student" }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            email: "student@test.com",
            name: "Aluno Teste",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      );

    const response = await GET(makeRequest("_tk=session-abc"));
    const body = (await response.json()) as {
      ok: boolean;
      user: { id: string; role: string; identifier: string; name: string };
      csrf: { headerName: string; token: string };
    };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.user.role).toBe("student");
    expect(body.user.identifier).toBe("student@test.com");
    expect(body.user.name).toBe("Aluno Teste");
  });
});
