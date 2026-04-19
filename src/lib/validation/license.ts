import { z } from "zod";

export const SHIFT_OPTIONS = ["Manhã", "Tarde", "Noite", "Integral"] as const;
export const BLOOD_TYPE_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export const step1DataSchema = z.object({
  institution: z
    .string({ error: "Instituicao de ensino e obrigatoria" })
    .trim()
    .min(1, "Instituicao de ensino e obrigatoria"),
  universityId: z
    .string()
    .min(1, "Selecione uma instituicao valida da lista."),
  degree: z
    .string({ error: "Curso e obrigatorio" })
    .trim()
    .min(1, "Curso e obrigatorio"),
  shift: z
    .string({ error: "Turno e obrigatorio" })
    .refine((value) => SHIFT_OPTIONS.includes(value as (typeof SHIFT_OPTIONS)[number]), "Turno e obrigatorio"),
  bloodType: z
    .string({ error: "Tipo sanguineo e obrigatorio" })
    .refine(
      (value) => BLOOD_TYPE_OPTIONS.includes(value as (typeof BLOOD_TYPE_OPTIONS)[number]),
      "Tipo sanguineo e obrigatorio",
    ),
});

export type Step1DataInput = z.infer<typeof step1DataSchema>;
