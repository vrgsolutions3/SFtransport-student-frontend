"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function BusHeader() {
  const router = useRouter();

  return (
    <header
      className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/30 flex items-center px-4"
      style={{ height: "60px" }}
    >
      <div className="flex-1">
        <button
          onClick={() => router.back()}
          className="rounded-full p-2 hover:bg-surface-container transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-on-surface" />
        </button>
      </div>
      <h1
        className="font-headline font-bold text-on-surface text-center tracking-tight absolute left-1/2 -translate-x-1/2"
        style={{ fontSize: "16px" }}
      >
        Rotas Ativas
      </h1>
      <div className="flex justify-end flex-1">
        <ThemeToggle className="text-on-surface-variant hover:bg-surface-container-low" />
      </div>
    </header>
  );
}
