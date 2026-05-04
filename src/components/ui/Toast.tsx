"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";

interface ToastDisplayProps {
  message: string;
  duration: number;
  onDone: () => void;
}

export function ToastDisplay({ message, duration, onDone }: ToastDisplayProps) {
  const [visible, setVisible] = useState(true);
  const [barWidth, setBarWidth] = useState(100);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setBarWidth(0));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const hide = window.setTimeout(() => setVisible(false), duration);
    const remove = window.setTimeout(onDone, duration + 350);
    return () => {
      window.clearTimeout(hide);
      window.clearTimeout(remove);
    };
  }, [duration, onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="w-full max-w-sm bg-surface-container-low border border-error/30 rounded-2xl shadow-lg overflow-hidden pointer-events-auto"
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <AlertCircle size={18} className="text-error shrink-0" />
            <p className="text-sm text-on-surface font-medium">{message}</p>
          </div>
          <div className="h-1 bg-surface-container-high">
            <div
              className="h-full bg-error"
              style={{
                width: `${barWidth}%`,
                transition: `width ${duration}ms linear`,
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
