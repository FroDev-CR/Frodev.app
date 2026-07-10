"use client";

import { useEffect } from "react";
import { flushPending } from "@/lib/offline";

// Registra el service worker (app offline) y reenvía las escrituras
// pendientes cuando vuelve la conexión.

export default function SyncManager() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {});
    }
    void flushPending();
    const onOnline = () => void flushPending();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  return null;
}
