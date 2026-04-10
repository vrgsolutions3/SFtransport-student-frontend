"use client";

import { AlertCircle, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";

interface UpdateDocumentsPendingStateProps {
  isInitial: boolean;
  onBack: () => void;
}

export function UpdateDocumentsPendingState({
  isInitial,
  onBack,
}: UpdateDocumentsPendingStateProps) {
  return (
    <div className="min-h-screen bg-surface">
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/30 flex items-center gap-3 px-4 h-16">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-surface-container-low transition-colors active:scale-95"
          aria-label="Voltar"
        >
          <ArrowLeft className="text-on-surface" size={20} />
        </button>
        <h1 className="font-headline font-bold text-on-surface text-lg flex-1">
          Alterar Documentos
        </h1>
        <ThemeToggle className="text-on-surface-variant hover:bg-surface-container-low" />
      </header>
      <main className="pt-24 pb-10 px-5 max-w-lg mx-auto">
        <section className="bg-warning-container border border-warning/30 rounded-2xl p-6 text-center">
          <AlertCircle className="mx-auto text-warning mb-3" size={28} />
          <h2 className="text-on-surface font-semibold mb-2">
            Solicitação em andamento
          </h2>
          <p className="text-sm text-on-surface-variant mb-5">
            {isInitial
              ? "Você já tem uma solicitação pendente de criação de carteirinha. Aguarde a análise."
              : "Você já possui uma solicitação de alteração de documentos em andamento."}
          </p>
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={onBack}
          >
            Voltar
          </Button>
        </section>
      </main>
    </div>
  );
}
