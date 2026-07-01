"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

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

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3">
      {toasts.map((toast) => {
        const Icon = toast.type === "success" ? CheckCircle2 :
                     toast.type === "error" ? AlertCircle :
                     toast.type === "warning" ? AlertTriangle : Info;
                     
        const iconColor = toast.type === "success" ? "text-emerald-500" :
                          toast.type === "error" ? "text-red-500" :
                          toast.type === "warning" ? "text-amber-500" : "text-primary";

        return (
          <div
            key={toast.id}
            className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] min-w-[300px] animate-[slideInRight_0.3s_ease-out]"
          >
            <div className={`${iconColor} bg-background rounded-full p-0.5`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[14px] font-medium text-foreground flex-1 pr-2">
              {toast.message}
            </span>
            <button 
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/** Show a toast notification */
export function showToast(message: string, type: "success" | "error" | "info" | "warning" = "info") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("toast", { detail: { message, type } }));
  }
}
