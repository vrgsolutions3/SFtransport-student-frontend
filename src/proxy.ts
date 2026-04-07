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
// O cookie "sid" é HTTP-only e representa a sessão opaca gerenciada pelo BFF.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";

const AUTH_PUBLIC_PATHS = ["/login", "/register", "/verify-email"];
const UTILITY_PUBLIC_PATHS = ["/verify"];
const PUBLIC_PATHS = [...AUTH_PUBLIC_PATHS, ...UTILITY_PUBLIC_PATHS];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sid = request.cookies.get("sid")?.value;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isRoot = pathname === "/";

  // "/" → redireciona com base na sessão
  if (isRoot) {
    const dest = sid ? "/dashboard" : "/login";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  const isAuthPublic = AUTH_PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Autenticado tentando acessar rota de autenticação pública → vai pro dashboard
  if (isAuthPublic && sid) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Não autenticado tentando acessar rota protegida → vai pro login
  if (!isPublic && !sid) {
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