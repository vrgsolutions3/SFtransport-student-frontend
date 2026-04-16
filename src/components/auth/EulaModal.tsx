"use client";

import { useRef, useState } from "react";
import { ScrollText, Check } from "lucide-react";
import { EULA_TEXT } from "@/constants/eula";

interface EulaModalProps {
  open: boolean;
  onAccept: () => void;
  onClose: () => void;
}

export function EulaModal({ open, onAccept, onClose }: EulaModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 16;
    if (atBottom) setHasScrolledToEnd(true);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl px-6 pt-6 pb-10 sm:pb-6 flex flex-col gap-5"
        style={{ maxHeight: "85dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <ScrollText className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-on-surface text-center">
            Termos de Uso
          </h2>
          {!hasScrolledToEnd && (
            <p className="text-xs text-on-surface-variant text-center">
              Role até o final para aceitar
            </p>
          )}
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto rounded-xl bg-surface-container-low p-4 text-sm text-on-surface-variant leading-relaxed whitespace-pre-line"
          style={{ minHeight: 0 }}
        >
          {EULA_TEXT}
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          <button
            type="button"
            onClick={onAccept}
            disabled={!hasScrolledToEnd}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-on-primary disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            <Check className="w-4 h-4" />
            Li e aceito os Termos
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container rounded-xl transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
