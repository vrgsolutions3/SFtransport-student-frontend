"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";

type PushPermissionState = NotificationPermission | "unsupported";

export function PushNotificationsCard() {
  const [permission, setPermission] = useState<PushPermissionState>("default");
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPermission("unsupported");
      return;
    }

    setPermission(Notification.permission);
  }, []);

  const requestPermission = async () => {
    if (requesting || !("Notification" in window)) return;

    setRequesting(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted" && "serviceWorker" in navigator) {
        try {
          await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        } catch {
          // O service worker já pode estar registrado. Ignoramos falha aqui.
        }
      }
    } finally {
      setRequesting(false);
    }
  };

  if (permission === "unsupported") {
    return null;
  }

  if (permission === "granted") {
    return (
      <section className="mb-4 rounded-2xl border border-success-border bg-success-container p-4 text-on-success">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-success/20 p-2 shrink-0">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-headline font-bold text-sm">Notificações ativadas</h2>
            <p className="text-sm/relaxed">
              Você receberá alertas importantes quando houver atualizações na sua carteirinha.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (permission === "denied") {
    return (
      <section className="mb-4 rounded-2xl border border-warning-border bg-warning-container p-4 text-on-warning">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-warning/20 p-2 shrink-0">
            <BellOff className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-headline font-bold text-sm">Notificações bloqueadas</h2>
            <p className="text-sm/relaxed">
              Para receber alertas, habilite as notificações do site nas configurações do navegador.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-4 rounded-2xl border border-info-border bg-info-container p-4 text-on-info">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-info/20 p-2 shrink-0">
          <Bell className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h2 className="font-headline font-bold text-sm">Ativar notificações</h2>
          <p className="text-sm/relaxed mb-3">
            Receba avisos quando sua solicitação mudar de status ou sua carteirinha for atualizada.
          </p>
          <button
            type="button"
            onClick={requestPermission}
            disabled={requesting}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {requesting ? "Solicitando..." : "Permitir notificações"}
          </button>
        </div>
      </div>
    </section>
  );
}
