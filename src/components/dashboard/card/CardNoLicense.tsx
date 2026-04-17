"use client";

import { CreditCard, Clock3, ListOrdered } from "lucide-react";
import { useRouter } from "next/navigation";

interface CardNoLicenseProps {
  isUnderReview: boolean;
  isWaitlisted: boolean;
  isRejected: boolean;
}

export function CardNoLicense({
  isUnderReview,
  isWaitlisted,
}: CardNoLicenseProps) {
  const router = useRouter();

  if (isUnderReview) {
    return (
      <main className="pt-20 pb-10 px-4 max-w-lg mx-auto flex flex-col items-center text-center gap-6">
        <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center mt-8">
          <Clock3 className="text-warning" size={36} />
        </div>
        <div>
          <h2 className="font-headline font-bold text-on-surface text-xl mb-2">
            Carteirinha em análise
          </h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            Estamos validando seus documentos. Você será notificado quando
            houver uma atualização.
          </p>
        </div>
      </main>
    );
  }

  if (isWaitlisted) {
    return (
      <main className="pt-20 pb-10 px-4 max-w-lg mx-auto flex flex-col items-center text-center gap-6">
        <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center mt-8">
          <ListOrdered className="text-on-surface" size={36} />
        </div>
        <div>
          <h2 className="font-headline font-bold text-on-surface text-xl mb-2">
            Na fila de espera
          </h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            Você será notificado quando uma vaga for liberada.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-20 pb-10 px-4 max-w-lg mx-auto flex flex-col items-center text-center gap-6">
      <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center mt-8">
        <CreditCard className="text-on-surface-variant" size={36} />
      </div>
      <div>
        <h2 className="font-headline font-bold text-on-surface text-xl mb-2">
          Você ainda não tem carteirinha
        </h2>
        <p className="text-on-surface-variant text-sm leading-relaxed">
          Solicite sua carteirinha estudantil para acessar o transporte
          institucional.
        </p>
      </div>
      <button
        onClick={() => router.push("/dashboard/request-license")}
        className="w-full bg-primary text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
        style={{
          height: "52px",
          fontSize: "15px",
          boxShadow: "0 4px 16px var(--shadow-primary)",
        }}
      >
        Solicitar carteirinha
      </button>
    </main>
  );
}
