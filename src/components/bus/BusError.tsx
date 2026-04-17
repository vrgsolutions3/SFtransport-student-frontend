import { Bus } from "lucide-react";

export function BusError() {
  return (
    <div className="flex flex-col items-center text-center gap-4 mt-16">
      <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center">
        <Bus className="w-7 h-7 text-error" />
      </div>
      <div>
        <p className="font-headline font-bold text-on-surface text-lg mb-1">
          Erro ao carregar rotas
        </p>
        <p className="text-on-surface-variant text-sm">
          Tente novamente mais tarde.
        </p>
      </div>
    </div>
  );
}
