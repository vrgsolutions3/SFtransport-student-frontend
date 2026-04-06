"use client";

import Link from "next/link";
import { ArrowLeft, Settings2 } from "lucide-react";

export default function LicenseConfigurationPage() {
  return (
    <main className="min-h-screen bg-surface px-6 py-8 md:px-10">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface hover:bg-surface-container"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 text-center">
          <div className="mx-auto mb-4 inline-flex rounded-full bg-primary/10 p-3">
            <Settings2 className="h-6 w-6 text-primary" />
          </div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">
            Configuração de informações
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Página reservada para configuração da carteirinha.
          </p>
          <p className="mt-1 text-sm text-on-surface-variant">
            Em breve você poderá editar os dados aqui.
          </p>
        </section>
      </div>
    </main>
  );
}
