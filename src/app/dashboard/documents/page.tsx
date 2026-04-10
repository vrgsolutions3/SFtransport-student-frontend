"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { useLicense } from "@/hooks/useLicense";
import { DocumentsSkeleton } from "@/components/dashboard/documents/DocumentsSkeleton";
import { DocumentCard } from "@/components/dashboard/documents/DocumentCard";
import { DocumentPreview } from "@/components/dashboard/documents/DocumentPreview";
import { DocumentsBanner } from "@/components/dashboard/documents/DocumentsBanner";
import { DocumentsEmpty } from "@/components/dashboard/documents/DocumentsEmpty";
import {
  DISPLAY_ORDER,
  type StudentImage,
  type StudentImageFileResponse,
  type StudentImageListItem,
} from "@/lib/documentUtils";

function DocumentsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    hasLicense,
    licenseRequest,
    loading: licenseLoading,
  } = useLicense({
    enabled: isAuthenticated && !authLoading,
  });

  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<StudentImage[]>([]);
  const [preview, setPreview] = useState<{
    src: string;
    isPdf: boolean;
    title: string;
  } | null>(null);
  const [showRejectedBanner, setShowRejectedBanner] = useState(true);
  const [showUpdatedBanner, setShowUpdatedBanner] = useState(
    () => searchParams.get("updated") === "true",
  );

  const hasRejectedUpdateRequest =
    licenseRequest?.type === "update" && licenseRequest?.status === "rejected";

  useEffect(() => {
    if (!showUpdatedBanner) return;
    const timer = window.setTimeout(() => setShowUpdatedBanner(false), 5000);
    return () => window.clearTimeout(timer);
  }, [showUpdatedBanner]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login");
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    let cancelled = false;
    if (!isAuthenticated || authLoading)
      return () => {
        cancelled = true;
      };

    apiClient
      .get<StudentImageListItem[]>("/image/student/me")
      .then(async (data) => {
        if (!cancelled) {
          const list = Array.isArray(data) ? data : [];
          const hydrated = await Promise.all(
            list.map(async (item) => {
              if (!item.hasFile)
                return {
                  ...item,
                  photo3x4: null,
                  documentImage: null,
                } as StudentImage;
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
          if (!cancelled) setImages(hydrated);
        }
      })
      .catch(() => {
        if (!cancelled) setImages([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated]);

  const visibleImages = useMemo(() => {
    const byType = new Map(images.map((img) => [img.photoType, img]));
    return DISPLAY_ORDER.map((type) => byType.get(type)).filter(
      Boolean,
    ) as StudentImage[];
  }, [images]);

  const hasPendingUpdateRequest =
    licenseRequest?.type === "update" && licenseRequest?.status === "pending";
  const canRequestDocumentUpdate = hasLicense && !hasPendingUpdateRequest;

  if (loading || authLoading || licenseLoading) return <DocumentsSkeleton />;

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
        <DocumentsBanner
          hasRejectedUpdateRequest={hasRejectedUpdateRequest}
          showRejectedBanner={showRejectedBanner}
          showUpdatedBanner={showUpdatedBanner}
          rejectionReason={licenseRequest?.rejectionReason ?? undefined}
          onCloseRejected={() => setShowRejectedBanner(false)}
          onCloseUpdated={() => setShowUpdatedBanner(false)}
        />

        {visibleImages.length === 0 ? (
          <DocumentsEmpty />
        ) : (
          <section className="space-y-4">
            {visibleImages.map((image) => (
              <DocumentCard
                key={image._id}
                image={image}
                onPreview={(src, isPdf, title) =>
                  setPreview({ src, isPdf, title })
                }
              />
            ))}
          </section>
        )}

        <footer className="mt-6">
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => router.push("/dashboard/documents/update")}
              disabled={
                !canRequestDocumentUpdate ||
                loading ||
                authLoading ||
                licenseLoading
              }
              className="w-full h-12 rounded-xl bg-primary text-white font-semibold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Solicitar alteração de documentos
            </button>
            {!hasLicense && (
              <p className="text-sm px-3 py-2 rounded-lg border border-warning/30 bg-warning-container text-warning">
                O reenvio de documentos só pode ocorrer após a criação da
                carteirinha.
              </p>
            )}
            {hasPendingUpdateRequest && (
              <p className="text-sm px-3 py-2 rounded-lg border border-warning/30 bg-warning-container text-warning">
                Você já possui uma solicitação de alteração de documentos
                pendente. Aguarde a análise para enviar uma nova solicitação.
              </p>
            )}
          </div>
        </footer>
      </main>

      <DocumentPreview preview={preview} onClose={() => setPreview(null)} />
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={<DocumentsSkeleton />}>
      <DocumentsPageContent />
    </Suspense>
  );
}
