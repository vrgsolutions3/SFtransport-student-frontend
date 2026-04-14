import { NextRequest, NextResponse } from "next/server";

import { getBackendApiBaseUrl, getServiceSecret } from "@/lib/server/bff-auth";
import { validateCsrfToken } from "@/lib/server/csrf";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getFieldErrors, resetPasswordSchema } from "@/lib/validation/auth";

export async function POST(request: NextRequest) {
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(`reset-password:${clientIp}`, 10, 3600000)) {
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
    const bodyResult = resetPasswordSchema.safeParse(rawBody);

    if (!bodyResult.success) {
      const fieldErrors = getFieldErrors(bodyResult.error);
      const firstError = Object.values(fieldErrors)[0] ?? "Dados invalidos.";
      return NextResponse.json({ message: firstError, errors: fieldErrors }, { status: 400 });
    }

    const upstream = await fetch(`${getBackendApiBaseUrl()}/auth/student/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-service-secret": getServiceSecret(),
      },
      body: JSON.stringify(bodyResult.data),
      cache: "no-store",
    });

    const data = await upstream.json().catch(() => ({}));

    // If token is expired/invalid, return with expired flag
    if (upstream.status === 400 || upstream.status === 401) {
      const payload = data as { message?: string; expired?: boolean };
      return NextResponse.json(
        {
          message: "Token inválido ou expirado. Solicite um novo link de recuperação.",
          expired: payload?.expired ?? true,
          reason: "token_invalid_or_expired",
        },
        { status: 400 },
      );
    }

    if (!upstream.ok) {
      return NextResponse.json(data, { status: upstream.status });
    }

    return NextResponse.json({ message: "Senha redefinida com sucesso." }, { status: 200 });
  } catch (error) {
    console.error("[BFF][auth/reset-password] error:", error);

    return NextResponse.json(
      { message: "Falha ao redefinir senha. Tente novamente." },
      { status: 500 },
    );
  }
}
