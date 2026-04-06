import { NextRequest, NextResponse } from "next/server";

import { getBackendApiBaseUrl, getServiceSecret } from "@/lib/server/bff-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const upstream = await fetch(`${getBackendApiBaseUrl()}/auth/student/resend-code`, {
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
  } catch {
    return NextResponse.json({ message: "Falha ao reenviar código." }, { status: 500 });
  }
}
