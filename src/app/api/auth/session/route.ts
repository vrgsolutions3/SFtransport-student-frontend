import { NextRequest, NextResponse } from "next/server";

import {
  getBackendApiBaseUrl,
  getServiceSecret,
  SID_COOKIE_NAME,
} from "@/lib/server/bff-auth";
import { getCsrfHeaderName, setCsrfCookie } from "@/lib/server/csrf";

export async function GET(request: NextRequest) {
  const csrfToken = await setCsrfCookie();
  const csrf = {
    headerName: getCsrfHeaderName(),
    token: csrfToken,
  };

  const sid = request.cookies.get(SID_COOKIE_NAME)?.value;

  if (!sid) {
    return NextResponse.json({ message: "Sessão não encontrada.", csrf }, { status: 401 });
  }

  const baseHeaders: HeadersInit = {
    "x-service-secret": getServiceSecret(),
    "x-session-id": sid,
  };

  try {
    // Paraleliza as duas requisições
    const [meRes, profileRes] = await Promise.all([
      fetch(`${getBackendApiBaseUrl()}/auth/me`, {
        method: "GET",
        headers: baseHeaders,
        cache: "no-store",
      }),
      fetch(`${getBackendApiBaseUrl()}/student/me`, {
        method: "GET",
        headers: baseHeaders,
        cache: "no-store",
      }),
    ]);

    if (!meRes.ok) {
      const response = NextResponse.json({ message: "Sessão inválida.", csrf }, { status: 401 });
      response.cookies.set(SID_COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 0,
      });
      return response;
    }

    const meData = await meRes.json();

    if (meData?.userType !== "student") {
      return NextResponse.json(
        { message: "Tipo de usuário não suportado neste frontend.", csrf },
        { status: 403 },
      );
    }

    if (!profileRes.ok) {
      const response = NextResponse.json(
        { message: "Perfil do estudante n??o encontrado para esta sess??o.", csrf },
        { status: 401 },
      );
      response.cookies.set(SID_COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 0,
      });
      return response;
    }

    const profileData = await profileRes.json().catch(() => ({}));

    const userId = typeof meData?.userId === "string" ? meData.userId : "";
    const email = typeof profileData?.email === "string" ? profileData.email : userId;
    const name = typeof profileData?.name === "string" ? profileData.name : "Estudante";

    if (!userId) {
      return NextResponse.json(
        { message: "Resposta inválida ao carregar sessão.", csrf },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      csrf,
      user: {
        id: userId,
        role: "student",
        identifier: email,
        name,
      },
    });
  } catch {
    return NextResponse.json({ message: "Falha ao carregar sessão.", csrf }, { status: 500 });
  }
}
