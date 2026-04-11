export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export const DAY_LABELS: Record<string, string> = {
  SEG: "Segunda",
  TER: "Terça",
  QUA: "Quarta",
  QUI: "Quinta",
  SEX: "Sexta",
};

export const SHIFT_OPTIONS = [
  { value: "Manhã", label: "Manhã" },
  { value: "Tarde", label: "Tarde" },
  { value: "Noite", label: "Noite" },
  { value: "Integral", label: "Integral" },
];

export const BLOOD_TYPE_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export interface StudentProfile {
  name: string;
  email: string;
  telephone: string;
  degree: string;
  shift: string;
  bloodType: string;
  institution: string;
  photo: string | null;
  schedule: { day: string; period: string }[];
}
