import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/mocks/server";
import { sessionAuthResponseSchema } from "@/lib/validation/auth";

describe("contrato de sessao via MSW (student frontend)", () => {
  it("deve validar resposta da sessao com schema Zod", async () => {
    server.use(
      http.get("/api/auth/session", () => {
        return HttpResponse.json(
          sessionAuthResponseSchema.parse({
            ok: true,
            user: {
              id: "507f1f77bcf86cd799439011",
              role: "student",
              identifier: "joao@test.com",
              name: "Joao",
            },
          }),
          { status: 200 },
        );
      }),
    );

    const res = await fetch("/api/auth/session");
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(() => sessionAuthResponseSchema.parse(payload)).not.toThrow();
  });
});
