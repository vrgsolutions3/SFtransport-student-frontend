"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, LoaderCircle, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLicense } from "@/hooks/useLicense";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import type { License } from "@/types/license";

async function splitCardImage(base64: string): Promise<{ front: string; back: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const halfWidth = Math.floor(img.width / 2);

      function cropAndRotate(offsetX: number): string {
        const temp = document.createElement("canvas");
        temp.width = halfWidth;
        temp.height = img.height;
        temp.getContext("2d")!.drawImage(img, -offsetX, 0);

        const rotated = document.createElement("canvas");
        rotated.width = img.height;
        rotated.height = halfWidth;
        const ctx = rotated.getContext("2d")!;
        ctx.translate(img.height / 2, halfWidth / 2);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(temp, -halfWidth / 2, -img.height / 2);

        return rotated.toDataURL("image/jpeg", 0.95);
      }

      resolve({
        front: cropAndRotate(0),
        back: cropAndRotate(halfWidth),
      });
    };
    img.src = `data:image/jpeg;base64,${base64}`;
  });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function statusLabel(status: License["status"]) {
  const map: Record<License["status"], string> = {
    active: "Ativa",
    inactive: "Inativa",
    expired: "Expirada",
  };
  return map[status];
}

function statusColor(status: License["status"]) {
  const map: Record<License["status"], string> = {
    active: "text-success bg-success-container",
    inactive: "text-warning bg-warning-container",
    expired: "text-error bg-error-container",
  };
  return map[status];
}

export default function CardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { license, loading, hasLicense } = useLicense({
    enabled: isAuthenticated && !authLoading,
  });
  const [cardSides, setCardSides] = useState<{ front: string; back: string } | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      scrollRef.current?.scrollTo({ left: 0, behavior: "auto" });
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
    return (
      <div className="min-h-screen bg-surface">
        <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/30">
          <div className="h-16 px-4 flex items-center">
            <div className="w-9 h-9 rounded-full bg-surface-container-low animate-pulse" />
            <div className="mx-auto h-5 w-40 rounded-md bg-surface-container-low animate-pulse" />
            <div className="w-9 h-9 rounded-full bg-surface-container-low animate-pulse" />
          </div>
        </header>
        <main className="animate-pulse pt-20 pb-10 px-4 max-w-lg mx-auto">
          <div className="mx-auto w-4/5 bg-surface-container-low border border-outline-variant/30 h-56 mb-4" />
          <div className="flex justify-center gap-2 mb-5">
            <div className="bg-primary w-6 h-2 rounded-full" />
            <div className="bg-outline-variant w-2 h-2 rounded-full" />
          </div>
          <div className="bg-surface-container-low rounded-xl h-16 mb-4 border border-outline-variant/30" />
          <div className="bg-primary rounded-xl h-13" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/30 flex items-center gap-3 px-4 h-16">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-surface-container-low transition-colors active:scale-95"
        >
          <ArrowLeft className="text-on-surface" size={20} />
        </button>
        <h1 className="font-headline font-bold text-on-surface text-lg flex-1">
          Minha Carteirinha
        </h1>
        <ThemeToggle className="text-on-surface-variant hover:bg-surface-container-low" />
      </header>

      <main className="pt-20 pb-10 px-4 max-w-lg mx-auto">
        {/* Frente/verso com swipe horizontal */}
        <div
          ref={scrollRef}
          className="mx-auto w-4/5 flex overflow-x-auto snap-x snap-mandatory scroll-smooth mb-4"
          style={{
            scrollbarWidth: "none",
          }}
          onScroll={(e) => {
            const el = e.currentTarget;
            const index = Math.round(el.scrollLeft / el.offsetWidth);
            setActiveSlide(index);
          }}
        >
          {cardSides ? (
            <>
              <div
                className="snap-center shrink-0 w-full cursor-zoom-in"
                onClick={() => setLightboxOpen(true)}
              >
                <img
                  src={cardSides.front}
                  alt="Frente da carteirinha"
                  className="w-full h-auto block"
                  draggable={false}
                />
              </div>
              <div
                className="snap-center shrink-0 w-full cursor-zoom-in"
                onClick={() => setLightboxOpen(true)}
              >
                <img
                  src={cardSides.back}
                  alt="Verso da carteirinha"
                  className="w-full h-auto block"
                  draggable={false}
                />
              </div>
            </>
          ) : (
            <div className="w-full flex items-center justify-center py-20">
              <LoaderCircle className="text-primary animate-spin" size={32} />
            </div>
          )}
        </div>

        {lightboxOpen && cardSides && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-surface/95 p-4"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              className="absolute top-4 right-4 p-2 rounded-full bg-surface-container-high/70 hover:bg-surface-container-high transition-colors"
              onClick={() => setLightboxOpen(false)}
              aria-label="Fechar"
            >
              <X className="text-on-surface" size={22} />
            </button>
            <img
              src={activeSlide === 0 ? cardSides.front : cardSides.back}
              alt="Carteirinha ampliada"
              className="w-full max-w-sm h-auto"
              draggable={false}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        <div className="flex justify-center gap-2 mb-5">
          {["Frente", "Verso"].map((label, i) => (
            <button
              key={label}
              onClick={() => {
                if (!scrollRef.current) return;
                scrollRef.current.scrollTo({ left: i * scrollRef.current.offsetWidth, behavior: "smooth" });
                setActiveSlide(i);
              }}
              className={`transition-all duration-300 rounded-full ${
                activeSlide === i
                  ? "bg-primary w-6 h-2"
                  : "bg-outline-variant w-2 h-2"
              }`}
              aria-label={label}
            >
              <span className="sr-only">{label}</span>
            </button>
          ))}
        </div>

        {/* Status e validade */}
        <div
          className="bg-surface-container-low rounded-xl flex items-center justify-between mb-4"
          style={{ padding: "16px 20px" }}
        >
          <div>
            <p className="text-on-surface-variant" style={{ fontSize: "11px", marginBottom: "4px" }}>
              Válida até
            </p>
            <p className="font-bold text-on-surface" style={{ fontSize: "15px" }}>
              {formatDate(license.expirationDate)}
            </p>
          </div>
          <span
            className={`font-semibold rounded-full px-3 py-1 ${statusColor(license.status)}`}
            style={{ fontSize: "12px" }}
          >
            {statusLabel(license.status)}
          </span>
        </div>

        {/* Botão de download */}
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
