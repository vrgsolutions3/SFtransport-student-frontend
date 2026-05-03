import { NextRequest, NextResponse } from "next/server";

import { getBackendApiBaseUrl, getServiceSecret } from "@/lib/server/bff-auth";
import { validateCsrfToken } from "@/lib/server/csrf";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getFieldErrors, registerPayloadSchema } from "@/lib/validation/auth";

export async function POST(request: NextRequest) {
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(`register:${clientIp}`, 5, 60000)) {
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
    const bodyResult = registerPayloadSchema.safeParse(rawBody);

    if (!bodyResult.success) {
      const fieldErrors = getFieldErrors(bodyResult.error);
      const firstError = Object.values(fieldErrors)[0] ?? "Dados de cadastro invalidos.";
      return NextResponse.json({ message: firstError, errors: fieldErrors }, { status: 400 });
    }

    const upstreamUrl = `${getBackendApiBaseUrl()}/auth/student/register`;
    console.log('[BFF][auth/register] upstream:', upstreamUrl);

    const upstream = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-service-secret": getServiceSecret(),
      },
      body: JSON.stringify(bodyResult.data),
      cache: "no-store",
    });

    const data = await upstream.json().catch(() => ({}));
    console.log('[BFF][auth/register] upstream status:', upstream.status);
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("[BFF][auth/register] error:", error);

    return NextResponse.json(
      { message: "Falha ao processar cadastro. Tente novamente." },
      { status: 500 },
    );
  }
}
