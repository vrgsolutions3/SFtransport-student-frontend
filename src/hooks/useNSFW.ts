"use client";

import { useState, useEffect, useRef } from "react";
import type { NSFWModel } from "@/utils/analyzeNSFW";

type ModelState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; model: NSFWModel }
  | { status: "error"; error: string };

let globalModelState: ModelState = { status: "idle" };
const subscribers = new Set<() => void>();

function notifySubscribers() {
  subscribers.forEach((fn) => fn());
}

async function loadModelIfNeeded() {
  if (
    globalModelState.status === "loading" ||
    globalModelState.status === "ready"
  ) {
    return;
  }

  globalModelState = { status: "loading" };
  notifySubscribers();

  try {
    const [tf, nsfwjs] = await Promise.all([
      import("@tensorflow/tfjs"),
      import("nsfwjs"),
    ]);
    const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";

    const canUseWebGL = (() => {
      if (!isBrowser) return false;
      try {
        const canvas = document.createElement("canvas");
        return !!(
          canvas.getContext &&
          (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
        );
      } catch {
        return false;
      }
    })();

    const backends: string[] = [];
    if (canUseWebGL) backends.push("webgl");
    // prefer wasm if available on the build (nsfwjs may include wasm support)
    if ((tf as any).wasm != null) backends.push("wasm");
    backends.push("cpu");

    let backendSet = false;
    for (const b of backends) {
      try {
        // try to set backend silently; failure is expected on some devices
        // tf.setBackend returns a promise that resolves to boolean
        // we await tf.ready() to ensure backend initialization
        // eslint-disable-next-line no-await-in-loop
        const ok = await tf.setBackend(b as any);
        if (ok) {
          // eslint-disable-next-line no-await-in-loop
          await tf.ready();
          backendSet = true;
          break;
        }
      } catch {
        // ignore and try next
      }
    }

    if (!backendSet) {
      throw new Error("Nenhum backend do TensorFlow disponível (webgl/wasm/cpu).");
    }

    const model = await nsfwjs.load();

    globalModelState = { status: "ready", model: model as unknown as NSFWModel };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro desconhecido ao carregar modelo.";
    globalModelState = { status: "error", error: message };
  }

  notifySubscribers();
}

export type NSFWHookState =
  | { status: "idle" | "loading" }
  | { status: "ready"; model: NSFWModel }
  | { status: "error"; error: string };

export function useNSFW(): NSFWHookState & { retry: () => void } {
  const [, forceUpdate] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const update = () => {
      if (mountedRef.current) forceUpdate((n) => n + 1);
    };
    subscribers.add(update);

    loadModelIfNeeded();

    return () => {
      mountedRef.current = false;
      subscribers.delete(update);
    };
  }, []);

  const retry = () => {
    if (globalModelState.status !== "error") return;
    globalModelState = { status: "idle" };
    loadModelIfNeeded();
  };

  return { ...globalModelState, retry };
}