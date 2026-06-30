"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { FileText, Sparkles, Brain, CheckCircle2, AlertTriangle, LucideIcon } from "lucide-react";
import { showToast } from "@/components/ui/Toaster";

export type NotificationType = "success" | "info" | "warning";

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
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
  { id: 1, type: "success", title: "Document uploaded successfully", time: "Just now", iconName: "FileText", read: false },
  { id: 2, type: "info", title: "Summary generated", time: "2 mins ago", iconName: "Sparkles", read: false },
  { id: 3, type: "info", title: "Quiz generated", time: "10 mins ago", iconName: "Brain", read: false },
  { id: 4, type: "warning", title: "Storage is almost full", time: "1 hour ago", iconName: "AlertTriangle", read: true },
  { id: 5, type: "success", title: "Welcome to the platform", time: "1 day ago", iconName: "CheckCircle2", read: true },
];

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(defaultNotifications);

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
