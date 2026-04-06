/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LogOut, Menu, UserRound } from "lucide-react";
import { api } from "@/lib/api";

interface DashboardHeaderProps {
  onLogout: () => void;
  onNavigateProfile: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
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
        className={`fixed top-0 left-0 h-full w-72 z-50 bg-surface shadow-xl transition-transform duration-300 flex flex-col ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Topo com fundo primário */}
        <div className="bg-primary px-6 pt-14 pb-6">
          <div className="w-20 h-20 rounded-full bg-white/20 border-2 border-white/40 overflow-hidden flex items-center justify-center mb-4">
            {profile?.photo ? (
              <img src={profile.photo} alt="Foto de perfil" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-white">
                {profile ? getInitials(profile.name) : ""}
              </span>
            )}
          </div>
          <p className="text-white font-bold text-base">{profile?.name ?? ""}</p>
          <p className="text-white/70 text-sm mt-0.5">{profile?.email ?? ""}</p>
        </div>

        {/* Separador */}
        <div className="mx-6 h-px bg-outline-variant/30 mb-2" />

        {/* Corpo */}
        <div className="flex flex-col gap-1 p-4 flex-1">
          <button
            onClick={() => { setDrawerOpen(false); onNavigateProfile(); }}
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-surface-container-low transition-all w-full text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <UserRound className="text-primary w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-semibold text-on-surface block">Meu Perfil</span>
              <span className="text-xs text-on-surface-muted font-normal block mt-0.5">Ver e editar informações</span>
            </div>
          </button>
        </div>

        {/* Rodapé — Sair */}
        <div className="mt-auto p-4 px-4 border-t border-outline-variant/30">
          <button
            onClick={() => { setDrawerOpen(false); onLogout(); }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-error-container/30 transition-all w-full"
          >
            <div className="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center shrink-0">
              <LogOut className="text-error w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-error">Sair</span>
          </button>
        </div>
      </div>
    </>
  );
}
