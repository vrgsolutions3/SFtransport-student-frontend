import { Landmark } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="-mx-8 w-[calc(100%+4rem)] bg-surface-container-low border-t border-outline-variant/20">
      <div className="w-full px-8 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
        
        {/* Lado Esquerdo */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 opacity-60 grayscale transition-all">
            <Landmark className="text-primary w-full h-full" />
          </div>
          <div>
            <p className="font-headline font-bold text-primary text-sm">
              São Fidélis Transporte
            </p>
            <p className="font-label text-[10px] text-on-surface-variant">
              Secretaria Municipal de Transportes
            </p>
          </div>
        </div>

        {/* Centro */}
        <div className="flex gap-8">
          <a href="#" className="font-label text-xs text-on-surface-variant hover:text-primary transition-colors">
            Ouvidoria
          </a>
          <a href="#" className="font-label text-xs text-on-surface-variant hover:text-primary transition-colors">
            Privacidade
          </a>
          <a href="#" className="font-label text-xs text-on-surface-variant hover:text-primary transition-colors">
            Ajuda
          </a>
        </div>

        {/* Lado Direito */}
        <p className="font-label text-[10px] text-outline">
          © {currentYear} Prefeitura de São Fidélis.
        </p>
      </div>

    </footer>
  );
}
