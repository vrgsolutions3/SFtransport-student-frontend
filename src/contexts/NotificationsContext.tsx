"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const STORAGE_KEY = "push_notifications_enabled";

interface NotificationsContextValue {
  permission: NotificationPermission | "unsupported";
  enabled: boolean;
  requesting: boolean;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null,
);

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");
  const [enabled, setEnabled] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPermission("unsupported");
      return;
    }

    const perm = Notification.permission;
    setPermission(perm);

    if (perm === "granted") {
      const saved = localStorage.getItem(STORAGE_KEY);
      setEnabled(saved === null ? true : saved === "true");
    }
  }, []);

  const enable = useCallback(async () => {
    if (!("Notification" in window)) return;

    if (permission === "default") {
      setRequesting(true);
      try {
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result !== "granted") return;
        try {
          await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        } catch {
          // Service worker pode já estar registrado
        }
      } finally {
        setRequesting(false);
      }
    } else if (permission === "granted") {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch {
        // Service worker pode já estar registrado
      }
    }

    setEnabled(true);
    localStorage.setItem(STORAGE_KEY, "true");
  }, [permission]);

  const disable = useCallback(async () => {
    if (permission !== "granted") return;

    const registration = await navigator.serviceWorker.getRegistration("/");
    if (registration) {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) await subscription.unsubscribe();
    }

    setEnabled(false);
    localStorage.setItem(STORAGE_KEY, "false");
  }, [permission]);

  const value: NotificationsContextValue = {
    permission,
    enabled,
    requesting,
    enable,
    disable,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error(
      "useNotifications deve ser usado dentro de <NotificationsProvider>",
    );
  }
  return ctx;
}
