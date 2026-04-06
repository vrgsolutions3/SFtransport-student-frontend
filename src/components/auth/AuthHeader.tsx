"use client";

import { ThemeToggle } from "@/components/ui/ThemeToggle";
import Image from "next/image";
import { BusFront } from "lucide-react"; // Importação Lucide

export function AuthHeader() {
  return (
    <header className="relative bg-primary pt-16 pb-16 px-6 overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <Image
          src="/bus.webp" 
          alt=""
          className="object-cover" 
          fill
          priority 
          fetchPriority="high" 
          quality={40} 
          sizes="100vw"
        />
      </div>

      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle className="text-surface-container-lowest/80 hover:bg-surface-container-lowest/10 hover:text-surface-container-lowest" />
      </div>

      <div className="relative z-20 flex flex-col items-center text-center w-full">
        <div className="w-16 h-16 bg-surface-container-lowest/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-surface-container-lowest/20">
          {/* Ícone Lucide no lugar do Material Symbol */}
          <BusFront className="text-white w-9 h-9" strokeWidth={2.5} aria-hidden="true" />
        </div>

        <h1 className="text-white text-2xl font-extrabold tracking-tight mb-3 w-full truncate">
          São Fidélis Transporte
        </h1>
        <p className="text-white/90 text-sm max-w-65 leading-relaxed font-medium">
          Conectando estudantes e servidores ao futuro.
        </p>
      </div>
    </header>
  );
}