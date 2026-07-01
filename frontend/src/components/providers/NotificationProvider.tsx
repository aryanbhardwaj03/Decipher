"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { FileText, Sparkles, Brain, CheckCircle2, AlertTriangle, LucideIcon, Info, Layers } from "lucide-react";
import { showToast } from "@/components/ui/Toaster";

export type NotificationType = "success" | "info" | "warning";

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  message?: string;
  time: string;
  iconName: string;
  read: boolean;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<AppNotification, "id" | "time" | "read">) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  removeNotification: (id: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const defaultNotifications: AppNotification[] = [
  { id: 1, type: "success", title: "Welcome to Decipher!", message: "Get started by uploading a document.", time: "Just now", iconName: "CheckCircle2", read: false },
];

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(defaultNotifications);
  const [latestNotification, setLatestNotification] = useState<AppNotification | null>(null);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const autoCloseTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('studyai_notifications');
      if (saved) {
        setNotifications(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load notifications');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('studyai_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = (n: Omit<AppNotification, "id" | "time" | "read">) => {
    const newNotif: AppNotification = {
      ...n,
      id: Date.now(),
      time: "Just now",
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
    
    // Show just this notification in a popup
    setLatestNotification(newNotif);
    setIsToastOpen(true);
    if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
    autoCloseTimer.current = setTimeout(() => {
      setIsToastOpen(false);
    }, 4000);
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    showToast("All notifications marked as read", "success");
  };

  const clearAll = () => {
    setNotifications([]);
    showToast("Notifications cleared", "success");
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAllAsRead,
      clearAll,
      removeNotification
    }}>
      {children}
      
      {/* Floating Individual Notification Popup */}
      {isToastOpen && latestNotification && (
        <div 
          className="fixed bottom-4 right-4 z-50 animate-[slideInRight_0.3s_ease-out]"
          onMouseEnter={() => { if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current); }}
          onMouseLeave={() => {
            autoCloseTimer.current = setTimeout(() => setIsToastOpen(false), 3000);
          }}
        >
          <div className="w-[340px] bg-card border border-border shadow-xl rounded-xl p-4 flex items-start gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
               onClick={() => setIsToastOpen(false)}>
            <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center 
              ${latestNotification.type === 'success' ? 'bg-success/10 text-success' : 
                latestNotification.type === 'warning' ? 'bg-warning/10 text-warning' : 
                'bg-primary/10 text-primary'}`}>
              {React.createElement(
                { FileText, Sparkles, Brain, CheckCircle2, AlertTriangle, Layers }[latestNotification.iconName as string] || Info,
                { className: "w-5 h-5" }
              )}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-[14px] font-semibold text-foreground truncate">
                {latestNotification.title}
              </p>
              {latestNotification.message && (
                <p className="text-[13px] text-muted-foreground mt-0.5 line-clamp-2">
                  {latestNotification.message}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
