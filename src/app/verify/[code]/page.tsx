"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BusFront, CheckCircle, XCircle, AlertCircle, LoaderCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

type VerifyResult =
  | { exists: false }
  | { exists: true; valid: boolean; status: "active" | "inactive" | "expired" };

type PageState = "loading" | "valid" | "inactive" | "not_found" | "error";

export default function VerifyPage() {
  const { code } = useParams<{ code: string }>();
  const [state, setState] = useState<PageState>("loading");

  useEffect(() => {
    if (!code) {
      setState("not_found");
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

    fetch(`${apiUrl}/license/verify/${code}`)
      .then((res) => {
        if (!res.ok) throw new Error("network");
        return res.json() as Promise<VerifyResult>;
      })
      .then((data) => {
        if (!data.exists) {
          setState("not_found");
          return;
        }
        setState(data.valid ? "valid" : "inactive");
      })
      .catch(() => setState("error"));
  }, [code]);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <header className="w-full bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/30 flex items-center justify-between px-5 h-14">
        <div className="flex items-center gap-2">
          <BusFront className="text-primary" size={20} />
          <span className="font-headline font-bold text-on-surface text-sm tracking-tight">
            Transporte São Fidélis
          </span>
        </div>
        <ThemeToggle className="text-on-surface-variant hover:bg-surface-container-low" />
      </header>

      {/* Conteúdo */}
      <main className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          {state === "loading" && <LoadingState />}
          {state === "valid" && <ValidState />}
          {state === "inactive" && <InactiveState />}
          {state === "not_found" && <NotFoundState />}
          {state === "error" && <ErrorState />}

          <p className="text-center text-on-surface-variant mt-8" style={{ fontSize: "11px" }}>
            Prefeitura Municipal de São Fidélis · Sistema de Transporte Estudantil
          </p>
        </div>
      </main>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <LoaderCircle className="text-primary animate-spin" size={48} />
      <p className="text-on-surface-variant text-sm">Verificando carteirinha...</p>
    </div>
  );
}

function ValidState() {
  return (
    <div className="flex flex-col items-center text-center gap-5">
      <div
        className="w-20 h-20 rounded-full bg-success-container flex items-center justify-center"
        style={{ boxShadow: "0 0 32px var(--shadow-success, rgba(34,197,94,0.25))" }}
      >
        <CheckCircle className="text-success" size={44} />
      </div>
      <div>
        <h1 className="font-headline font-bold text-on-surface text-2xl mb-2">
          Carteirinha válida
        </h1>
        <p className="text-on-surface-variant text-sm leading-relaxed">
          Esta carteirinha é autêntica e está ativa no sistema de transporte estudantil.
        </p>
      </div>
      <div
        className="w-full bg-success-container rounded-xl px-5 py-4 border border-success/20"
      >
        <p className="text-success font-semibold text-sm">Documento verificado com sucesso</p>
      </div>
    </div>
  );
}

function InactiveState() {
  return (
    <div className="flex flex-col items-center text-center gap-5">
      <div className="w-20 h-20 rounded-full bg-warning-container flex items-center justify-center">
        <AlertCircle className="text-warning" size={44} />
      </div>
      <div>
        <h1 className="font-headline font-bold text-on-surface text-2xl mb-2">
          Carteirinha desativada
        </h1>
        <p className="text-on-surface-variant text-sm leading-relaxed">
          Esta carteirinha existe no sistema, mas não está ativa no momento. Entre em contato com a secretaria.
        </p>
      </div>
      <div className="w-full bg-warning-container rounded-xl px-5 py-4 border border-warning/20">
        <p className="text-warning font-semibold text-sm">Documento inativo ou expirado</p>
      </div>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="flex flex-col items-center text-center gap-5">
      <div className="w-20 h-20 rounded-full bg-error-container flex items-center justify-center">
        <XCircle className="text-error" size={44} />
      </div>
      <div>
        <h1 className="font-headline font-bold text-on-surface text-2xl mb-2">
          Carteirinha não encontrada
        </h1>
        <p className="text-on-surface-variant text-sm leading-relaxed">
          Nenhuma carteirinha foi localizada com este código. O documento pode ser falso ou o QR code pode estar corrompido.
        </p>
      </div>
      <div className="w-full bg-error-container rounded-xl px-5 py-4 border border-error/20">
        <p className="text-error font-semibold text-sm">Documento não localizado no sistema</p>
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="flex flex-col items-center text-center gap-5">
      <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center">
        <AlertCircle className="text-on-surface-variant" size={44} />
      </div>
      <div>
        <h1 className="font-headline font-bold text-on-surface text-2xl mb-2">
          Erro na verificação
        </h1>
        <p className="text-on-surface-variant text-sm leading-relaxed">
          Não foi possível consultar o sistema no momento. Tente novamente em instantes.
        </p>
      </div>
    </div>
  );
}
