"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { api } from "@/lib/api";
import { ArrowLeft, BadgeCheck, LoaderCircle, Save, School, UserRound } from "lucide-react";

const SHIFT_OPTIONS = [
  { value: "Manhã", label: "Manhã" },
  { value: "Tarde", label: "Tarde" },
  { value: "Noite", label: "Noite" },
  { value: "Integral", label: "Integral" },
];

const BLOOD_TYPE_OPTIONS = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-",
];

interface StudentProfile {
  name: string;
  email: string;
  telephone: string;
  degree: string;
  shift: string;
  bloodType: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<StudentProfile>({
    name: "",
    email: "",
    telephone: "",
    degree: "",
    shift: "",
    bloodType: "",
  });

  useEffect(() => {
    api.get<StudentProfile>("/student/me")
      .then((data) => setFormData({
        name: data.name ?? "",
        email: data.email ?? "",
        telephone: data.telephone ?? "",
        degree: data.degree ?? "",
        shift: data.shift ?? "",
        bloodType: data.bloodType ?? "",
      }))
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      await api.patch("/student/me", {
        degree: formData.degree,
        shift: formData.shift,
        bloodType: formData.bloodType,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <LoaderCircle className="text-primary animate-spin" size={44} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-md shadow-sm flex items-center gap-3 px-4 h-16">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-surface-container-low transition-colors active:scale-95"
        >
          <ArrowLeft className="text-on-surface" size={20} />
        </button>
        <h1 className="font-headline font-bold text-on-surface text-lg flex-1">Meu Perfil</h1>
        <ThemeToggle className="text-on-surface-variant hover:bg-surface-container-low" />
      </header>

      <main className="pt-20 pb-10 px-5 max-w-lg mx-auto">
        {/* Info do usuário */}
        <div className="bg-primary rounded-2xl p-5 mb-6 flex items-center gap-4">

          <div className="w-14 h-14 bg-surface-container-lowest/20 rounded-full flex items-center justify-center shrink-0">
            <UserRound className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight">{formData.name}</p>
          </div>
        </div>

        {/* Feedback */}
        {success && (
          <div className="bg-success-container border border-success-border text-on-success text-sm rounded-xl px-4 py-3 mb-5 flex items-center gap-2">
            <BadgeCheck className="w-4 h-4" />
            Perfil atualizado com sucesso!
          </div>
        )}
        {error && (
          <div className="bg-error-container border border-error-border text-error text-sm rounded-xl px-4 py-3 mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Dados Acadêmicos
          </p>

          <Input
            label="Curso"
            type="text"
            icon={School}
            placeholder="Ex: Engenharia de Software"
            value={formData.degree}
            onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
          />

          {/* Turno */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
              Turno
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SHIFT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, shift: opt.value })}
                  className={`h-12 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                    formData.shift === opt.value
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "bg-surface-container-low text-on-surface-variant"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tipo sanguíneo */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
              Tipo Sanguíneo
            </label>
            <div className="grid grid-cols-4 gap-2">
              {BLOOD_TYPE_OPTIONS.map((bt) => (
                <button
                  key={bt}
                  type="button"
                  onClick={() => setFormData({ ...formData, bloodType: bt })}
                  className={`h-12 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                    formData.bloodType === bt
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "bg-surface-container-low text-on-surface-variant"
                  }`}
                >
                  {bt}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={saving}
            icon={Save}
          >
            Salvar Alterações
          </Button>
        </form>
      </main>
    </div>
  );
}
