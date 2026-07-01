"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { Search, Bell, Sun, Moon, LogOut, Settings, User, Menu, PanelLeftClose, PanelLeft, Sparkles, Star } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { NotificationCenter } from "./NotificationCenter";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { DocumentSelector } from "./DocumentSelector";
import { GlobalSearch } from "./GlobalSearch";
import { API_BASE } from "@/lib/constants";

export function TopBar({ toggleSidebar, isSidebarOpen = true }: { toggleSidebar?: () => void, isSidebarOpen?: boolean }) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const getInitials = (name?: string, email?: string) => {
    if (!name || !name.trim()) return email?.[0]?.toUpperCase() || "A";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileOpen]);

  return (
    <header className="h-[72px] px-8 flex items-center justify-between sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border transition-all duration-300">
      <div className="flex items-center gap-4">
        {toggleSidebar && !isSidebarOpen && (
          <button 
            onClick={toggleSidebar}
            className="p-2 -ml-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Open sidebar"
          >
            <PanelLeft className="w-5 h-5" />
          </button>
        )}
        <GlobalSearch />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        
        {/* Document Selector - Hidden on very small screens, visible on md+ */}
        <div className="hidden md:block">
          <DocumentSelector />
        </div>
        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="relative p-2 rounded-full hover:bg-muted transition-colors text-foreground"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <NotificationCenter />

        {user ? (
          <div className="relative flex items-center gap-3" ref={profileRef}>
            {user.plan === "Pro" && (
              <div className="hidden sm:flex items-center gap-1 bg-gradient-to-r from-orange-400 to-orange-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm cursor-default">
                <Sparkles className="w-3 h-3" /> PRO
              </div>
            )}
            {user.plan === "Plus" && (
              <div className="hidden sm:flex items-center gap-1 bg-orange-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-sm cursor-default">
                <Star className="w-3.5 h-3.5 fill-current" /> PLUS
              </div>
            )}
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center font-bold text-sm text-foreground shadow-sm hover:border-primary/50 transition-colors cursor-pointer overflow-hidden ring-2 ring-transparent hover:ring-primary/20"
            >
              {user.avatar_url ? (
                <img src={`${API_BASE}${user.avatar_url}`} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                getInitials(user.name, user.email)
              )}
            </button>
            
            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-lg overflow-hidden flex flex-col py-1 z-50"
                >
                  <div className="px-4 py-2 border-b border-border mb-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user.name?.trim() ? user.name : "Platform User"}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {user.email || "user@example.com"}
                    </p>
                  </div>
                  
                  <Link 
                    href="/settings" 
                    onClick={() => setIsProfileOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-2 transition-colors"
                  >
                    <User className="w-3.5 h-3.5" />
                    Profile Details
                  </Link>
                  <Link 
                    href="/settings" 
                    onClick={() => setIsProfileOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-2 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Settings
                  </Link>
                  <button 
                    onClick={() => { setIsProfileOpen(false); logout(); }}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-red-500 hover:bg-red-500/10 flex items-center gap-2 transition-colors mt-1 border-t border-border"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <Link 
            href="/login" 
            className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
