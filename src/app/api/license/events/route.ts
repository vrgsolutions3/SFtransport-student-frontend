import { NextRequest, NextResponse } from "next/server";

import {
  getBackendApiBaseUrl,
  getServiceSecret,
  SID_COOKIE_NAME,
} from "@/lib/server/bff-auth";

function buildUpstreamSseUrl(ticket: string): string {
  return `${getBackendApiBaseUrl()}/license/events?ticket=${encodeURIComponent(ticket)}`;
}

export async function POST(request: NextRequest) {
  const ticket = request.headers.get("x-sse-ticket")?.trim();

  if (!ticket) {
    return NextResponse.json({ message: "SSE ticket ausente." }, { status: 400 });
  }

  const sid = request.cookies.get(SID_COOKIE_NAME)?.value;
  const headers = new Headers();
  headers.set("accept", "text/event-stream");
  headers.set("x-service-secret", getServiceSecret());

  if (sid) {
    headers.set("x-session-id", sid);
  }

  let upstream: Response;

  try {
    upstream = await fetch(buildUpstreamSseUrl(ticket), {
      method: "GET",
      headers,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ message: "Falha ao conectar stream de eventos." }, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  }

  const responseHeaders = new Headers();
  responseHeaders.set(
    "content-type",
    upstream.headers.get("content-type") ?? "text/event-stream; charset=utf-8",
  );
  responseHeaders.set("cache-control", "no-cache, no-transform");
  responseHeaders.set("connection", "keep-alive");
  responseHeaders.set("x-accel-buffering", "no");

  return new NextResponse(upstream.body, {
    status: 200,
    headers: responseHeaders,
  });
}
