"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { AlertCircle, ArrowLeft, Download, FileText, FolderOpen, ImageIcon, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { useLicense } from "@/hooks/useLicense";

type PhotoType = "ProfilePhoto" | "EnrollmentProof" | "CourseSchedule" | "LicenseImage";

type StudentImage = {
  _id: string;
  studentId: string;
  photoType: PhotoType;
  active: boolean;
  hasFile: boolean;
  photo3x4: string | null;
  documentImage: string | null;
};

type StudentImageListItem = {
  _id: string;
  studentId: string;
  photoType: PhotoType;
  active: boolean;
  hasFile: boolean;
};

type StudentImageFileResponse = {
  _id: string;
  studentId: string;
  photoType: PhotoType;
  active: boolean;
  photo3x4: string | null;
  documentImage: string | null;
};

const PHOTO_LABELS: Record<PhotoType, string> = {
  ProfilePhoto: "Foto 3x4",
  EnrollmentProof: "Comprovante de Matrícula",
  CourseSchedule: "Grade Horária",
  LicenseImage: "Carteirinha",
};

const DISPLAY_ORDER: PhotoType[] = ["ProfilePhoto", "EnrollmentProof", "CourseSchedule"];

function resolveDocumentData(image: StudentImage): { src: string | null; isPdf: boolean } {
  const src = image.photoType === "ProfilePhoto" ? image.photo3x4 : image.documentImage;
  if (!src) return { src: null, isPdf: false };

  return {
    src,
    isPdf: src.startsWith("data:application/pdf;base64,"),
  };
}

function downloadDataUrl(dataUrl: string, fileName: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  link.click();
}

function fileNameForType(photoType: PhotoType, isPdf: boolean): string {
  const base: Record<PhotoType, string> = {
    ProfilePhoto: "foto-3x4",
    EnrollmentProof: "comprovante-matricula",
    CourseSchedule: "grade-horaria",
    LicenseImage: "carteirinha",
  };

  return `${base[photoType]}.${isPdf ? "pdf" : "jpg"}`;
}

function DocumentsPageSkeleton() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/30">
        <div className="h-16 px-4 flex items-center">
          <div className="w-9 h-9 rounded-full bg-surface-container-low animate-pulse" />
          <div className="mx-auto h-5 w-40 rounded-md bg-surface-container-low animate-pulse" />
          <div className="w-9 h-9 rounded-full bg-surface-container-low animate-pulse" />
        </div>
      </header>

      <main className="animate-pulse pt-20 pb-10 px-5 max-w-lg mx-auto space-y-4">
        <div className="bg-surface-container-low rounded-2xl h-36 border border-outline-variant/30" />
        <div className="bg-surface-container-low rounded-2xl h-36 border border-outline-variant/30" />
        <div className="bg-surface-container-low rounded-2xl h-36 border border-outline-variant/30" />
        <div className="bg-surface-container-low rounded-xl h-12 border border-outline-variant/30" />
      </main>
    </div>
  );
}

function DocumentsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasLicense, licenseRequest, loading: licenseLoading } = useLicense({
    enabled: isAuthenticated && !authLoading,
  });

  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<StudentImage[]>([]);
  const [preview, setPreview] = useState<{ src: string; isPdf: boolean; title: string } | null>(null);
  const [dismissedRejectedKey, setDismissedRejectedKey] = useState<string | null>(null);
  const [showUpdatedBanner, setShowUpdatedBanner] = useState(
    () => searchParams.get("updated") === "true",
  );

  const hasRejectedUpdateRequest =
    licenseRequest?.type === "update" && licenseRequest?.status === "rejected";
  const rejectedBannerKey = hasRejectedUpdateRequest
    ? `${licenseRequest?.rejectionReason ?? "sem-motivo"}`
    : null;
  const showRejectedBanner =
    hasRejectedUpdateRequest && dismissedRejectedKey !== rejectedBannerKey;

  useEffect(() => {
    if (!showUpdatedBanner) return;

    const timer = window.setTimeout(() => {
      setShowUpdatedBanner(false);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [showUpdatedBanner]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    let cancelled = false;

    if (!isAuthenticated || authLoading) {
      return () => {
        cancelled = true;
      };
    }

    apiClient
      .get<StudentImageListItem[]>("/image/student/me")
      .then(async (data) => {
        if (!cancelled) {
          const list = Array.isArray(data) ? data : [];

          const hydrated = await Promise.all(
            list.map(async (item) => {
              if (!item.hasFile) {
                return {
                  ...item,
                  photo3x4: null,
                  documentImage: null,
                } as StudentImage;
              }

              const full = await apiClient
                .get<StudentImageFileResponse>(`/image/${item._id}/file`)
                .catch(() => null);

              return {
                ...item,
                photo3x4: full?.photo3x4 ?? null,
                documentImage: full?.documentImage ?? null,
              } as StudentImage;
            }),
          );

          if (!cancelled) {
            setImages(hydrated);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setImages([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated]);

  const visibleImages = useMemo(() => {
    const byType = new Map(images.map((img) => [img.photoType, img]));
    return DISPLAY_ORDER.map((type) => byType.get(type)).filter(Boolean) as StudentImage[];
  }, [images]);

  const hasPendingUpdateRequest =
    licenseRequest?.type === "update" && licenseRequest?.status === "pending";
  const canRequestDocumentUpdate = hasLicense && !hasPendingUpdateRequest;

  if (loading || authLoading || licenseLoading) {
    return <DocumentsPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-md shadow-sm flex items-center gap-3 px-4 h-16">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-surface-container-low transition-colors active:scale-95"
          aria-label="Voltar"
        >
          <ArrowLeft className="text-on-surface" size={20} />
        </button>
        <h1 className="font-headline font-bold text-on-surface text-lg flex-1">
          Meus Documentos
        </h1>
        <ThemeToggle className="text-on-surface-variant hover:bg-surface-container-low" />
      </header>

      <main className="pt-20 pb-10 px-5 max-w-lg mx-auto">
        {hasRejectedUpdateRequest && showRejectedBanner ? (
          <div className="bg-error-container border border-error/30 text-error text-sm rounded-xl px-4 py-3 mb-5 flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Sua solicitação de alteração foi recusada.</p>
              <p>
                Motivo: {licenseRequest?.rejectionReason ?? "Não informado"}. Revise os documentos e faça uma nova solicitação.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDismissedRejectedKey(rejectedBannerKey)}
              className="p-1 rounded-md hover:bg-error/10 transition-colors"
              aria-label="Fechar aviso"
            >
              <X size={14} />
            </button>
          </div>
        ) : showUpdatedBanner ? (
          <div className="bg-success-container border border-success/30 text-success text-sm rounded-xl px-4 py-3 mb-5 flex items-center gap-2">
            <AlertCircle size={16} />
            <span className="flex-1">
              Solicitação de alteração enviada com sucesso. Ela está em análise.
            </span>
            <button
              type="button"
              onClick={() => setShowUpdatedBanner(false)}
              className="p-1 rounded-md hover:bg-success/10 transition-colors"
              aria-label="Fechar aviso"
            >
              <X size={14} />
            </button>
          </div>
        ) : null}

        {visibleImages.length === 0 ? (
          <section className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-8 text-center">
            <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-surface-container flex items-center justify-center">
              <FolderOpen className="text-on-surface-variant" size={22} />
            </div>
            <h2 className="text-on-surface font-semibold mb-1">Nenhum documento enviado</h2>
            <p className="text-sm text-on-surface-variant">
              Quando você enviar seus documentos, eles aparecerão aqui para visualização e download.
            </p>
          </section>
        ) : (
          <section className="space-y-4">
            {visibleImages.map((image) => {
              const { src, isPdf } = resolveDocumentData(image);
              const title = PHOTO_LABELS[image.photoType];

              return (
                <article
                  key={image._id}
                  className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4"
                >
                  <h2 className="text-sm font-semibold text-on-surface mb-3">
                    {title}
                  </h2>

                  <div className="bg-surface rounded-xl border border-outline-variant/30 mb-3 overflow-hidden">
                    {!src ? (
                      <div className="h-40 flex flex-col items-center justify-center text-on-surface-variant gap-2">
                        <ImageIcon size={22} />
                        <span className="text-xs">Arquivo não disponível</span>
                      </div>
                    ) : isPdf ? (
                      <div className="h-48 px-4 py-3 flex items-center justify-between gap-4 bg-surface-container-low">
                        <div className="min-w-0 flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <FileText size={22} className="text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-on-surface truncate">{title}</p>
                            <p className="text-xs text-on-surface-variant">Documento em PDF</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreview({ src, isPdf: true, title })}
                          className="h-10 px-4 rounded-lg border border-outline-variant/40 text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors"
                        >
                          Visualizar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPreview({ src, isPdf: false, title })}
                        className="relative w-full h-48 bg-white"
                        aria-label={`Visualizar ${title}`}
                      >
                        <Image
                          src={src}
                          alt={title}
                          fill
                          unoptimized
                          sizes="100vw"
                          className="object-contain"
                        />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => src && downloadDataUrl(src, fileNameForType(image.photoType, isPdf))}
                    disabled={!src}
                    className="w-full h-11 rounded-xl bg-primary text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download size={16} />
                    Baixar documento
                  </button>
                </article>
              );
            })}
          </section>
        )}

        <footer className="mt-6">
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => router.push("/dashboard/documents/update")}
              disabled={!canRequestDocumentUpdate || loading || authLoading || licenseLoading}
              className="w-full h-12 rounded-xl bg-primary text-white font-semibold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Solicitar alteração de documentos
            </button>
            {!hasLicense && (
              <p className="text-sm px-3 py-2 rounded-lg border border-warning/30 bg-warning-container text-warning">
                O reenvio de documentos só pode ocorrer após a criação da carteirinha.
              </p>
            )}
            {hasPendingUpdateRequest && (
              <p className="text-sm px-3 py-2 rounded-lg border border-warning/30 bg-warning-container text-warning">
                Você já possui uma solicitação de alteração de documentos pendente. Aguarde a análise para enviar uma nova solicitação.
              </p>
            )}
          </div>
        </footer>
      </main>

      {preview && (
        preview.isPdf ? (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="relative w-full max-w-5xl rounded-2xl bg-surface border border-outline-variant/30 overflow-hidden">
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 hover:bg-black/70 transition-colors"
                aria-label="Fechar visualização"
              >
                <X size={18} className="text-white" />
              </button>
              <iframe
                title={preview.title}
                src={preview.src}
                className="w-full h-[80vh] bg-white"
              />
            </div>
          </div>
        ) : (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/70 transition-colors"
              aria-label="Fechar visualização"
            >
              <X size={20} className="text-white" />
            </button>
            <div className="relative w-full h-[90vh] max-w-5xl">
              <Image
                src={preview.src}
                alt={preview.title}
                fill
                unoptimized
                sizes="100vw"
                className="object-contain"
              />
            </div>
          </div>
        )
      )}
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={<DocumentsPageSkeleton />}>
      <DocumentsPageContent />
    </Suspense>
  );
}
