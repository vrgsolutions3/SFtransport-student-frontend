"use client";

import { BottomNav } from "@/components/dashboard/BottomNav";
import { SwipeNavigator } from "@/components/dashboard/SwipeNavigator";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-surface pb-24">
      <SwipeNavigator>{children}</SwipeNavigator>
      <BottomNav />
    </div>
  );
}
