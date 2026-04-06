"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, LoaderCircle, X } from "lucide-react";
import { useLicense } from "@/hooks/useLicense";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import type { License } from "@/types/license";

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
  const { license, loading, hasLicense } = useLicense();
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!loading && !hasLicense) {
      router.replace("/dashboard");
    }
  }, [loading, hasLicense, router]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightboxOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightboxOpen]);

  const handleDownload = () => {
    if (!license) return;
    const link = document.createElement("a");
    link.href = `data:image/jpeg;base64,${license.imageLicense}`;
    link.download = "carteirinha.jpg";
    link.click();
  };

  if (loading || !license) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <LoaderCircle className="text-primary animate-spin" size={44} />
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
        {/* Imagem da carteirinha em alta qualidade */}
        <div
          className="rounded-2xl overflow-hidden mb-5 cursor-zoom-in"
          style={{ boxShadow: "0 8px 32px var(--shadow-primary)" }}
          onClick={() => setLightboxOpen(true)}
        >
          <img
            src={`data:image/jpeg;base64,${license.imageLicense}`}
            alt="Carteirinha estudantil"
            className="w-full h-auto block"
            draggable={false}
          />
        </div>

        {/* Lightbox */}
        {lightboxOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              onClick={() => setLightboxOpen(false)}
              aria-label="Fechar"
            >
              <X className="text-white" size={22} />
            </button>
            <img
              src={`data:image/jpeg;base64,${license.imageLicense}`}
              alt="Carteirinha estudantil ampliada"
              className="w-full max-w-2xl h-auto rounded-xl"
              draggable={false}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

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
