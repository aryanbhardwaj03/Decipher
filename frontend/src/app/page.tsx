"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Grid, UploadCloud } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UploadZone } from "@/components/document/UploadZone";

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <header className="flex h-[72px] items-center justify-between bg-background px-6 shadow-sm border-b border-border">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo-mark.png" alt="Decipher Logo" className="h-8 w-8 object-contain" />
            <span className="text-[22px] font-bold tracking-tight">Decipher</span>
          </Link>
          
          <nav className="hidden lg:flex items-center gap-6 text-[13px] font-bold uppercase tracking-wide text-foreground">
            <Link href="/tool/summary" className="hover:text-primary transition-colors">AI Summarizer</Link>
            <Link href="/tool/flashcards" className="hover:text-primary transition-colors">Flashcards</Link>
            <Link href="/tool/quiz" className="hover:text-primary transition-colors">Quizzes</Link>
            <Link href="/tool/chat" className="hover:text-primary transition-colors">Chat Document</Link>
            <Link href="/dashboard" className="flex items-center gap-1 hover:text-primary transition-colors">
              All Tools <span className="text-[10px]">▼</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/login" className="text-sm font-semibold hover:text-primary transition-colors">Login</Link>
          <Link href="/login?mode=signup" className="rounded-md bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90">
            Sign up
          </Link>
          <button className="ml-2 rounded hover:bg-muted p-1">
            <Grid className="h-6 w-6 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center px-4 pt-[100px] pb-[120px]">
        <h1 className="text-center text-[44px] font-bold tracking-tight sm:text-[56px] text-foreground">
          AI Summarizer
        </h1>
        
        <p className="mt-4 max-w-[600px] text-center text-[22px] text-muted-foreground font-light">
          Summarize PDF reports, essays, and study guides with AI
        </p>

        <div className="mt-12 w-full max-w-[800px]">
           <div className="bg-transparent">
             <UploadZone 
                onUploadComplete={() => router.push("/dashboard")} 
                customButton={true}
             />
           </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="fixed bottom-0 w-full border-t border-border bg-background p-4 text-xs text-muted-foreground">
        <div className="flex justify-between px-2">
          <span>© Decipher 2026 ® - Decipher your Document</span>
        </div>
      </footer>
    </div>
  );
}
