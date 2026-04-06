// ─────────────────────────────────────────────────────────────
// middleware.ts
// Proteção de rotas no Edge Runtime (Next.js).
//
// Regras:
//   - Rota raiz "/" redireciona para /dashboard (se autenticado)
//     ou /login (se não autenticado)
//   - Rotas públicas com sessão ativa → redireciona /dashboard
//   - Rotas protegidas sem sessão     → redireciona /login
//
// O cookie "access_token" é um sinal de sessão ativa (não HTTP-only).
// A segurança real está no refresh token HTTP-only + validação do backend.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/register", "/verify-email", "/verify"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token")?.value;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isRoot = pathname === "/";

  // "/" → redireciona com base na sessão
  if (isRoot) {
    const dest = token ? "/dashboard" : "/login";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Autenticado tentando acessar rota pública → vai pro dashboard
  if (isPublic && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Não autenticado tentando acessar rota protegida → vai pro login
  if (!isPublic && !token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Aplica o middleware em todas as rotas exceto:
     * - _next/static e _next/image (assets internos do Next.js)
     * - favicon.ico e outros arquivos estáticos na raiz
     * - api routes (para não bloquear os endpoints do próprio Next)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};