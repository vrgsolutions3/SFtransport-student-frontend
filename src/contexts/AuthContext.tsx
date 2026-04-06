// ─────────────────────────────────────────────────────────────
// contexts/AuthContext.tsx
// AuthProvider + useAuth hook.
//
// Responsabilidades:
//   - Recuperar sessão no mount via POST /auth/refresh
//   - Manter access token em memória (nunca em localStorage)
//   - Espelhar token em cookie comum (sinal para o middleware)
//   - Expor login / logout / register / verifyEmail / resendCode
//   - Injetar callbacks no apiClient (refresh, forceLogout, getToken)
// ─────────────────────────────────────────────────────────────

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { configureApiClient, apiClient } from "@/lib/apiClient";
import type {
  AuthUser,
  LoginResponse,
  RegisterResponse,
  MessageResponse,
} from "@/types/auth";

// ── Tipos do contexto ─────────────────────────────────────────

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

// ── Helpers de cookie comum (sinal para o middleware) ─────────

const ACCESS_COOKIE = "access_token";

function setAccessCookie(token: string) {
  document.cookie = `${ACCESS_COOKIE}=${token}; path=/; SameSite=Strict`;
}

function clearAccessCookie() {
  document.cookie = `${ACCESS_COOKIE}=; path=/; max-age=0; SameSite=Strict`;
}

// ── Provider ──────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Token vive apenas em memória
  const tokenRef = useRef<string | null>(null);

  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // ── Salva token em memória + cookie comum ─────────────────
  const saveToken = useCallback((token: string) => {
    tokenRef.current = token;
    setAccessCookie(token);
  }, []);

  // ── Limpa toda a sessão ───────────────────────────────────
  const clearSession = useCallback(() => {
    tokenRef.current = null;
    clearAccessCookie();
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  // ── Callback de refresh (usado pela fila anti-401) ────────
  const doRefresh = useCallback(async (): Promise<string> => {
    const data = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
      {
        method: "POST",
        credentials: "include",
      }
    );

    if (!data.ok) throw new Error("Refresh falhou");

    const json: LoginResponse = await data.json();
    saveToken(json.access_token);
    setState({
      user: json.user,
      isAuthenticated: true,
      isLoading: false,
    });
    return json.access_token;
  }, [saveToken]);

  // ── Força logout (chamado pela fila quando refresh falha) ─
  const forceLogout = useCallback(() => {
    clearSession();
    router.push("/login");
  }, [clearSession, router]);

  // ── Configura o apiClient uma única vez ───────────────────
  useEffect(() => {
    configureApiClient({
      getToken: () => tokenRef.current,
      refreshToken: doRefresh,
      forceLogout,
    });
  }, [doRefresh, forceLogout]);

  // ── Recuperação de sessão no mount ────────────────────────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await doRefresh();
      } catch {
        if (!cancelled) {
          setState({ user: null, isAuthenticated: false, isLoading: false });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── login ─────────────────────────────────────────────────
  const login = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ success: true } | { success: false; error: string }> => {
      try {
        const data = await apiClient.post<LoginResponse>(
          "/auth/student/login",
          { email, password }
        );
        saveToken(data.access_token);
        setState({ user: data.user, isAuthenticated: true, isLoading: false });
        return { success: true };
      } catch (err: unknown) {
        const msg =
          typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : "Credenciais inválidas";
        return { success: false, error: msg };
      }
    },
    [saveToken]
  );

  // ── logout ────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await apiClient.post<MessageResponse>("/auth/logout", {});
    } catch {
      // ignora erro — limpamos o estado de qualquer jeito
    } finally {
      clearSession();
      router.push("/login");
    }
  }, [clearSession, router]);

  // ── register ──────────────────────────────────────────────
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
        const res = await apiClient.post<RegisterResponse>(
          "/auth/student/register",
          data
        );
        return { success: true, isInstitutional: res.isInstitutional };
      } catch (err: unknown) {
        const msg =
          typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : "Erro ao criar conta";
        return { success: false, error: msg };
      }
    },
    []
  );

  // ── verifyEmail ───────────────────────────────────────────
  const verifyEmail = useCallback(
    async (
      email: string,
      code: string
    ): Promise<{ success: true } | { success: false; error: string }> => {
      try {
        const data = await apiClient.post<LoginResponse>(
          "/auth/student/verify",
          { email, code }
        );
        saveToken(data.access_token);
        setState({ user: data.user, isAuthenticated: true, isLoading: false });
        return { success: true };
      } catch (err: unknown) {
        const msg =
          typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : "Código inválido";
        return { success: false, error: msg };
      }
    },
    [saveToken]
  );

  // ── resendCode ────────────────────────────────────────────
  const resendCode = useCallback(
    async (
      email: string
    ): Promise<{ success: true } | { success: false; error: string }> => {
      try {
        await apiClient.post<MessageResponse>("/auth/student/resend-code", {
          email,
        });
        return { success: true };
      } catch (err: unknown) {
        const msg =
          typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : "Erro ao reenviar código";
        return { success: false, error: msg };
      }
    },
    []
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

// ── useAuth hook ──────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  }
  return ctx;
}