"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { UploadZone } from "@/components/document/UploadZone";
import { AnimatePresence, motion } from "framer-motion";

export function AppLayout({ children, onUploadClick }: { children: React.ReactNode; onUploadClick?: () => void }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showGlobalUpload, setShowGlobalUpload] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleUpload = () => {
    if (onUploadClick) {
      onUploadClick();
    } else {
      setShowGlobalUpload(true);
    }
  };

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop fixed, Mobile drawer */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        sidebarOpen ? "md:translate-x-0" : "md:-translate-x-full"
      )}>
        <Sidebar onUploadClick={handleUpload} onClose={() => setSidebarOpen(false)} />
      </div>
      
      {/* Main Content Area */}
      <div className={cn(
        "flex-1 flex flex-col min-h-screen w-full max-w-[100vw] overflow-x-hidden transition-[padding] duration-300 ease-in-out",
        sidebarOpen ? "md:pl-[260px]" : "md:pl-0"
      )}>
        {/* Mobile Header Overlay */}
        <div className="md:hidden flex items-center p-4 border-b border-border bg-background sticky top-0 z-30">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-muted"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1 flex justify-center">
             <span className="font-semibold">Decipher</span>
          </div>
        </div>

        <div className="hidden md:block sticky top-0 z-40">
          <TopBar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} isSidebarOpen={sidebarOpen} />
        </div>
        
        <main className="flex-1 w-full bg-background">
          {children}
        </main>
      </div>

      {/* Global Upload Modal overlay */}
      <AnimatePresence>
        {showGlobalUpload && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl w-full max-w-2xl p-6 relative shadow-2xl"
            >
              <button onClick={() => setShowGlobalUpload(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted text-muted-foreground z-10">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold mb-6">Upload a new document</h2>
              <UploadZone onUploadComplete={() => { setShowGlobalUpload(false); router.push("/dashboard"); }} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
