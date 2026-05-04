"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { useLicenseContext } from "@/contexts/LicenseContext";
import { DocumentsSkeleton } from "@/components/dashboard/documents/DocumentsSkeleton";
import { DocumentCard } from "@/components/dashboard/documents/DocumentCard";
import { DocumentPreview } from "@/components/dashboard/documents/DocumentPreview";
import { DocumentsBanner } from "@/components/dashboard/documents/DocumentsBanner";
import { DocumentsEmpty } from "@/components/dashboard/documents/DocumentsEmpty";
import {
  DISPLAY_ORDER,
  PERSONAL_DISPLAY_ORDER,
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
  } = useLicenseContext();

  const [activeTab, setActiveTab] = useState<"license" | "personal">("license");
  const [swipeDirection, setSwipeDirection] = useState(1);
  const touchStartX = useRef<number | null>(null);

  const changeTab = (tab: "license" | "personal") => {
    setSwipeDirection(tab === "personal" ? 1 : -1);
    setActiveTab(tab);
  };
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<StudentImage[]>([]);
  const [preview, setPreview] = useState<{
    src: string;
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

  const byType = useMemo(
    () => new Map(images.map((img) => [img.photoType, img])),
    [images],
  );

  const licenseImages = useMemo(
    () =>
      DISPLAY_ORDER.map((type) => byType.get(type)).filter(
        Boolean,
      ) as StudentImage[],
    [byType],
  );

  const personalImages = useMemo(
    () =>
      PERSONAL_DISPLAY_ORDER.map((type) => byType.get(type)).filter(
        Boolean,
      ) as StudentImage[],
    [byType],
  );

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

        <div className="flex bg-surface-container-low rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => changeTab("license")}
            className={`flex-1 h-9 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === "license"
                ? "bg-surface text-on-surface shadow-sm"
                : "text-on-surface-variant"
            }`}
          >
            Carteirinha
          </button>
          <button
            type="button"
            onClick={() => changeTab("personal")}
            className={`flex-1 h-9 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === "personal"
                ? "bg-surface text-on-surface shadow-sm"
                : "text-on-surface-variant"
            }`}
          >
            Pessoais
          </button>
        </div>

        <div
          className="overflow-hidden"
          onTouchStart={(e) => {
            if (preview) return;
            touchStartX.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            if (preview || touchStartX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            touchStartX.current = null;
            if (Math.abs(dx) < 50) return;
            if (dx < 0 && activeTab === "license") changeTab("personal");
            if (dx > 0 && activeTab === "personal") changeTab("license");
          }}
        >
          <AnimatePresence mode="wait" initial={false} custom={swipeDirection}>
            <motion.section
              key={activeTab}
              custom={swipeDirection}
              variants={{
                enter: (d: number) => ({ x: d * 60, opacity: 0 }),
                center: { x: 0, opacity: 1 },
                exit: (d: number) => ({ x: d * -60, opacity: 0 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="space-y-4"
            >
              {activeTab === "license" ? (
                licenseImages.length === 0 ? (
                  <DocumentsEmpty />
                ) : (
                  licenseImages.map((image) => (
                    <DocumentCard
                      key={image._id}
                      image={image}
                      onPreview={(src, title) => setPreview({ src, title })}
                    />
                  ))
                )
              ) : personalImages.length === 0 ? (
                <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 text-center">
                  <p className="text-sm text-on-surface-variant">
                    Nenhum documento pessoal enviado ainda.
                  </p>
                </div>
              ) : (
                personalImages.map((image) => (
                  <DocumentCard
                    key={image._id}
                    image={image}
                    onPreview={(src, title) => setPreview({ src, title })}
                  />
                ))
              )}
            </motion.section>
          </AnimatePresence>
        </div>

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
