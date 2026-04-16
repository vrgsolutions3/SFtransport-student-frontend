"use client";

import { Bell, BellOff } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationsContext";

export function NotificationToggleRow() {
  const { permission, enabled, requesting, enable, disable } =
    useNotifications();

  if (permission === "unsupported") return null;

  const isBlocked = permission === "denied";
  const isOn = permission === "granted" && enabled;

  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-surface-container p-2 shrink-0">
          {isOn ? (
            <Bell className="w-4 h-4 text-primary" />
          ) : (
            <BellOff className="w-4 h-4 text-on-surface-variant" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-on-surface">Notificações</p>
          <p className="text-xs text-on-surface-variant leading-tight">
            {isBlocked
              ? "Bloqueadas nas configurações do navegador"
              : isOn
                ? "Ativadas"
                : "Desativadas"}
          </p>
        </div>
      </div>

      {!isBlocked && (
        <button
          type="button"
          role="switch"
          aria-checked={isOn}
          onClick={isOn ? disable : enable}
          disabled={requesting}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
            isOn ? "bg-primary" : "bg-surface-container-highest"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
              isOn ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      )}
    </div>
  );
}
