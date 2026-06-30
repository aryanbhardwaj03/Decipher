"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, FileText, Database, Share2, Sparkles, X, ChevronRight, CheckSquare, MessageSquare, Image, HelpCircle, FolderOpen, Check } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { AppLayout } from "@/components/layout/AppLayout";
import { UploadZone } from "@/components/document/UploadZone";
import { DocumentCard } from "@/components/document/DocumentCard";
import { apiGetDocuments, apiDeleteDocument, apiToggleFavorite, apiGetXpHistory } from "@/lib/api";
import { showToast } from "@/components/ui/Toaster";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

import type { Document, XPHistoryResponse } from "@/types";

export default function DashboardPage() {
  const { user, loading: authLoading, isGuest } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [xpData, setXpData] = useState<XPHistoryResponse | null>(null);

  const hasXpPlus = !isGuest && (xpData?.weekly_xp || 0) >= 100;
  const isUnlimited = user?.plan === "Plus" || user?.plan === "Pro" || hasXpPlus;
  const maxDocs = isGuest ? 10 : (isUnlimited ? Infinity : 30);
  const isOverLimit = !isUnlimited && documents.length >= maxDocs;


  const handleUploadClick = () => {
    if (isOverLimit) {
      showToast("Storage limit reached. Please upgrade to Plus or Pro.", "error");
      return;
    }
    setShowUpload(true);
  };

  const fetchDocuments = useCallback(async () => {
    try {
      const data = await apiGetDocuments();
      setDocuments(data.documents);
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchXpHistory = useCallback(async () => {
    try {
      const data = await apiGetXpHistory();
      setXpData(data);
    } catch {
      setXpData(null);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      fetchDocuments();
      if (!isGuest) {
        fetchXpHistory();
      } else {
        setXpData(null);
      }
    }
  }, [authLoading, isGuest, fetchDocuments, fetchXpHistory]);

  useEffect(() => {
    if (documents.some((d) => d.status === "processing")) {
      const interval = setInterval(fetchDocuments, 3000);
      return () => clearInterval(interval);
    }
  }, [documents, fetchDocuments]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    try {
      await apiDeleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      showToast("Document deleted", "success");
    } catch {
      showToast("Failed to delete", "error");
    }
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      const result = await apiToggleFavorite(id);
      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, is_favorite: result.is_favorite } : d))
      );
    } catch {
      showToast("Failed to update", "error");
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-7 h-7 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const features = [
    { name: "AI Summarizer", desc: "Get concise summaries", icon: FileText, color: "text-emerald-500", bg: "bg-emerald-500/10", href: "/tool/summary" },
    { name: "Ask Questions", desc: "Get instant answers", icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-500/10", href: "/tool/chat" },
    { name: "Generate Quiz", desc: "Auto-generate quizzes", icon: CheckSquare, color: "text-orange-500", bg: "bg-orange-500/10", href: "/tool/quiz" },
    { name: "Extract Data", desc: "Extract tables & figures", icon: Database, color: "text-purple-500", bg: "bg-purple-500/10", href: "/tool/figures" },
    { name: "Mind Maps", desc: "Visualize with mind maps", icon: Share2, color: "text-pink-500", bg: "bg-pink-500/10", href: "/tool/notes" },
    { name: "Flashcards", desc: "Create flashcards instantly", icon: Sparkles, color: "text-indigo-500", bg: "bg-indigo-500/10", href: "/tool/flashcards" },
  ];

  return (
    <AppLayout onUploadClick={handleUploadClick}>
      {/* Upload Modal overlay */}
      <AnimatePresence>
        {showUpload && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl w-full max-w-2xl p-6 relative shadow-2xl"
            >
              <button onClick={() => setShowUpload(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold mb-6">Upload a new document</h2>
              <UploadZone onUploadComplete={() => { fetchDocuments(); setShowUpload(false); }} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-8 py-10">
        
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2 flex items-center gap-3">
            {getGreeting()}, {user?.name || "User"}! 👋
            {!isGuest && (user?.plan === 'Plus' || user?.plan === 'Pro' || hasXpPlus) && (
              <span className="text-[12px] px-2.5 py-1 rounded-md font-bold tracking-wide uppercase bg-orange-500/10 text-orange-500 border border-orange-500/20">
                {user?.plan === 'Pro' ? 'Pro Subscriber' : (hasXpPlus && user?.plan !== 'Plus' ? 'Plus (XP Unlocked)' : 'Plus Subscriber')}
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            Let AI uncover the knowledge hidden in your documents.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          
          {/* Main Left Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Upload Box */}
            <div className="bg-card border border-border rounded-3xl p-8 relative overflow-hidden flex flex-col sm:flex-row gap-8 shadow-sm">
              <div className="flex-1 relative z-10">
                <h2 className="text-2xl font-bold mb-3 text-foreground">Upload any document</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-sm">
                  PDF, PPTX, DOCX and more. Let AI summarize, answer questions, generate quizzes and extract key insights.
                </p>
                <button 
                  onClick={handleUploadClick}
                  className="px-6 py-3 rounded-xl text-sm font-semibold text-background bg-foreground hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 text-primary" /> Choose Files
                </button>
                <p className="text-xs text-muted-foreground mt-4 opacity-70">or drag & drop files here</p>
                
                <div className="mt-8 pt-4 border-t border-border/50 flex items-center gap-2 text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                  Supported formats: PDF, PPTX, DOCX, TXT <HelpCircle className="w-3.5 h-3.5" />
                </div>
              </div>
              
              {/* Graphic representation matching screenshot */}
              <div className="hidden sm:flex flex-1 items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent rounded-full blur-3xl" />
                <div className="relative w-48 h-48">
                  {/* Faux icons representing documents floating */}
                  <div className="absolute top-4 left-4 w-12 h-12 bg-red-500 rounded-lg shadow-lg flex items-center justify-center transform -rotate-12 animate-pulse">
                    <span className="text-white text-xs font-bold">PDF</span>
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-blue-500 rounded-xl shadow-xl flex items-center justify-center z-10">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute bottom-6 right-6 w-12 h-12 bg-orange-500 rounded-lg shadow-lg flex items-center justify-center transform rotate-12">
                    <span className="text-white text-xs font-bold">PPT</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Explore AI Features */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-foreground">Explore AI Features</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {features.map((f, i) => (
                  <Link href={f.href} key={i} className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-colors group cursor-pointer shadow-sm block">
                    <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <f.icon className={`w-5 h-5 ${f.color}`} />
                    </div>
                    <h4 className="text-sm font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{f.name}</h4>
                    <p className="text-[11px] text-muted-foreground leading-tight pr-4">{f.desc}</p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Documents */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-foreground">Recent Documents</h3>
                <Link href="/library" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                  ))}
                </div>
              ) : documents.length === 0 ? (
                <EmptyState 
                  icon={<FolderOpen className="w-8 h-8" />}
                  title="No documents yet"
                  description="Upload your first document to unlock AI-powered insights, summaries, and quizzes."
                  action={
                    <Button onClick={() => setShowUpload(true)} variant="default">
                      Upload Document
                    </Button>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {documents.slice(0, 4).map((doc, i) => (
                    <DocumentCard
                      key={doc.id}
                      document={doc}
                      index={i}
                      onDelete={handleDelete}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Sidebar Columns */}
          <div className="space-y-8">
            
            {/* Recent Activity */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[15px] font-bold text-foreground">Recent Activity</h3>
                <Link href="/library" className="text-xs text-primary font-medium hover:underline">View all</Link>
              </div>
              <div className="space-y-5">
                {documents.slice(0,4).map((doc, i) => (
                  <Link href={`/document/${doc.id}`} key={doc.id} className="flex items-start gap-3 group cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-foreground truncate group-hover:text-primary transition-colors">{doc.original_filename}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Uploaded just now</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{i + 1}h ago</span>
                  </Link>
                ))}
                {documents.length === 0 && (
                   <p className="text-xs text-muted-foreground">No recent activity.</p>
                )}
              </div>
            </div>

            {/* Your Progress */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
               <h3 className="text-[15px] font-bold text-foreground mb-4">Your Progress</h3>
               <div className="flex items-end gap-2 mb-2">
                 <span className="text-3xl font-extrabold text-foreground">{documents.length}</span>
                 {!isUnlimited && <span className="text-sm text-muted-foreground font-medium mb-1">/ {maxDocs}</span>}
               </div>
               <p className="text-[11px] text-muted-foreground mb-4">Documents processed this week</p>
               
               {isUnlimited ? (
                 <div className="h-1.5 w-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full mb-2" />
               ) : (
                 <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mb-2">
                   <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min((documents.length / maxDocs) * 100, 100)}%` }} />
                 </div>
               )}
               
               <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
                 {isUnlimited ? (
                   <span className="text-orange-500">Unlimited Storage Unlocked</span>
                 ) : (
                   <span className={documents.length > maxDocs ? "text-red-500" : ""}>
                     {Math.min(Math.round((documents.length / maxDocs) * 100), 100)}% 
                     {documents.length > maxDocs && " (Over Limit)"}
                   </span>
                 )}
               </div>
            </div>

            {/* XP & Rewards */}
            {!isGuest && (
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                <h3 className="text-[15px] font-bold text-foreground mb-4">XP & Rewards</h3>
                
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <span className="text-2xl font-extrabold text-foreground">{xpData?.weekly_xp || 0}</span>
                        <span className="text-xs text-muted-foreground ml-1">/ 100 XP</span>
                      </div>
                      <span className="text-xs font-semibold text-primary">This Week</span>
                    </div>
                    
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(((xpData?.weekly_xp || 0) / 100) * 100, 100)}%` }} />
                    </div>
                    
                    <p className="text-[10px] text-muted-foreground">
                      {(xpData?.weekly_xp || 0) >= 100 
                        ? "🎉 Plus unlocked for this week!" 
                        : `Earn ${Math.max(0, 100 - (xpData?.weekly_xp || 0))} more XP for free Plus.`}
                    </p>
                    
                    {(xpData?.weekly_xp || 0) >= 100 && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-orange-500" />
                          <span className="text-xs text-foreground font-medium">Unlimited document uploads</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-orange-500" />
                          <span className="text-xs text-foreground font-medium">Unlimited cloud storage</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-orange-500" />
                          <span className="text-xs text-foreground font-medium">Basic AI summaries</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-orange-500" />
                          <span className="text-xs text-foreground font-medium">Limited AI Chat</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {xpData?.history && xpData.history.length > 0 && (
                    <div className="mt-2 border-t border-border/50 pt-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-xs font-semibold text-muted-foreground">Recent XP</h4>
                        <span className="text-xs font-bold text-foreground">Total: {xpData.total_xp}</span>
                      </div>
                      <div className="space-y-3">
                        {xpData.history.slice(0, 3).map((tx) => (
                          <div key={tx.id} className="flex justify-between items-center">
                            <div className="flex flex-col">
                              <span className="text-[12px] font-medium">{tx.reason}</span>
                              <span className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</span>
                            </div>
                            <span className="text-[12px] font-bold text-orange-500">+{tx.amount} XP</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </AppLayout>
  );
}
