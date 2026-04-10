"use client";

import { usePathname, useRouter } from "next/navigation";
import { CreditCard, Home, UserRound } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { icon: CreditCard, href: "/dashboard/card", label: "Carteirinha" },
  { icon: Home, href: "/dashboard", label: "Início" },
  { icon: UserRound, href: "/dashboard/profile", label: "Perfil" },
];

const SHOW_ON = ["/dashboard/card", "/dashboard", "/dashboard/profile"];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  if (!SHOW_ON.includes(pathname)) return null;

  const activeIndex = (() => {
    if (pathname === "/dashboard/card") return 0;
    if (pathname === "/dashboard/profile") return 2;
    return 1;
  })();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-6 px-6 pointer-events-none">
      <div className="relative pointer-events-auto" style={{ width: 240 }}>
        {/* Círculo flutuante */}
        <motion.div
          animate={{ x: activeIndex * 80 }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
          className="absolute left-0 z-10"
          style={{
            top: -18,
            width: 80,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div className="w-9 h-9 rounded-full bg-primary shadow-md shadow-primary/40 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {(() => {
                  const Icon = NAV_ITEMS[activeIndex]?.icon;
                  return Icon ? (
                    <Icon size={17} className="text-white" strokeWidth={2.5} />
                  ) : null;
                })()}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Barra com recorte SVG */}
        <svg
          width="240"
          height="44"
          viewBox="0 0 240 44"
          className="drop-shadow-lg"
        >
          <motion.path
            animate={{
              d: (() => {
                const cx = 40 + activeIndex * 80;
                const r = 24;
                return `M0 10 Q0 0 10 0 H${cx - r - 6} Q${cx - r} 0 ${cx - r} 6 A${r} ${r} 0 0 0 ${cx + r} 6 Q${cx + r} 0 ${cx + r + 6} 0 H230 Q240 0 240 10 V34 Q240 44 230 44 H10 Q0 44 0 34 Z`;
              })(),
            }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            fill="rgba(28,28,28,0.93)"
          />
        </svg>

        {/* Botões */}
        <div
          className="absolute inset-0 flex items-center"
          style={{ height: 44, top: 0 }}
        >
          {NAV_ITEMS.map(({ href, label, icon: Icon }, i) => {
            const active = i === activeIndex;
            return (
              <button
                key={href}
                onClick={() => router.push(href)}
                aria-label={label}
                className="flex-1 flex items-center justify-center h-full cursor-pointer"
              >
                {!active && (
                  <Icon size={18} className="text-white/40" strokeWidth={1.8} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
