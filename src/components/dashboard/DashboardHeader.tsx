"use client";

import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { BusFront, LogOut, Menu, UserRound } from "lucide-react";
import { api } from "@/lib/api";

interface DashboardHeaderProps {
  onLogout: () => void;
  onNavigateProfile: () => void;
}

export default function DashboardHeader({ onLogout, onNavigateProfile }: DashboardHeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profile, setProfile] = useState<{ name: string; email: string; photo: string | null } | null>(null);

  useEffect(() => {
    api
      .get<{ name: string; email: string; photo: string | null }>("/student/me")
      .then((data) => setProfile({ name: data.name, email: data.email, photo: data.photo }))
      .catch(() => {});
  }, []);

  return (
    <>
      <header
        className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/30"
        style={{ height: "60px", display: "flex", alignItems: "center", paddingInline: "16px" }}
      >
        {/* Esquerda — menu */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors active:scale-95 shrink-0"
          style={{ padding: "8px" }}
        >
          <Menu size={20} />
        </button>

        {/* Centro — título */}
        <h1
          className="font-headline font-bold text-on-surface flex-1 text-center tracking-tight"
          style={{ fontSize: "16px" }}
        >
          Transporte São Fidélis
        </h1>

        {/* Direita — tema */}
        <div className="flex items-center shrink-0">
          <ThemeToggle className="text-on-surface-variant hover:bg-surface-container-low" />
        </div>
      </header>

      {/* Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-2/3 max-w-xs z-50 bg-surface shadow-xl transition-transform duration-300 flex flex-col rounded-r-2xl overflow-hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Topo com fundo primário */}
        <div className="bg-primary px-5 pt-12 pb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center border border-white/20">
              <BusFront className="text-white w-6 h-6" strokeWidth={2.5} />
            </div>
            <p className="text-white font-bold text-sm leading-tight">
              Transporte<br />São Fidélis
            </p>
          </div>

          <div className="border-t border-white/20 pt-4">
            <p className="text-white font-semibold text-sm">{profile?.name ?? ""}</p>
            <p className="text-white/60 text-xs mt-0.5">{profile?.email ?? ""}</p>
          </div>
        </div>

        {/* Corpo */}
        <div className="flex flex-col py-2 flex-1">
          <button
            onClick={() => { setDrawerOpen(false); onNavigateProfile(); }}
            className="flex items-center gap-4 px-5 py-4 text-sm text-on-surface hover:bg-surface-container-low transition-all w-full text-left"
          >
            <UserRound size={18} className="text-on-surface-variant shrink-0" />
            <span className="font-medium">Meu Perfil</span>
          </button>
        </div>

        {/* Rodapé — Sair */}
        <div className="border-t border-outline-variant/30">
          <button
            onClick={() => { setDrawerOpen(false); onLogout(); }}
            className="flex items-center gap-4 px-5 py-4 text-sm font-medium text-error hover:bg-error-container/20 transition-all w-full"
          >
            <LogOut size={18} className="shrink-0" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </div>
    </>
  );
}
