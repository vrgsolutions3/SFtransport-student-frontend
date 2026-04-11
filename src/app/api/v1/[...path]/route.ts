import { NextRequest, NextResponse } from "next/server";

import {
  getBackendApiBaseUrl,
  getServiceSecret,
  SID_COOKIE_NAME,
} from "@/lib/server/bff-auth";

function buildTargetUrl(path: string[], search: string): string {
  const base = getBackendApiBaseUrl();
  const suffix = path.join("/");
  return `${base}/${suffix}${search}`;
}

async function proxy(request: NextRequest, path: string[]) {
  if (path[0] === 'auth') {
    return NextResponse.json(
      { message: 'Use /api/auth/* para operações de autenticação.' },
      { status: 404 },
    );
  }

  const sid = request.cookies.get(SID_COOKIE_NAME)?.value;
  const targetUrl = buildTargetUrl(path, request.nextUrl.search);

  const headers = new Headers();
  const incomingContentType = request.headers.get('content-type');
  const incomingAccept = request.headers.get('accept');

  if (incomingContentType) headers.set('content-type', incomingContentType);
  if (incomingAccept) headers.set('accept', incomingAccept);

  headers.set('x-service-secret', getServiceSecret());
  if (sid) headers.set('x-session-id', sid);

  const method = request.method.toUpperCase();
  const canHaveBody = method !== 'GET' && method !== 'HEAD';
  const payload = canHaveBody ? await request.arrayBuffer() : undefined;

  // ✅ Timeout de 30s para uploads pesados (documentos/imagens)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  try {
    const upstream = await fetch(targetUrl, {
      method,
      headers,
      body: payload,
      cache: 'no-store',
      signal: controller.signal,
    });

    const responseHeaders = new Headers();
    const upstreamType = upstream.headers.get('content-type');
    if (upstreamType) responseHeaders.set('content-type', upstreamType);

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    const isAbort = err instanceof DOMException && err.name === 'AbortError';
    const isReset =
      typeof err === 'object' &&
      err !== null &&
      'cause' in err &&
      typeof (err as { cause?: unknown }).cause === 'object' &&
      (err as { cause?: { code?: string } }).cause?.code === 'ECONNRESET';

    if (isAbort) {
      return NextResponse.json(
        { message: 'O servidor demorou muito para responder. Tente novamente.' },
        { status: 504 },
      );
    }

    if (isReset) {
      return NextResponse.json(
        { message: 'Conexão interrompida durante o envio. Tente novamente.' },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { message: 'Erro interno ao processar a requisição.' },
      { status: 500 },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return proxy(request, path);
}
