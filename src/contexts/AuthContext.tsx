"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { configureApiClient, resetApiClientState } from "@/lib/apiClient";
import type {
  AuthUser,
  RegisterResponse,
  MessageResponse,
} from "@/types/auth";
import {
  parseCsrfMeta,
  registerPayloadSchema,
  sessionAuthResponseSchema,
} from "@/lib/validation/auth";

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

interface CsrfMeta {
  headerName: string;
  token: string;
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
  const csrfRef = useRef<CsrfMeta | null>(null);

  const updateCsrfMeta = useCallback((payload: unknown) => {
    const csrfMeta = parseCsrfMeta(payload);
    if (csrfMeta) {
      csrfRef.current = csrfMeta;
    }
  }, []);

  const ensureCsrf = useCallback(async (forceRefresh = false): Promise<CsrfMeta | null> => {
    if (!forceRefresh && csrfRef.current) {
      return csrfRef.current;
    }

    try {
      const res = await fetch("/api/auth/session", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const payload = await res.json().catch(() => ({}));
      updateCsrfMeta(payload);
      return csrfRef.current;
    } catch {
      return null;
    }
  }, [updateCsrfMeta]);

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

        const payload = await res.json().catch(() => ({}));
        updateCsrfMeta(payload);

        if (!res.ok) {
          throw new Error("No session");
        }

        const sessionResult = sessionAuthResponseSchema.safeParse(payload);
        if (!sessionResult.success) {
          throw new Error("Invalid session response");
        }

        if (!cancelled) {
          setState({
            user: sessionResult.data.user,
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
  }, [bootstrapOnMount, clearSession, pathname, router, updateCsrfMeta]);

  const authFetch = useCallback(
    async (
      url: string,
      options: RequestInit,
    ): Promise<{ ok: boolean; data: unknown; status: number }> => {
      const method = (options.method ?? "GET").toUpperCase();
      const requiresCsrf = method !== "GET" && method !== "HEAD";

      const execute = async (): Promise<{ res: Response; data: unknown }> => {
        const headers = new Headers(options.headers ?? {});

        if (requiresCsrf) {
          const csrfMeta = await ensureCsrf();
          if (csrfMeta) {
            headers.set(csrfMeta.headerName, csrfMeta.token);
          }
        }

        const res = await fetch(url, {
          ...options,
          headers,
          credentials: options.credentials ?? "include",
        });

        const data = await res.json().catch(() => ({}));
        updateCsrfMeta(data);
        return { res, data };
      };

      let result = await execute();

      if (requiresCsrf && result.res.status === 403) {
        await ensureCsrf(true);
        result = await execute();
      }

      return { ok: result.res.ok, data: result.data, status: result.res.status };
    },
    [ensureCsrf, updateCsrfMeta],
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

        const sessionResult = sessionAuthResponseSchema.safeParse(data);
        if (!sessionResult.success) {
          return { success: false, error: "Resposta de login invalida" };
        }

        setState({ user: sessionResult.data.user, isAuthenticated: true, isLoading: false });
        return { success: true };
      } catch {
        return { success: false, error: "Falha ao realizar login" };
      }
    },
    [authFetch],
  );

  const logout = useCallback(async () => {
    try {
      await authFetch("/api/auth/logout", {
        method: "POST",
      });
    } catch {
      // Logout é idempotente por contrato.
    } finally {
      clearSession();
      router.push("/login");
    }
  }, [authFetch, clearSession, router]);

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
        const payloadResult = registerPayloadSchema.safeParse(data);
        if (!payloadResult.success) {
          return { success: false, error: "Dados de cadastro invalidos" };
        }

        const { ok, data: payloadData } = await authFetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payloadResult.data),
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

        const sessionResult = sessionAuthResponseSchema.safeParse(data);
        if (!sessionResult.success) {
          return { success: false, error: "Resposta de verificacao invalida" };
        }

        setState({ user: sessionResult.data.user, isAuthenticated: true, isLoading: false });

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
