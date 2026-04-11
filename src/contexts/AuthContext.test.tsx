import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";

const mocks = vi.hoisted(() => ({
  pathname: "/dashboard",
  pushMock: vi.fn(),
  replaceMock: vi.fn(),
  router: {
    push: vi.fn(),
    replace: vi.fn(),
  },
}));

mocks.router.push = mocks.pushMock;
mocks.router.replace = mocks.replaceMock;

vi.mock("next/navigation", () => ({
  useRouter: () => mocks.router,
  usePathname: () => mocks.pathname,
}));

describe("AuthProvider", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    mocks.pathname = "/dashboard";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("deve redirecionar para /login quando bootstrap encontra sessao invalida", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          message: "Sessao nao encontrada",
          csrf: { headerName: "x-csrf-token", token: "csrf-token" },
        }),
        {
          status: 401,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(mocks.replaceMock).toHaveBeenCalledWith("/login");
  });

  it("deve autenticar com sucesso via login quando CSRF e sessao retornam validos", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            message: "Sessao nao encontrada",
            csrf: { headerName: "x-csrf-token", token: "csrf-token" },
          }),
          {
            status: 401,
            headers: { "content-type": "application/json" },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            user: {
              id: "507f1f77bcf86cd799439011",
              role: "student",
              identifier: "student@test.com",
              name: "Aluno Teste",
            },
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      );

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider bootstrapOnMount={false}>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let loginResult: { success: boolean; error?: string } | undefined;

    await act(async () => {
      loginResult = await result.current.login("student@test.com", "SenhaSegura123");
    });

    expect(loginResult).toEqual({ success: true });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.role).toBe("student");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/auth/session");
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/auth/login");
  });
});
