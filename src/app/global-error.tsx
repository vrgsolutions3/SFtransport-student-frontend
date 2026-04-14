"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertOctagon, RotateCcw } from "lucide-react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="pt-BR" data-scroll-behavior="smooth">
      <body className="min-h-dvh bg-mesh px-6 py-10 flex items-center justify-center">
        <section
          className="w-full max-w-xl rounded-3xl border border-outline-variant bg-surface-container-lowest p-8 sm:p-10"
          style={{ boxShadow: "var(--shadow-modal)" }}
        >
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-error-container text-error">
            <AlertOctagon className="h-7 w-7" />
          </div>

          <p className="text-center text-sm font-semibold tracking-[0.2em] text-error/80">
            ERRO CRITICO
          </p>
          <h1 className="mt-2 text-center text-2xl sm:text-3xl font-headline font-extrabold text-on-surface">
            Nao foi possivel carregar a aplicacao
          </h1>
          <p className="mt-3 text-center text-on-surface-variant">
            Ocorreu uma falha inesperada. Tente recarregar esta tela ou voltar para o inicio.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-on-primary transition hover:opacity-90"
            >
              <RotateCcw className="h-4 w-4" />
              Tentar novamente
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-outline px-6 py-3 font-semibold text-on-surface transition hover:bg-surface-container-high"
            >
              Voltar ao inicio
            </Link>
          </div>
        </section>
      </body>
    </html>
  );
}