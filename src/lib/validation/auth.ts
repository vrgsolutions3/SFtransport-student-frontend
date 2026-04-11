import { z } from "zod";

function isValidCpf(cpf: string): boolean {
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const calc = (digits: string, weights: number[]) => {
    const sum = digits.split("").reduce((acc, digit, idx) => acc + Number(digit) * weights[idx], 0);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const d1 = calc(cpf.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (d1 !== Number(cpf[9])) return false;

  const d2 = calc(cpf.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d2 === Number(cpf[10]);
}

const emailSchema = z
  .string({ error: "Email e obrigatorio" })
  .trim()
  .min(1, "Email e obrigatorio")
  .max(254, "Email deve ter no maximo 254 caracteres")
  .email("Email invalido");

const passwordRules = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

export const loginCredentialsSchema = z.object({
  email: emailSchema,
  password: z
    .string({ error: "Senha e obrigatoria" })
    .min(6, "Senha deve ter no minimo 6 caracteres")
    .max(100, "Senha deve ter no maximo 100 caracteres"),
});

export const registerPayloadSchema = z.object({
  name: z
    .string({ error: "Nome e obrigatorio" })
    .trim()
    .min(1, "Nome e obrigatorio")
    .max(100, "Nome deve ter no maximo 100 caracteres"),
  email: emailSchema,
  telephone: z
    .string({ error: "Telefone e obrigatorio" })
    .trim()
    .regex(/^\d{10,11}$/, "Telefone invalido - use DDD e 10 ou 11 digitos"),
  cpf: z
    .string({ error: "CPF e obrigatorio" })
    .trim()
    .regex(/^\d{11}$/, "CPF deve conter 11 digitos")
    .refine(isValidCpf, "CPF invalido"),
  password: z
    .string({ error: "Senha e obrigatoria" })
    .min(8, "Senha deve ter no minimo 8 caracteres")
    .max(64, "Senha deve ter no maximo 64 caracteres")
    .regex(passwordRules, "Senha deve ter maiuscula, minuscula e numero"),
});

export const registerFormSchema = registerPayloadSchema
  .extend({
    confirmPassword: z.string({ error: "Confirme a senha" }).min(1, "Confirme a senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas nao coincidem",
    path: ["confirmPassword"],
  });

export const verifyEmailSchema = z.object({
  email: emailSchema,
  code: z
    .string({ error: "Codigo e obrigatorio" })
    .trim()
    .regex(/^\d{6}$/, "Digite o codigo de 6 digitos"),
});

export const resendCodeSchema = z.object({
  email: emailSchema,
});

export const authUserSchema = z.object({
  id: z.string().min(1),
  role: z.enum(["student", "employee", "admin"]),
  identifier: z.string().min(1),
  name: z.string().min(1),
});

export const sessionAuthResponseSchema = z.object({
  ok: z.literal(true),
  user: authUserSchema,
});

export const backendSessionSchema = z.object({
  sessionId: z.string().min(1),
  user: authUserSchema,
});

const csrfPayloadSchema = z.object({
  csrf: z
    .object({
      headerName: z.string().min(1),
      token: z.string().min(1),
    })
    .optional(),
});

export type LoginCredentialsInput = z.infer<typeof loginCredentialsSchema>;
export type RegisterPayloadInput = z.infer<typeof registerPayloadSchema>;
export type RegisterFormInput = z.infer<typeof registerFormSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendCodeInput = z.infer<typeof resendCodeSchema>;

export function getFieldErrors(error: z.ZodError): Record<string, string> {
  const flat = error.flatten().fieldErrors as Record<string, string[] | undefined>;
  return Object.entries(flat).reduce<Record<string, string>>((acc, [field, issues]) => {
    if (Array.isArray(issues) && issues.length > 0) {
      acc[field] = issues[0] ?? "Campo invalido";
    }
    return acc;
  }, {});
}

export function parseCsrfMeta(payload: unknown): { headerName: string; token: string } | null {
  const result = csrfPayloadSchema.safeParse(payload);
  if (!result.success || !result.data.csrf) {
    return null;
  }
  return result.data.csrf;
}
