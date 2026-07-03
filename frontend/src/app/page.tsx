"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sparkles, Grid, UploadCloud, FileText, MessageSquare, CheckSquare, Database, Share2, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UploadZone } from "@/components/document/UploadZone";

export default function OnboardingPage() {
  const router = useRouter();
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [showGridDropdown, setShowGridDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const ALL_TOOLS = [
    { name: "AI Summarizer", icon: <FileText className="w-4 h-4" />, href: "/tool/summary" },
    { name: "Ask Questions", icon: <MessageSquare className="w-4 h-4" />, href: "/tool/chat" },
    { name: "Generate Quiz", icon: <CheckSquare className="w-4 h-4" />, href: "/tool/quiz" },
    { name: "Extract Data", icon: <Database className="w-4 h-4" />, href: "/tool/figures" },
    { name: "Mind Maps", icon: <Share2 className="w-4 h-4" />, href: "/tool/notes" },
    { name: "Flashcards", icon: <Sparkles className="w-4 h-4" />, href: "/tool/flashcards" },
  ];

  const MEGA_MENU_CATEGORIES = [
    {
      title: "STUDY TOOLS",
      tools: [
        { name: "AI Summarizer", icon: <FileText className="w-4 h-4 text-emerald-500" />, href: "/tool/summary" },
        { name: "Mind Maps", icon: <Share2 className="w-4 h-4 text-pink-500" />, href: "/tool/notes" },
      ]
    },
    {
      title: "ASSESSMENT",
      tools: [
        { name: "Generate Quiz", icon: <CheckSquare className="w-4 h-4 text-orange-500" />, href: "/tool/quiz" },
        { name: "Flashcards", icon: <Sparkles className="w-4 h-4 text-indigo-500" />, href: "/tool/flashcards" },
      ]
    },
    {
      title: "DATA & ANALYSIS",
      tools: [
        { name: "Ask Questions", icon: <MessageSquare className="w-4 h-4 text-blue-500" />, href: "/tool/chat" },
        { name: "Extract Data", icon: <Database className="w-4 h-4 text-purple-500" />, href: "/tool/figures" },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navbar */}
      <header className="relative z-50 flex h-[72px] items-center justify-between bg-background px-4 sm:px-6 shadow-sm border-b border-border">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo-mark.png" alt="Decipher Logo" className="h-8 w-8 object-contain rounded-full bg-white p-[2px]" />
            <span className="text-[20px] sm:text-[22px] font-bold tracking-tight">Decipher</span>
          </Link>
          
          <nav className="hidden lg:flex items-center gap-6 text-[13px] font-bold uppercase tracking-wide text-foreground">
            <Link href="/tool/summary" className="hover:text-primary transition-colors">AI Summarizer</Link>
            <Link href="/tool/flashcards" className="hover:text-primary transition-colors">Flashcards</Link>
            <Link href="/tool/quiz" className="hover:text-primary transition-colors">Quizzes</Link>
            <Link href="/tool/chat" className="hover:text-primary transition-colors">Chat Document</Link>
            <div className="relative" onMouseLeave={() => setShowToolsDropdown(false)}>
              <button 
                onMouseEnter={() => setShowToolsDropdown(true)}
                className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer py-2"
              >
                All Tools <span className="text-[10px]">▼</span>
              </button>
              <AnimatePresence>
                {showToolsDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-[550px] z-50 cursor-default"
                  >
                    <div className="bg-card border border-border rounded-xl shadow-2xl p-6 grid grid-cols-3 gap-8">
                      {MEGA_MENU_CATEGORIES.map((category) => (
                        <div key={category.title} className="flex flex-col gap-4">
                          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{category.title}</h3>
                          <div className="flex flex-col gap-2">
                            {category.tools.map((tool) => (
                              <Link key={tool.href} href={tool.href} className="flex items-center gap-2 py-1.5 rounded-lg hover:text-primary transition-colors text-sm font-semibold normal-case tracking-normal">
                                {tool.icon} {tool.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          <Link href="/login" className="text-sm font-semibold hover:text-primary transition-colors">Login</Link>
          <Link href="/login?mode=signup" className="rounded-md bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90">
            Sign up
          </Link>
          <div className="relative" onMouseLeave={() => setShowGridDropdown(false)}>
            <button 
              onMouseEnter={() => setShowGridDropdown(true)}
              className="ml-2 rounded-lg hover:bg-muted p-1.5 transition-colors"
            >
              <Grid className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            </button>
            <AnimatePresence>
              {showGridDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full right-0 pt-2 w-48 z-50 cursor-default"
                >
                  <div className="bg-card border border-border rounded-xl shadow-lg p-2 flex flex-col gap-1">
                    {ALL_TOOLS.map(tool => (
                      <Link key={tool.href} href={tool.href} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted text-sm text-foreground font-medium transition-colors normal-case tracking-normal">
                        {tool.icon} {tool.name}
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile Toggle */}
        <div className="flex md:hidden items-center gap-1">
          <ThemeToggle />
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)} 
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-border bg-background overflow-hidden relative z-40"
          >
            <div className="px-4 py-6 flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <Link onClick={() => setShowMobileMenu(false)} href="/login" className="w-full text-center py-2.5 text-sm font-semibold rounded-lg border border-border hover:bg-muted transition-colors">
                  Login
                </Link>
                <Link onClick={() => setShowMobileMenu(false)} href="/login?mode=signup" className="w-full text-center py-2.5 rounded-lg bg-primary text-sm font-bold text-white transition hover:opacity-90">
                  Sign up
                </Link>
              </div>
              
              <div className="pt-4 border-t border-border">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Tools</h3>
                <div className="grid grid-cols-2 gap-3">
                  {ALL_TOOLS.map(tool => (
                    <Link 
                      onClick={() => setShowMobileMenu(false)} 
                      key={tool.href} 
                      href={tool.href} 
                      className="flex items-center gap-2 p-3 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors text-sm font-medium"
                    >
                      {tool.icon} <span className="truncate">{tool.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-16 sm:pt-[100px] pb-24 sm:pb-[120px]">
        <h1 className="text-center text-4xl sm:text-[44px] md:text-[56px] font-bold tracking-tight text-foreground leading-[1.1]">
          AI Summarizer
        </h1>
        
        <p className="mt-4 max-w-[600px] text-center text-lg sm:text-[22px] text-muted-foreground font-light leading-snug px-2">
          Summarize PDF reports, essays, and study guides with AI
        </p>

        <div className="mt-8 sm:mt-12 w-full max-w-[800px]">
           <div className="bg-transparent">
             <UploadZone 
                onUploadComplete={() => router.push("/dashboard")} 
                customButton={true}
             />
           </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="shrink-0 border-t border-border bg-background p-4 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto flex justify-center sm:justify-between px-2">
          <span>© Decipher 2026 ® - Decipher your Document</span>
        </div>
      </footer>
    </div>
  );
}
