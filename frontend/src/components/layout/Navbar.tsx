"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { ThemeToggle } from "./ThemeToggle";
import {
  LayoutDashboard,
  LogOut,
  LogIn,
  Shield,
  Sparkles,
  User,
  Cloud,
} from "lucide-react";
import { useState } from "react";

import { NotificationCenter } from "./NotificationCenter";

export function Navbar() {
  const pathname = usePathname();
  const { user, isGuest, logout } = useAuth();
  const [showSignInHint, setShowSignInHint] = useState(false);

  return (
    <motion.nav
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="sticky top-0 z-40 w-full glass"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight gradient-text hidden sm:block">
              StudyAI
            </span>
          </Link>

          {/* Center nav */}
          <div className="hidden md:flex items-center gap-0.5">
            <NavLink href="/dashboard" active={pathname === "/dashboard"}>
              Dashboard
            </NavLink>
            {user?.role === "admin" && (
              <NavLink href="/admin" active={pathname?.startsWith("/admin")}>
                Admin
              </NavLink>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <ThemeToggle />

            {isGuest ? (
              /* Guest: show sign-in prompt */
              <div className="relative">
                <Link
                  href="/login"
                  onMouseEnter={() => setShowSignInHint(true)}
                  onMouseLeave={() => setShowSignInHint(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-border bg-card hover:bg-muted transition-all text-muted-foreground hover:text-foreground"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign In</span>
                </Link>

                {/* Hover tooltip — benefits of signing in */}
                {showSignInHint && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 top-full mt-2 w-56 p-3 rounded-xl bg-popover border border-border shadow-lg z-50"
                  >
                    <p className="text-xs font-semibold mb-2 text-foreground">
                      Why sign in?
                    </p>
                    {[
                      { icon: <Cloud className="w-3 h-3" />, text: "Cloud sync your documents" },
                      { icon: <LayoutDashboard className="w-3 h-3" />, text: "Save chat & quiz history" },
                      { icon: <User className="w-3 h-3" />, text: "Cross-device access" },
                    ].map((b, i) => (
                      <div key={i} className="flex items-center gap-2 text-[10px] text-muted-foreground py-1">
                        {b.icon} {b.text}
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
            ) : (
              /* Authenticated user */
              <div className="flex items-center gap-2">
                {/* XP Badge */}
                <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/[0.08] border border-primary/[0.15]">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-semibold text-primary">
                    {user?.xp || 0} XP
                  </span>
                </div>

                {/* Avatar */}
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                  {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                </div>

                {/* Logout */}
                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        active
          ? "bg-primary/[0.08] text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
    >
      {children}
    </Link>
  );
}
