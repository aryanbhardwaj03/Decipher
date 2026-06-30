"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, LogIn } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function GuestPrompt() {
  const { isGuest } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Only show prompt if the user is a guest
    if (!isGuest) {
      setIsVisible(false);
      return;
    }

    // Don't show on login/signup/pricing pages
    if (pathname === "/login" || pathname === "/pricing") {
      setIsVisible(false);
      return;
    }

    // Show the prompt a few seconds after the user loads a page
    const timer = setTimeout(() => {
      // Check if they haven't dismissed it in this session
      const dismissed = sessionStorage.getItem("guestPromptDismissed");
      if (!dismissed) {
        setIsVisible(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [isGuest, pathname]);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("guestPromptDismissed", "true");
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 right-6 z-50 w-80 p-4 rounded-2xl bg-popover border border-border shadow-2xl"
        >
          <button 
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1.5 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-start gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Save your progress</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                You're in Guest Mode. Your documents and chats will be lost when you leave.
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Link 
              href="/login"
              className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl bg-primary text-white text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In to Save
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
