"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { configureApiClient, resetApiClientState } from "@/lib/apiClient";
import type {
  AuthUser,
  RegisterResponse,
  MessageResponse,
  SessionAuthResponse,
} from "@/types/auth";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (
    email: string,
    password: string
  ) => Promise<{ success: true } | { success: false; error: string }>;
  logout: () => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    telephone: string;
    cpf: string;
  }) => Promise<{ success: true; isInstitutional: boolean } | { success: false; error: string }>;
  verifyEmail: (
    email: string,
    code: string
  ) => Promise<{ success: true } | { success: false; error: string }>;
  resendCode: (
    email: string
  ) => Promise<{ success: true } | { success: false; error: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const PUBLIC_PATHS = ["/login", "/register", "/verify-email", "/verify"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export function AuthProvider({
  children,
  bootstrapOnMount = true,
}: {
  children: React.ReactNode;
  bootstrapOnMount?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: bootstrapOnMount,
  });

  const clearSession = useCallback(() => {
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  const handleUnauthorized = useCallback(() => {
    clearSession();
    if (!isPublicPath(pathname)) {
      router.push("/login");
    }
  }, [clearSession, pathname, router]);

  useEffect(() => {
    resetApiClientState();
    configureApiClient({ onUnauthorized: handleUnauthorized });
  }, [handleUnauthorized]);

  useEffect(() => {
    if (!bootstrapOnMount) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("No session");
        }

        const data: SessionAuthResponse = await res.json();

        if (!cancelled) {
          setState({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
          });
        }
      } catch {
        if (!cancelled) {
          clearSession();
          if (!isPublicPath(pathname)) {
            router.replace("/login");
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bootstrapOnMount, clearSession, pathname, router]);

  const authFetch = useCallback(
    async (
      url: string,
      options: RequestInit,
    ): Promise<{ ok: boolean; data: unknown; status: number }> => {
      const res = await fetch(url, options);
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, data, status: res.status };
    },
    [],
  );

  const login = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ success: true } | { success: false; error: string }> => {
      try {
        const { ok, data } = await authFetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });

        if (!ok) {
          const payload = data as { message?: string };
          return {
            success: false,
            error: typeof payload.message === "string" ? payload.message : "Credenciais inválidas",
          };
        }

        const authData = data as SessionAuthResponse;

        setState({ user: authData.user, isAuthenticated: true, isLoading: false });
        return { success: true };
      } catch {
        return { success: false, error: "Falha ao realizar login" };
      }
    },
    [authFetch],
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Logout é idempotente por contrato.
    } finally {
      clearSession();
      router.push("/login");
    }
  }, [clearSession, router]);

  const register = useCallback(
    async (data: {
      name: string;
      email: string;
      password: string;
      telephone: string;
      cpf: string;
    }): Promise<
      { success: true; isInstitutional: boolean } | { success: false; error: string }
    > => {
      try {
        const { ok, data: payloadData } = await authFetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(data),
        });

        const payload = payloadData as Partial<RegisterResponse> & {
          message?: string;
        };

        if (!ok) {
          return {
            success: false,
            error: typeof payload.message === "string" ? payload.message : "Erro ao criar conta",
          };
        }

        return {
          success: true,
          isInstitutional: Boolean(payload.isInstitutional),
        };
      } catch {
        return { success: false, error: "Erro ao criar conta" };
      }
    },
    [authFetch],
  );

  const verifyEmail = useCallback(
    async (
      email: string,
      code: string
    ): Promise<{ success: true } | { success: false; error: string }> => {
      try {
        const { ok, data } = await authFetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, code }),
        });

        if (!ok) {
          const payload = data as { message?: string };
          return {
            success: false,
            error: typeof payload.message === "string" ? payload.message : "Código inválido",
          };
        }

        const authData = data as SessionAuthResponse;
        setState({ user: authData.user, isAuthenticated: true, isLoading: false });

        return { success: true };
      } catch {
        return { success: false, error: "Falha ao verificar código" };
      }
    },
    [authFetch],
  );

  const resendCode = useCallback(
    async (email: string): Promise<{ success: true } | { success: false; error: string }> => {
      try {
        const { ok, data } = await authFetch("/api/auth/resend-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email }),
        });

        const payload = data as MessageResponse;

        if (!ok) {
          return {
            success: false,
            error: typeof payload?.message === "string" ? payload.message : "Erro ao reenviar código",
          };
        }

        if (payload?.message) {
          return { success: true };
        }

        return { success: true };
      } catch (err: unknown) {
        const msg =
          typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : "Erro ao reenviar código";

        return { success: false, error: msg };
      }
    },
    [authFetch],
  );

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    register,
    verifyEmail,
    resendCode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  }
  return ctx;
}
