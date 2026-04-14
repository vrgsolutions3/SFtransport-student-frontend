"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLicense } from "@/hooks/useLicense";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { CardViewer } from "@/components/dashboard/card/CardViewer";
import { CardLightbox } from "@/components/dashboard/card/CardLightbox";
import { CardStatus } from "@/components/dashboard/card/CardStatus";
import { splitCardImage } from "@/lib/cardUtils";
import { getWithTTL, setWithTTL } from "@/lib/storageWithTTL";
import CardSkeleton from "@/components/dashboard/card/CardSkeleton";
import { CardNoLicense } from "@/components/dashboard/card/CardNoLicense";

const OFFLINE_LICENSE_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function getOfflineLicenseCacheKey(userId?: string): string {
  return userId ? `offline-license:${userId}` : "offline-license:guest";
}

export default function CardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { license, loading, hasLicense } = useLicense({
    enabled: isAuthenticated && !authLoading,
  });
  const [offlineLicense, setOfflineLicense] = useState<typeof license>(null);
  const [isOffline, setIsOffline] = useState(() =>
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );
  const [cardSides, setCardSides] = useState<{
    front: string;
    back: string;
  } | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const offlineCacheKey = getOfflineLicenseCacheKey(user?.id);
  const effectiveLicense = license ?? (isOffline ? offlineLicense : null);
  const hasAnyLicense = effectiveLicense !== null;

  useEffect(() => {
    const cached = getWithTTL<typeof license>(
      offlineCacheKey,
      OFFLINE_LICENSE_CACHE_TTL_MS,
    );
    setOfflineLicense(cached);
  }, [offlineCacheKey]);

  useEffect(() => {
    if (!license) return;
    setWithTTL(offlineCacheKey, license);
    setOfflineLicense(license);
  }, [license, offlineCacheKey]);

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

  useEffect(() => {
    if (!effectiveLicense) return;
    splitCardImage(effectiveLicense.imageLicense).then((sides) => {
      setCardSides(sides);
      setActiveSlide(0);
      setLightboxOpen(false);
    });
  }, [effectiveLicense]);

  const handleDownload = () => {
    if (!effectiveLicense) return;
    const link = document.createElement("a");
    link.href = `data:image/jpeg;base64,${effectiveLicense.imageLicense}`;
    link.download = "carteirinha.jpg";
    link.click();
  };

  if (loading && !hasAnyLicense) {
    return <CardSkeleton hasLicense={hasLicense || hasAnyLicense} />;
  }

  if (!hasAnyLicense || !effectiveLicense) {
    return (
      <div className="flex-1 bg-surface">
        <DashboardHeader title="Minha Carteirinha" />
        <CardNoLicense />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-surface">
      <DashboardHeader title="Minha Carteirinha" />

      <main className="pt-20 pb-10 px-4 max-w-lg mx-auto">
        {!license && isOffline && offlineLicense && (
          <div className="mb-4 rounded-xl border border-info-border bg-info-container px-4 py-3 text-sm text-on-info">
            Você está offline. Exibindo a última carteirinha salva neste dispositivo.
          </div>
        )}

        <CardViewer
          cardSides={cardSides}
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

        <button
          onClick={handleDownload}
          className="w-full bg-primary text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
          style={{
            height: "52px",
            fontSize: "15px",
            boxShadow: "0 4px 16px var(--shadow-primary)",
          }}
        >
          <Download size={18} />
          Baixar carteirinha
        </button>
      </main>
    </div>
  );
}
