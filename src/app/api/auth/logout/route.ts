import { NextRequest, NextResponse } from "next/server";

import {
  getBackendApiBaseUrl,
  getServiceSecret,
  SID_COOKIE_NAME,
} from "@/lib/server/bff-auth";
import { validateCsrfToken } from "@/lib/server/csrf";

export async function POST(request: NextRequest) {
  if (!(await validateCsrfToken(request))) {
    return NextResponse.json({ message: "Invalid CSRF token" }, { status: 403 });
  }

  const sid = request.cookies.get(SID_COOKIE_NAME)?.value;

  try {
    const headers: HeadersInit = {
      "x-service-secret": getServiceSecret(),
    };

    if (sid) {
      headers["x-session-id"] = sid;
    }

    await fetch(`${getBackendApiBaseUrl()}/auth/logout`, {
      method: "POST",
      headers,
      cache: "no-store",
    });
  } catch {
    // Logout é idempotente por contrato: mesmo com erro no upstream,
    // o cookie local deve ser removido e a resposta deve ser sucesso.
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SID_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  return response;
}
