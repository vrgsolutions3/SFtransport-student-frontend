"use client";

import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

const NAV_ORDER = ["/dashboard/card", "/dashboard", "/dashboard/profile"];
export const swipeDisabledRef = { current: false };

export function SwipeNavigator({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const currentIndex = NAV_ORDER.indexOf(pathname);
  const currentIndexRef = useRef(currentIndex);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (swipeDisabledRef.current) {
        touchStartX.current = null;
        touchStartY.current = null;
        return;
      }
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (swipeDisabledRef.current) {
        touchStartX.current = null;
        touchStartY.current = null;
        return;
      }
      if (touchStartX.current === null || touchStartY.current === null) return;

      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = e.changedTouches[0].clientY - touchStartY.current;

      touchStartX.current = null;
      touchStartY.current = null;

      if (Math.abs(dx) < Math.abs(dy)) return;
      if (Math.abs(dx) < 60) return;

      const idx = currentIndexRef.current;
      if (dx < 0 && idx < NAV_ORDER.length - 1) {
        router.push(NAV_ORDER[idx + 1]);
      } else if (dx > 0 && idx > 0) {
        router.push(NAV_ORDER[idx - 1]);
      }
    };

    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [router]);

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 35 }}
      className="flex flex-col flex-1 min-w-0 overflow-x-hidden"
    >
      {children}
    </motion.div>
  );
}
