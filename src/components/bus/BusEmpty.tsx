import { Bus } from "lucide-react";

export function BusEmpty() {
  return (
    <div className="flex flex-col items-center text-center gap-4 mt-16">
      <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center">
        <Bus className="w-7 h-7 text-on-surface-variant" />
      </div>
      <div>
        <p className="font-headline font-bold text-on-surface text-lg mb-1">
          Nenhuma rota ativa
        </p>
        <p className="text-on-surface-variant text-sm">
          Não há rotas disponíveis no momento.
        </p>
      </div>
    </div>
  );
}
