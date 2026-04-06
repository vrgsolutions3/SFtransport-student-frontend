"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BusFront } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLicense } from "@/hooks/useLicense";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardGreeting from "@/components/dashboard/DashboardGreeting";
import ActionCard from "@/components/dashboard/ActionCard";
import LicenseActionCard from "@/components/dashboard/LicenseActionCard";
import { DASHBOARD_ACTIONS } from "@/constants/dashboard-actions";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const { hasLicense } = useLicense();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !user) return null;

  // identifier é o email do student
  const displayName = user.name;

  return (
    <>
      <DashboardHeader onLogout={logout} />

      <main className="flex flex-col flex-1 pt-24 pb-8 px-6 max-w-lg mx-auto w-full">
        <DashboardGreeting name={displayName} />

        <nav className="flex flex-col gap-4 flex-1">
          <LicenseActionCard />
          {DASHBOARD_ACTIONS.map((action) => (
            <ActionCard
              key={action.href}
              action={action}
              disabled={action.requiresLicense === true && !hasLicense}
            />
          ))}
        </nav>

        <footer className="mt-12 flex flex-col items-center gap-1 opacity-30 pointer-events-none">
          <BusFront className="text-primary w-10 h-10" strokeWidth={2.5} aria-hidden="true" />
          <p className="font-headline font-extrabold uppercase tracking-widest text-[10px] text-on-surface">
            Prefeitura de São Fidélis
          </p>
        </footer>
      </main>
    </>
  );
}