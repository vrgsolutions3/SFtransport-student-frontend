"use client";

import { BottomNav } from "@/components/dashboard/BottomNav";
import { SwipeNavigator } from "@/components/dashboard/SwipeNavigator";
import { NotificationsProvider } from "@/contexts/NotificationsContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NotificationsProvider>
      <div className="min-h-screen flex flex-col bg-surface pb-24 overflow-x-hidden">
        <SwipeNavigator>{children}</SwipeNavigator>
        <BottomNav />
      </div>
    </NotificationsProvider>
  );
}
