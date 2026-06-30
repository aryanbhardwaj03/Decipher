"use client";

import { useEffect, useState } from "react";

export function Toaster() {
  const [toasts, setToasts] = useState<{ id: number; message: string; type: string }[]>([]);

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message: e.detail.message, type: e.detail.type || "info" }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };

    window.addEventListener("toast" as any, handler as EventListener);
    return () => window.removeEventListener("toast" as any, handler as EventListener);
  }, []);

  const typeStyles: Record<string, string> = {
    success: "bg-emerald-500/90 text-white",
    error: "bg-red-500/90 text-white",
    info: "bg-primary/90 text-white",
    warning: "bg-amber-500/90 text-white",
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-[slideInRight_0.3s_ease-out] ${typeStyles[toast.type] || typeStyles.info}`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

/** Show a toast notification */
export function showToast(message: string, type: "success" | "error" | "info" | "warning" = "info") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("toast", { detail: { message, type } }));
  }
}
