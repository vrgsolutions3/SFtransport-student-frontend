import { NextRequest, NextResponse } from "next/server";

import { getBackendApiBaseUrl, getServiceSecret } from "@/lib/server/bff-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const upstream = await fetch(`${getBackendApiBaseUrl()}/auth/student/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-service-secret": getServiceSecret(),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Falha ao processar cadastro.";
    const isConfigError =
      typeof errorMessage === "string" &&
      (errorMessage.includes("BFF_SERVICE_SECRET") || errorMessage.includes("SERVICE_SECRET"));

    console.error("[BFF][auth/register] error:", error);

    return NextResponse.json(
      {
        message:
          process.env.NODE_ENV === "development"
            ? errorMessage
            : "Falha ao processar cadastro.",
      },
      { status: isConfigError ? 500 : 502 },
    );
  }
}
