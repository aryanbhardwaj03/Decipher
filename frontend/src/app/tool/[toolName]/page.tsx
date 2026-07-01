"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { apiGetDocuments, apiDeleteDocument, apiToggleFavorite } from "@/lib/api";
import { DocumentCard } from "@/components/document/DocumentCard";
import { showToast } from "@/components/ui/Toaster";
import { ArrowLeft, MessageSquare, FileText, StickyNote, Layers, CheckSquare, Image as ImageIcon, Search } from "lucide-react";
import Link from "next/link";

interface Document {
  id: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  status: string;
  pages: number;
  word_count: number;
  image_count: number;
  table_count: number;
  reading_time_minutes: number;
  estimated_difficulty: string | null;
  is_favorite: boolean;
  created_at: string;
}

const TOOL_CONFIG: Record<string, { title: string; desc: string; icon: any; color: string; bg: string }> = {
  "chat": { title: "AI Chat", desc: "Select a document to chat with AI", icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-500/10" },
  "summary": { title: "AI Summarizer", desc: "Select a document to generate summaries", icon: FileText, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  "notes": { title: "Smart Notes", desc: "Select a document to extract study notes", icon: StickyNote, color: "text-amber-500", bg: "bg-amber-500/10" },
  "flashcards": { title: "Flashcards", desc: "Select a document to create flashcards", icon: Layers, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  "quiz": { title: "Generate Quiz", desc: "Select a document to build a quiz", icon: CheckSquare, color: "text-orange-500", bg: "bg-orange-500/10" },
  "figures": { title: "Extract Figures", desc: "Select a document to view extracted figures", icon: ImageIcon, color: "text-pink-500", bg: "bg-pink-500/10" },
  "search": { title: "Deep Search", desc: "Select a document to search across its contents", icon: Search, color: "text-purple-500", bg: "bg-purple-500/10" },
};

export default function ToolSelectorPage() {
  const params = useParams();
  const router = useRouter();
  const toolName = (params?.toolName as string) || "chat";
  
  const config = TOOL_CONFIG[toolName] || TOOL_CONFIG["chat"];
  const ToolIcon = config.icon;

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    const previousDocs = documents;
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    try {
      await apiDeleteDocument(id);
      showToast("Document deleted", "success");
    } catch {
      setDocuments(previousDocs);
      showToast("Failed to delete", "error");
    }
  };

  const handleToggleFavorite = async (id: string) => {
    const previousDocs = documents;
    setDocuments((prev) => prev.map((d) => 
      d.id === id ? { ...d, is_favorite: !d.is_favorite } : d
    ));
    try {
      await apiToggleFavorite(id);
    } catch {
      setDocuments(previousDocs);
      showToast("Failed to update favorite status", "error");
    }
  };

  useEffect(() => {
    if (documents.some((d) => d.status === "processing")) {
      const interval = setInterval(fetchDocuments, 3000);
      return () => clearInterval(interval);
    }
  }, [documents, fetchDocuments]);

  return (
    <AppLayout>
      <main className="max-w-6xl mx-auto px-6 py-10">
        <Link href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${config.bg} ${config.color}`}>
            <ToolIcon className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{config.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{config.desc}</p>
          </div>
        </div>

        {/* Document Grid */}
        <div>
          <h2 className="text-lg font-semibold mb-6">Your Library</h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[200px] rounded-2xl bg-card border border-border animate-pulse" />
              ))}
            </div>
          ) : documents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {documents.map((doc, i) => (
                <div key={doc.id} className="hover:ring-2 hover:ring-primary/40 transition-all rounded-2xl">
                  <DocumentCard 
                    doc={doc} 
                    index={i}
                    href={`/document/${doc.id}/${toolName}`}
                    onDelete={handleDelete}
                    onToggleFavorite={handleToggleFavorite}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 px-4 rounded-2xl border border-border bg-card/50">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold mb-2">No documents yet</h3>
              <p className="text-sm text-muted-foreground max-w-[300px] mx-auto mb-6">
                Upload your first document to start using {config.title}.
              </p>
              <Link href="/dashboard" className="px-5 py-2.5 rounded-xl bg-primary text-white font-medium text-sm hover:opacity-90 transition-opacity">
                Upload Document
              </Link>
            </div>
          )}
        </div>
      </main>
    </AppLayout>
  );
}
