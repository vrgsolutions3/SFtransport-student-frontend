import { describe, expect, it } from "vitest";
import {
  backendSessionSchema,
  sessionAuthResponseSchema,
} from "@/lib/validation/auth";

describe("contratos auth (student frontend)", () => {
  it("deve aceitar payload valido de sessao do backend", () => {
    const parsed = backendSessionSchema.parse({
      sessionId: "507f1f77bcf86cd799439011",
      user: {
        id: "507f1f77bcf86cd799439012",
        role: "student",
        identifier: "joao@test.com",
        name: "Joao",
      },
    });

    expect(parsed.user.role).toBe("student");
  });

  it("deve rejeitar payload com _id quando id obrigatorio nao existe", () => {
    expect(() =>
      sessionAuthResponseSchema.parse({
        ok: true,
        user: {
          _id: "507f1f77bcf86cd799439012",
          role: "student",
          identifier: "joao@test.com",
          name: "Joao",
        },
      }),
    ).toThrow();
  });
});
