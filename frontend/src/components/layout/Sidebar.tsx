"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { 
  Home, BookOpen, MessageSquare, FileText, CheckSquare, 
  Layers, Settings, Plus, Sparkles, Sun, Moon, Image as ImageIcon, Search, StickyNote, PanelLeftClose
} from "lucide-react";
import { cn } from "@/lib/utils";

import { showToast } from "@/components/ui/Toaster";
import { useAuth } from "@/components/providers/AuthProvider";

const navItems = [
  { name: "Home", href: "/dashboard", icon: Home, global: true },
  { name: "My Library", href: "/library", icon: BookOpen, global: true },
  { name: "AI Chat", href: "/chat", icon: MessageSquare },
  { name: "Summaries", href: "/summary", icon: FileText },
  { name: "Notes", href: "/notes", icon: StickyNote },
  { name: "Flashcards", href: "/flashcards", icon: Layers },
  { name: "Quizzes", href: "/quiz", icon: CheckSquare },
  { name: "Figures", href: "/figures", icon: ImageIcon },
  { name: "Search", href: "/search", icon: Search },
  { name: "Settings", href: "/settings", icon: Settings, global: true },
];

export function Sidebar({ onUploadClick, onClose }: { onUploadClick?: () => void, onClose?: () => void }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const params = useParams();
  const id = params?.id as string | undefined;

  return (
    <aside className="w-[260px] h-full border-r border-border bg-card flex flex-col z-50">
      {/* Brand */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/logo-mark.png" alt="Decipher Logo" className="w-6 h-6 object-contain" />
            <div>
              <h1 className="font-bold text-[15px] leading-tight">Decipher</h1>
              <p className="text-[10px] text-muted-foreground tracking-tight">Decipher your Document</p>
            </div>
          </Link>
          {onClose && (
            <button onClick={onClose} className="p-2 -mr-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors hidden md:block" title="Close sidebar">
              <PanelLeftClose className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* Upload Button */}
        <button 
          onClick={onUploadClick}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm bg-foreground text-background shadow-sm hover:opacity-90 transition-all duration-200 active:scale-[0.97]"
        >
          <Plus className="w-4 h-4 text-primary" />
          New Upload
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 scrollbar-hide">
        {navItems.map((item) => {
          const href = item.global ? item.href : (id ? `/document/${id}${item.href}` : `/tool${item.href}`);
          const isActive = pathname === href || (id && !item.global && pathname.includes(item.href));
          
          return (
            <Link
              key={item.name}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 active:scale-[0.98]",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* Footer Area */}
      <div className="p-4 mt-auto">
        {/* Upgrade Card */}
        {user?.plan !== "Pro" && (
          <Link href="/pricing" className="block p-4 rounded-2xl bg-card border border-border mb-4 hover:border-orange-500/50 transition-colors shadow-sm">
            <h4 className="text-[14px] font-semibold flex items-center gap-2 text-foreground">
              <Sparkles className="w-4 h-4 text-orange-500" />
              Upgrade to <span className="text-orange-500">Pro</span>
            </h4>
            <p className="text-[12px] text-muted-foreground mt-2 mb-4 leading-relaxed">
              Unlock unlimited uploads, advanced AI models and more.
            </p>
            <span className="text-[13px] font-semibold text-orange-500 flex items-center gap-1 hover:underline">
              <span className="border-b border-orange-500">Upgrade Now</span> <span aria-hidden="true">&rarr;</span>
            </span>
          </Link>
        )}

      </div>
    </aside>
  );
}
