"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LogOut } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { formatPhone } from "@/lib/formatters";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { ProfileCard } from "@/components/dashboard/profile/ProfileCard";
import { ProfileAcademicInfo } from "@/components/dashboard/profile/ProfileAcademicInfo";
import { ProfileSchedule } from "@/components/dashboard/profile/ProfileSchedule";
import { ProfilePhotoSheet } from "@/components/dashboard/profile/ProfilePhotoSheet";
import ProfileSkeleton from "@/components/dashboard/profile/ProfileSkeleton";
import type { StudentProfile } from "@/lib/profileUtils";

export default function ProfilePage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

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
        }),
      )
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const validateProfilePhoto = (file: File): string | null => {
    if (!ALLOWED_PROFILE_PHOTO_TYPES.includes(file.type)) {
      return "Apenas imagens JPEG e PNG são permitidas.";
    }

    if (file.size > MAX_PROFILE_PHOTO_SIZE_BYTES) {
      return "O arquivo deve ter no máximo 5MB.";
    }

    return null;
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateProfilePhoto(file);
    if (validationError) {
      setPhotoError(validationError);
      e.target.value = "";
      return;
    }

    setPhotoError(null);
    setPhotoSheetOpen(false);
    const formData = new FormData();
    formData.append("photo", file);
    const updated = await apiClient.patchForm<StudentProfile>(
      "/student/me/photo",
      formData,
    );
    setProfile((prev) => (prev ? { ...prev, photo: updated.photo } : prev));
    e.target.value = "";
  };

  const handleRemovePhoto = async () => {
    setPhotoSheetOpen(false);
    await apiClient.delete("/student/me/photo");
    setProfile((prev) => (prev ? { ...prev, photo: null } : prev));
  };

  if (loading) return <ProfileSkeleton />;
  if (!profile) return null;

  const academicRows = [
    { label: "Instituição", value: profile.institution || "Não informado" },
    { label: "Curso", value: profile.degree || "Não informado" },
    { label: "Turno", value: profile.shift || "Não informado" },
    { label: "Tipo Sanguíneo", value: profile.bloodType || "Não informado" },
    {
      label: "Telefone",
      value: profile.telephone
        ? formatPhone(profile.telephone.replace(/\D/g, ""))
        : "Não informado",
    },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <DashboardHeader title="Meu Perfil" />

      <main className="pt-20 pb-10 px-5 max-w-lg mx-auto">
        <ProfileCard
          photo={profile.photo}
          name={profile.name}
          email={profile.email}
          onOpenPhotoSheet={() => setPhotoSheetOpen(true)}
        />

        <ProfileAcademicInfo academicRows={academicRows} />

        <ProfileSchedule schedule={profile.schedule} />

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-5 py-4 bg-surface-container-low rounded-2xl text-error text-sm font-medium hover:bg-error-container/20 transition-all cursor-pointer"
        >
          <LogOut size={18} className="shrink-0" />
          Sair da Conta
        </button>
      </main>

      <ProfilePhotoSheet
        open={photoSheetOpen}
        hasPhoto={profile.photo !== null}
        onClose={() => setPhotoSheetOpen(false)}
        onCamera={() => cameraRef.current?.click()}
        onGallery={() => galleryRef.current?.click()}
        onRemove={handleRemovePhoto}
      />

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
