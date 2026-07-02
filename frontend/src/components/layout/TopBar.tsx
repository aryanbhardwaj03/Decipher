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
    <header className="h-[72px] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border transition-all duration-300">
      <div className="flex items-center gap-2 sm:gap-4">
        {toggleSidebar && !isSidebarOpen && (
          <button 
            onClick={toggleSidebar}
            className="p-2 -ml-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Open sidebar"
          >
            <PanelLeft className="w-5 h-5" />
          </button>
        )}
        <div className="hidden xs:block sm:block">
          <GlobalSearch />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        
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
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="absolute right-0 top-full mt-3 w-[280px] bg-card/95 backdrop-blur-2xl border border-border/60 rounded-2xl shadow-2xl shadow-black/10 overflow-hidden z-50"
                >
                  {/* Profile Header */}
                  <div className="relative px-5 pt-5 pb-4">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-orange-500/5" />
                    <div className="relative flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-orange-500/20 border-2 border-primary/20 flex items-center justify-center font-bold text-sm text-foreground shadow-inner overflow-hidden shrink-0">
                        {user.avatar_url ? (
                          <img src={`${API_BASE}${user.avatar_url}`} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-base">{getInitials(user.name, user.email)}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate leading-tight">
                          {user.name?.trim() ? user.name : "Platform User"}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {user.email || "user@example.com"}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          {user.plan === "Pro" ? (
                            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white px-2 py-[1px] rounded-full text-[9px] font-bold tracking-wide shadow-sm">
                              <Sparkles className="w-2.5 h-2.5" /> PRO
                            </span>
                          ) : user.plan === "Plus" ? (
                            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-2 py-[1px] rounded-full text-[9px] font-bold tracking-wide shadow-sm">
                              <Star className="w-2.5 h-2.5 fill-current" /> PLUS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-muted text-muted-foreground px-2 py-[1px] rounded-full text-[9px] font-medium tracking-wide">
                              BASIC
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {user.xp || 0} XP
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="mx-4 h-px bg-border/60" />

                  {/* Menu Items */}
                  <div className="py-1.5 px-2">
                    <Link 
                      href="/settings" 
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all duration-150 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-muted/50 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                        <User className="w-4 h-4 group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <p className="leading-tight">Profile Details</p>
                        <p className="text-[10px] text-muted-foreground/70 font-normal">Manage your account</p>
                      </div>
                    </Link>
                    <Link 
                      href="/settings" 
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all duration-150 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-muted/50 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                        <Settings className="w-4 h-4 group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <p className="leading-tight">Settings</p>
                        <p className="text-[10px] text-muted-foreground/70 font-normal">Preferences & data</p>
                      </div>
                    </Link>
                  </div>

                  {/* Divider */}
                  <div className="mx-4 h-px bg-border/60" />

                  {/* Sign Out */}
                  <div className="py-1.5 px-2">
                    <button 
                      onClick={() => { setIsProfileOpen(false); logout(); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-red-500/80 hover:text-red-500 hover:bg-red-500/5 transition-all duration-150 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-500/5 group-hover:bg-red-500/10 flex items-center justify-center transition-colors">
                        <LogOut className="w-4 h-4" />
                      </div>
                      Sign Out
                    </button>
                  </div>
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
