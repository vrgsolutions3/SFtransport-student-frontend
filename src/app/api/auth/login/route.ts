import { NextRequest, NextResponse } from "next/server";

import {
  getBackendApiBaseUrl,
  getServiceSecret,
  getSidMaxAgeSeconds,
  SID_COOKIE_NAME,
} from "@/lib/server/bff-auth";
import { validateCsrfToken } from "@/lib/server/csrf";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { backendSessionSchema, getFieldErrors, loginCredentialsSchema } from "@/lib/validation/auth";

export async function POST(request: NextRequest) {
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(`login:${clientIp}`, 5, 60000)) {
    return NextResponse.json(
      { message: "Muitas tentativas. Tente novamente mais tarde." },
      { status: 429 },
    );
  }

  if (!(await validateCsrfToken(request))) {
    return NextResponse.json({ message: "Invalid CSRF token" }, { status: 403 });
  }

  try {
    const rawBody = await request.json();
    const bodyResult = loginCredentialsSchema.safeParse(rawBody);

    if (!bodyResult.success) {
      const fieldErrors = getFieldErrors(bodyResult.error);
      const firstError = Object.values(fieldErrors)[0] ?? "Dados de login invalidos.";
      return NextResponse.json({ message: firstError, errors: fieldErrors }, { status: 400 });
    }

    const upstream = await fetch(`${getBackendApiBaseUrl()}/auth/student/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-service-secret": getServiceSecret(),
      },
      body: JSON.stringify(bodyResult.data),
      cache: "no-store",
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      return NextResponse.json(data, { status: upstream.status });
    }

    const sessionResult = backendSessionSchema.safeParse(data);
    if (!sessionResult.success) {
      return NextResponse.json(
        { message: "Resposta inválida do backend ao criar sessão." },
        { status: 502 },
      );
    }

    const response = NextResponse.json({ ok: true, user: sessionResult.data.user });

    response.cookies.set(SID_COOKIE_NAME, sessionResult.data.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: getSidMaxAgeSeconds(),
    });

    return response;
  } catch {
    return NextResponse.json({ message: "Falha ao processar login." }, { status: 500 });
  }
}
