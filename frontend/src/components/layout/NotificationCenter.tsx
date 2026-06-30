"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, FileText, Sparkles, Brain, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/components/providers/NotificationProvider";

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { notifications, unreadCount, markAllAsRead, clearAll } = useNotifications();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500 border border-background" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-[340px] max-h-[30rem] flex flex-col rounded-xl bg-card border border-border shadow-xl overflow-hidden z-50"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-bold text-[15px] text-foreground">Notifications</h3>
              <div className="flex items-center gap-3">
                <button onClick={markAllAsRead} className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Mark all read
                </button>
                <button onClick={clearAll} className="text-[13px] font-medium text-red-500 hover:text-red-600 transition-colors">
                  Clear
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto flex-1 p-3 space-y-2">
              {notifications.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center justify-center opacity-50">
                  <Bell className="w-8 h-8 mb-2 text-gray-400" />
                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                notifications.map(n => {
                  const Icon = {
                    FileText,
                    Sparkles,
                    Brain,
                    CheckCircle2,
                    AlertTriangle
                  }[n.iconName as string] || Info;
                  
                  // Color mappings based on exact screenshot design
                  const colorConfig = {
                    success: {
                      bg: "bg-success/10",
                      text: "text-success"
                    },
                    warning: {
                      bg: "bg-warning/10",
                      text: "text-warning"
                    },
                    info: {
                      bg: "bg-primary/10",
                      text: "text-primary"
                    }
                  }[n.type] || { bg: "bg-muted", text: "text-muted-foreground" };

                  return (
                    <div 
                      key={n.id} 
                      className={`flex items-start gap-4 p-4 rounded-[12px] transition-colors ${
                        n.read ? 'bg-background' : 'bg-primary/5'
                      }`}
                    >
                      <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${colorConfig.bg} ${colorConfig.text}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-[14px] font-semibold text-foreground truncate">
                          {n.title}
                        </p>
                        <p className="text-[12px] text-muted-foreground mt-0.5">
                          {n.time}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
