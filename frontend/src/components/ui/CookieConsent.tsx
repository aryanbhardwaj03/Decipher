"use client";

import { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if the user has already consented
    const hasConsented = localStorage.getItem("cookie_consent");
    if (!hasConsented) {
      // Delay showing the banner slightly for better UX
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie_consent", "true");
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-[9999]"
        >
          <div className="bg-background border border-border rounded-xl shadow-xl p-5 flex flex-col gap-4 relative overflow-hidden">
            
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                <Cookie className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-semibold text-sm">We value your privacy</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We use cookies and local storage to keep you logged in and remember your preferences. We do not use third-party tracking.
                </p>
                <div className="pt-1">
                  <Link href="/privacy" className="text-xs text-primary hover:underline font-medium">
                    Read our Privacy Policy
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex gap-2 w-full pt-2">
              <button
                onClick={() => setShow(false)}
                className="flex-1 px-4 py-2 text-xs font-medium border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Decline
              </button>
              <button
                onClick={acceptCookies}
                className="flex-1 px-4 py-2 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity shadow-sm"
              >
                Accept All
              </button>
            </div>
            
            <button 
              onClick={() => setShow(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
