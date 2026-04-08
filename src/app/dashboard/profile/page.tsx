"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

import { ArrowLeft, Camera, ImageIcon,  Trash2 } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { formatPhone } from "@/lib/formatters";

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
  institution: string;
  photo: string | null;
  schedule: { day: string; period: string }[];
}

const DAY_LABELS: Record<string, string> = {
  SEG: "Segunda",
  TER: "Terça",
  QUA: "Quarta",
  QUI: "Quinta",
  SEX: "Sexta",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiClient
      .get<StudentProfile>("/student/me")
      .then((data: StudentProfile) =>
        setProfile({
          name: data.name ?? "",
          email: data.email ?? "",
          telephone: data.telephone ?? "",
          degree: data.degree ?? "",
          shift: data.shift ?? "",
          bloodType: data.bloodType ?? "",
          institution: data.institution ?? "",
          photo: data.photo ?? null,
          schedule: data.schedule ?? [],
        })
      )
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoSheetOpen(false);
    const formData = new FormData();
    formData.append("photo", file);
    const updated = await apiClient.patchForm<StudentProfile>("/student/me/photo", formData);
    setProfile((prev) => (prev ? { ...prev, photo: updated.photo } : prev));
    e.target.value = "";
  };

  const handleRemovePhoto = async () => {
    setPhotoSheetOpen(false);
    await apiClient.delete("/student/me/photo");
    setProfile((prev) => (prev ? { ...prev, photo: null } : prev));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/30">
          <div className="h-16 px-4 flex items-center">
            <div className="w-9 h-9 rounded-full bg-surface-container-low animate-pulse" />
            <div className="mx-auto h-5 w-28 rounded-md bg-surface-container-low animate-pulse" />
            <div className="w-9 h-9 rounded-full bg-surface-container-low animate-pulse" />
          </div>
        </header>

        <main className="animate-pulse pt-20 pb-10 px-5 max-w-lg mx-auto space-y-4">
          <div className="bg-surface-container-low rounded-2xl h-44 border border-outline-variant/30" />
          <div className="bg-surface-container-low rounded-2xl h-52 border border-outline-variant/30" />
          <div className="bg-surface-container-low rounded-2xl h-36 border border-outline-variant/30" />
        </main>
      </div>
    );
  }

  if (!profile) return null;

  // Agrupa horários por dia
  const scheduleByDay = profile.schedule.reduce<Record<string, string[]>>(
    (acc, { day, period }) => {
      if (!acc[day]) acc[day] = [];
      acc[day].push(period);
      return acc;
    },
    {}
  );

  const academicRows = [
    { label: "Instituição", value: profile.institution || "Não informado" },
    { label: "Curso", value: profile.degree || "Não informado" },
    { label: "Turno", value: profile.shift || "Não informado" },
    { label: "Tipo Sanguíneo", value: profile.bloodType || "Não informado" },
    { label: "Telefone", value: profile.telephone ? formatPhone(profile.telephone.replace(/\D/g, "")) : "Não informado" },
  ];

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
        <h1 className="font-headline font-bold text-on-surface text-lg flex-1">
          Meu Perfil
        </h1>
        <ThemeToggle className="text-on-surface-variant hover:bg-surface-container-low" />
      </header>

      <main className="pt-20 pb-10 px-5 max-w-lg mx-auto">
        {/* Card de perfil */}
        <div className="bg-primary rounded-2xl p-5 mb-6">
          <div className="w-20 h-20 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center overflow-hidden mx-auto mb-3">
            {profile.photo ? (
              <img
                src={profile.photo}
                alt="Foto de perfil"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-white">
                {getInitials(profile.name)}
              </span>
            )}
          </div>
          <p className="text-white font-bold text-lg text-center">
            {profile.name}
          </p>
          <p className="text-white/70 text-sm text-center">{profile.email}</p>
          <div className="flex justify-center mt-2">
            <button
              onClick={() => setPhotoSheetOpen(true)}
              className="text-white/80 text-xs underline"
            >
              Alterar foto
            </button>
          </div>
        </div>

        {/* Dados Acadêmicos */}
        <div className="bg-surface-container-low rounded-2xl p-5 space-y-4 mb-4">
          <p className="text-sm font-medium text-on-surface-variant mb-3">
            Dados Acadêmicos
          </p>
          {academicRows.map((row, i) => (
            <div key={row.label}>
              <div className="flex justify-between items-center">
                <span className="text-sm text-on-surface-variant">
                  {row.label}
                </span>
                <span className="text-sm font-medium text-on-surface">
                  {row.value}
                </span>
              </div>
              {i < academicRows.length - 1 && (
                <hr className="border-outline-variant/30 mt-4" />
              )}
            </div>
          ))}
        </div>

        {/* Grade de Horários */}
        <div className="bg-surface-container-low rounded-2xl p-5 mb-4">
          <p className="text-sm font-medium text-on-surface-variant mb-3">
            Grade de Horários
          </p>
          {profile.schedule.length === 0 ? (
            <p className="text-sm text-on-surface-muted text-center py-4">
              Nenhum horário cadastrado
            </p>
          ) : (
            <div className="space-y-1">
              {Object.entries(scheduleByDay).map(([day, periods]) => (
                <div key={day} className="flex items-center justify-between py-2">
                  <span className="text-sm text-on-surface">
                    {DAY_LABELS[day] ?? day}
                  </span>
                  <div className="flex gap-1.5 flex-wrap justify-end">
                    {periods.map((period) => (
                      <span
                        key={period}
                        className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full"
                      >
                        {period}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Bottom sheet de foto */}
      {photoSheetOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setPhotoSheetOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl px-6 pt-4 pb-10">
            <p className="text-base font-bold text-on-surface mb-4">
              Foto de perfil
            </p>
            <div className="space-y-1">
              <div
                className="flex items-center gap-3 py-3 text-sm font-medium text-on-surface cursor-pointer hover:bg-surface-container rounded-xl px-2 transition-all"
                onClick={() => cameraRef.current?.click()}
              >
                <Camera className="w-5 h-5 shrink-0" />
                Usar câmera
              </div>
              <div
                className="flex items-center gap-3 py-3 text-sm font-medium text-on-surface cursor-pointer hover:bg-surface-container rounded-xl px-2 transition-all"
                onClick={() => galleryRef.current?.click()}
              >
                <ImageIcon className="w-5 h-5 shrink-0" />
                Escolher da galeria
              </div>
              {profile.photo !== null && (
                <div
                  className="flex items-center gap-3 py-3 text-sm font-medium text-error cursor-pointer hover:bg-surface-container rounded-xl px-2 transition-all"
                  onClick={handleRemovePhoto}
                >
                  <Trash2 className="w-5 h-5 shrink-0" />
                  Remover foto
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Inputs hidden */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/jpeg,image/png"
        capture="environment"
        className="hidden"
        onChange={handlePhotoChange}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={handlePhotoChange}
      />
    </div>
  );
}
