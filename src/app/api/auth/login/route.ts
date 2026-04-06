import { NextRequest, NextResponse } from "next/server";

import {
  getBackendApiBaseUrl,
  getServiceSecret,
  getSidMaxAgeSeconds,
  SID_COOKIE_NAME,
} from "@/lib/server/bff-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const upstream = await fetch(`${getBackendApiBaseUrl()}/auth/student/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-service-secret": getServiceSecret(),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      return NextResponse.json(data, { status: upstream.status });
    }

    const sessionId = typeof data?.sessionId === "string" ? data.sessionId : null;

    if (!sessionId) {
      return NextResponse.json(
        { message: "Resposta inválida do backend ao criar sessão." },
        { status: 502 },
      );
    }

    const response = NextResponse.json({ ok: true, user: data.user });

    response.cookies.set(SID_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: getSidMaxAgeSeconds(),
    });

    return response;
  } catch {
    return NextResponse.json({ message: "Falha ao processar login." }, { status: 500 });
  }
}
