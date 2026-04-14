import { NextRequest, NextResponse } from "next/server";

import { getBackendApiBaseUrl, getServiceSecret } from "@/lib/server/bff-auth";
import { validateCsrfToken } from "@/lib/server/csrf";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getFieldErrors, forgotPasswordSchema } from "@/lib/validation/auth";

export async function POST(request: NextRequest) {
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(`forgot-password:${clientIp}`, 5, 3600000)) {
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
    const bodyResult = forgotPasswordSchema.safeParse(rawBody);

    if (!bodyResult.success) {
      const fieldErrors = getFieldErrors(bodyResult.error);
      const firstError = Object.values(fieldErrors)[0] ?? "Email invalido.";
      return NextResponse.json({ message: firstError, errors: fieldErrors }, { status: 400 });
    }

    const upstream = await fetch(`${getBackendApiBaseUrl()}/auth/student/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-service-secret": getServiceSecret(),
      },
      body: JSON.stringify(bodyResult.data),
      cache: "no-store",
    });

    await upstream.json().catch(() => ({}));

    // Never expose account existence or internal reset-mail failures.
    return NextResponse.json(
      {
        message: "Se o email estiver cadastrado, você receberá um link em breve.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[BFF][auth/forgot-password] error:", error);

    // Always return generic message even on error
    return NextResponse.json(
      {
        message: "Se o email estiver cadastrado, você receberá um link em breve.",
      },
      { status: 200 },
    );
  }
}
