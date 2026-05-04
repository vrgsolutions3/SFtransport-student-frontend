"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLicenseContext } from "@/contexts/LicenseContext";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { CardViewer } from "@/components/dashboard/card/CardViewer";
import { CardLightbox } from "@/components/dashboard/card/CardLightbox";
import { CardStatus } from "@/components/dashboard/card/CardStatus";
import { splitCardImage } from "@/lib/cardUtils";
import { getWithTTL, setWithTTL } from "@/lib/storageWithTTL";
import CardSkeleton from "@/components/dashboard/card/CardSkeleton";
import { CardNoLicense } from "@/components/dashboard/card/CardNoLicense";
import type { License } from "@/types/license";

const OFFLINE_LICENSE_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function getOfflineLicenseCacheKey(userId?: string): string {
  return userId ? `offline-license:${userId}` : "offline-license:guest";
}

export default function CardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  // Usa o LicenseContext para obter todos os dados do contexto
  const {
    license,
    loading,
    isUnderReview,
    isWaitlisted,
    isRejected,
    rejectionReason,
    hasLicense,
    // Adicione outros campos se necessário
  } = useLicenseContext();

  // Lógica de cache offline
  const offlineCacheKey = getOfflineLicenseCacheKey(user?.id);
  const offlineLicense = useMemo<License | null>(() => {
    if (license) {
      setWithTTL(offlineCacheKey, license);
      return license;
    }
    return getWithTTL<License>(offlineCacheKey, OFFLINE_LICENSE_CACHE_TTL_MS);
  }, [license, offlineCacheKey]);
  const [isOffline, setIsOffline] = useState(() =>
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );
  const [cardSides, setCardSides] = useState<{
    front: string;
    back: string;
  } | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const effectiveLicense = license ?? (isOffline ? offlineLicense : null);

  useEffect(() => {
    if (!effectiveLicense) return;
    splitCardImage(effectiveLicense.imageLicense).then((sides) => {
      setCardSides(sides);
      setActiveSlide(0);
      setLightboxOpen(false);
    });
  }, [effectiveLicense]);

  if (loading) {
    return <CardSkeleton hasLicense={false} />;
  }

  if (!effectiveLicense) {
    return (
      <div className="flex-1 bg-surface">
        <DashboardHeader title="Minha Carteirinha" />
        <CardNoLicense
          isUnderReview={isUnderReview}
          isWaitlisted={isWaitlisted}
          isRejected={isRejected}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-surface">
      <DashboardHeader title="Minha Carteirinha" />

      <main className="pt-20 pb-10 px-4 max-w-lg mx-auto">
        {!license && isOffline && offlineLicense && (
          <div className="mb-4 rounded-xl border border-info-border bg-info-container px-4 py-3 text-sm text-on-info">
            Você está offline. Exibindo a última carteirinha salva neste
            dispositivo.
          </div>
        )}

        <CardViewer
          cardSides={cardSides}
          qrCodeUrl={effectiveLicense.qrCodeUrl}
          lightboxOpen={lightboxOpen}
          onOpenLightbox={() => setLightboxOpen(true)}
          onSlideChange={(i) => setActiveSlide(i)}
        />

        <CardLightbox
          open={lightboxOpen}
          cardSides={cardSides}
          activeSlide={activeSlide}
          onClose={() => setLightboxOpen(false)}
        />

        <CardStatus
          expirationDate={effectiveLicense.expirationDate}
          status={effectiveLicense.status}
        />

      </main>
    </div>
  );
}
