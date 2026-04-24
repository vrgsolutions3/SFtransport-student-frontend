import { http, HttpResponse } from "msw";

function extractUniversityId(request: Request): string | undefined {
  const headers = request.headers;
  const url = new URL(request.url);

  const headerId = headers.get("x-mock-university");
  if (headerId) return headerId;

  const queryId = url.searchParams.get("universityId");
  if (queryId) return queryId;

  const contentType = headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    return undefined;
  }

  if (contentType.includes("application/json")) {
    return undefined;
  }

  return undefined;
}

async function extractUniversityIdFromBody(request: Request): Promise<string | undefined> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    try {
      const form = await request.clone().formData();
      const value = form.get("universityId");
      if (typeof value === "string") return value;
    } catch {}
  }

  if (contentType.includes("application/json")) {
    try {
      const body = await request.clone().json();
      if (typeof body?.universityId === "string") return body.universityId;
    } catch {}
  }

  try {
    const text = await request.clone().text();
    if (!text) return undefined;

    try {
      const parsed = JSON.parse(text);
      if (typeof parsed?.universityId === "string") return parsed.universityId;
    } catch {
      const params = new URLSearchParams(text);
      const universityId = params.get("universityId");
      if (universityId) return universityId;
    }
  } catch {}

  return undefined;
}

function computeFilaPosition(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return (hash % 20) + 1;
}

export const handlers = [
  http.get("/api/auth/session", () => {
    return HttpResponse.json({ message: "Sessao nao encontrada." }, { status: 401 });
  }),

  http.get("/api/v1/license/me", () => {
    return HttpResponse.json({ message: "Sem licenca." }, { status: 401 });
  }),

  http.get("/api/v1/license-request/me", (req) => {
    try {
      const request = (req as any).request ?? req;
      const url = new URL(request.url);
      const waitlistedQuery = url.searchParams.get("waitlisted") === "true";
      const waitlistedHeader = request.headers.get("x-mock-waitlisted") === "1";

      if (waitlistedQuery || waitlistedHeader) {
        const mockReq = {
          _id: "req-mock-1",
          studentId: "student-mock-1",
          status: "waitlisted",
          type: "initial",
          rejectionReason: null,
          rejectedAt: null,
          licenseId: null,
          enrollmentPeriodId: null,
          filaPosition: 3,
          createdAt: new Date().toISOString(),
        } as const;

        return HttpResponse.json(mockReq, { status: 200 });
      }

      return HttpResponse.json(null, { status: 200 });
    } catch {
      return HttpResponse.json(null, { status: 200 });
    }
  }),

  http.post("/api/v1/license-request", async (req) => {
    try {
      const request = (req as any).request ?? req;
      const universityId = extractUniversityId(request) ?? (await extractUniversityIdFromBody(request));
      const seed = universityId ?? "default";
      const filaPosition = computeFilaPosition(seed);

      const mockReq = {
        _id: "req-mock-created",
        studentId: "student-mock-1",
        status: "waitlisted",
        type: "initial",
        rejectionReason: null,
        rejectedAt: null,
        licenseId: null,
        enrollmentPeriodId: null,
        filaPosition,
        createdAt: new Date().toISOString(),
      } as const;

      return HttpResponse.json(mockReq, { status: 201 });
    } catch {
      const fallback = {
        _id: "req-mock-created",
        studentId: "student-mock-1",
        status: "waitlisted",
        type: "initial",
        rejectionReason: null,
        rejectedAt: null,
        licenseId: null,
        enrollmentPeriodId: null,
        filaPosition: 3,
        createdAt: new Date().toISOString(),
      } as const;
      return HttpResponse.json(fallback, { status: 201 });
    }
  }),
];
