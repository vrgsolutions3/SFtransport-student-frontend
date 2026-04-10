"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLicense } from "@/hooks/useLicense";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { CardViewer } from "@/components/dashboard/card/CardViewer";
import { CardLightbox } from "@/components/dashboard/card/CardLightbox";
import { CardStatus } from "@/components/dashboard/card/CardStatus";
import { splitCardImage } from "@/lib/cardUtils";
import CardSkeleton from "@/components/dashboard/card/CardSkeleton";


export default function CardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { license, loading, hasLicense } = useLicense({
    enabled: isAuthenticated && !authLoading,
  });
  const [cardSides, setCardSides] = useState<{
    front: string;
    back: string;
  } | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!loading && !hasLicense) {
      router.replace("/dashboard");
    }
  }, [loading, hasLicense, router]);

  useEffect(() => {
    if (!license) return;
    splitCardImage(license.imageLicense).then((sides) => {
      setCardSides(sides);
      setActiveSlide(0);
      setLightboxOpen(false);
    });
  }, [license]);

  const handleDownload = () => {
    if (!license) return;
    const link = document.createElement("a");
    link.href = `data:image/jpeg;base64,${license.imageLicense}`;
    link.download = "carteirinha.jpg";
    link.click();
  };

  if (loading || !license) {
    return <CardSkeleton />
  }

  return (
    <div className="min-h-screen bg-surface">
      <DashboardHeader title="Minha Carteirinha" />

      <main className="pt-20 pb-10 px-4 max-w-lg mx-auto">
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
          expirationDate={license.expirationDate}
          status={license.status}
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
