import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/auth/session", () => {
    return HttpResponse.json({ message: "Sessao nao encontrada." }, { status: 401 });
  }),

  // Mock license endpoints used by the frontend tests.
  // - GET /api/v1/license/me => retorna 401 (sem licenca por padrão)
  http.get("/api/v1/license/me", () => {
    return HttpResponse.json({ message: "Sem licenca." }, { status: 401 });
  }),

  // - GET /api/v1/license-request/me => por padrão retorna null
  //   Para testes que queiram simular um pedido na fila de espera, adicione
  //   `?waitlisted=true` na URL ou envie o header `x-mock-waitlisted: 1`.
  http.get("/api/v1/license-request/me", (req) => {
    try {
      const url = (req as any).url;
      const headers = (req as any).headers;
      const waitlistedQuery = url?.searchParams?.get("waitlisted") === "true";
      const waitlistedHeader = headers?.get?.("x-mock-waitlisted") === "1";

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
    } catch (e) {
      return HttpResponse.json(null, { status: 200 });
    }
  }),

  // POST /api/v1/license-request — simula criação de pedido com filaPosition determinística
  http.post("/api/v1/license-request", async (req) => {
    try {
      const headers = (req as any).headers;
      const url = (req as any).url;

      // Tenta extrair universityId em várias fontes (header, query, formData, json, body)
      let universityId: string | undefined;

      universityId = headers?.get?.("x-mock-university") ?? undefined;
      if (!universityId) universityId = url?.searchParams?.get?.("universityId") ?? undefined;

      if (!universityId && typeof (req as any).formData === "function") {
        try {
          const form = await (req as any).formData();
          const val = form.get("universityId");
          if (typeof val === "string") universityId = val;
        } catch {}
      }

      if (!universityId && typeof (req as any).json === "function") {
        try {
          const bodyJson = await (req as any).json();
          universityId = bodyJson?.universityId ?? undefined;
        } catch {}
      }

      if (!universityId && (req as any).body) {
        const b = (req as any).body;
        if (typeof b === "string") {
          try {
            const parsed = JSON.parse(b);
            universityId = parsed?.universityId ?? undefined;
          } catch {
            try {
              const params = new URLSearchParams(b);
              universityId = params.get("universityId") ?? undefined;
            } catch {}
          }
        } else if (typeof b === "object" && b !== null) {
          universityId = (b as any).universityId ?? undefined;
        }
      }

      const seed = universityId ?? "default";
      // hash simples e determinístico
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
      }
      const filaPosition = (hash % 20) + 1; // posição entre 1 e 20

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
    } catch (e) {
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
