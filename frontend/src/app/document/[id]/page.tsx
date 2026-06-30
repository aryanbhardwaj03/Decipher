"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MessageSquare, FileText, Brain, BookOpen, StickyNote,
  Image, Search, ArrowLeft, BarChart3, Clock, FileType,
  Sparkles,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DocumentViewer } from "@/components/document/DocumentViewer";
import { apiGetDocument } from "@/lib/api";
import { formatFileSize, getFileIcon } from "@/lib/utils";

interface DocumentData {
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
  created_at: string;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
};

export default function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [doc, setDoc] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    if (id) {
      apiGetDocument(id)
        .then(setDoc)
        .catch(() => router.push("/dashboard"))
        .finally(() => setLoading(false));
    }
  }, [id, router]);

  if (loading || !doc) {
    return (
      <AppLayout>
        <main className="max-w-5xl mx-auto px-4 py-8">
          <div className="skeleton h-6 w-32 rounded-lg mb-8" />
          <div className="skeleton h-36 rounded-2xl mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(7)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
          </div>
        </main>
      </AppLayout>
    );
  }

  const features = [
    {
      icon: <MessageSquare className="w-5 h-5" />,
      label: "Chat & Q/A",
      description: "Ask anything about this document",
      href: `/document/${id}/chat`,
      gradient: "from-violet-500/15 to-violet-500/5 text-violet-500 dark:text-violet-400",
    },
    {
      icon: <FileText className="w-5 h-5" />,
      label: "Summaries",
      description: "Generate 7 types of AI summaries",
      href: `/document/${id}/summary`,
      gradient: "from-blue-500/15 to-blue-500/5 text-blue-500 dark:text-blue-400",
    },
    {
      icon: <Brain className="w-5 h-5" />,
      label: "Quiz",
      description: "Test understanding with smart quizzes",
      href: `/document/${id}/quiz`,
      gradient: "from-emerald-500/15 to-emerald-500/5 text-emerald-500 dark:text-emerald-400",
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      label: "Flashcards",
      description: "Study with AI-generated flip cards",
      href: `/document/${id}/flashcards`,
      gradient: "from-amber-500/15 to-amber-500/5 text-amber-500 dark:text-amber-400",
    },
    {
      icon: <StickyNote className="w-5 h-5" />,
      label: "Notes",
      description: "Smart notes, formulas & key concepts",
      href: `/document/${id}/notes`,
      gradient: "from-pink-500/15 to-pink-500/5 text-pink-500 dark:text-pink-400",
    },
    {
      icon: <Image className="w-5 h-5" />,
      label: "Figures",
      description: "Extracted images with AI explanation",
      href: `/document/${id}/figures`,
      gradient: "from-orange-500/15 to-orange-500/5 text-orange-500 dark:text-orange-400",
    },
    {
      icon: <Search className="w-5 h-5" />,
      label: "Search",
      description: "Semantic & keyword search",
      href: `/document/${id}/search`,
      gradient: "from-teal-500/15 to-teal-500/5 text-teal-500 dark:text-teal-400",
    },
  ];

  const diffColors: Record<string, string> = {
    easy: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400",
    medium: "bg-amber-500/10 text-amber-500 dark:text-amber-400",
    hard: "bg-red-500/10 text-red-500 dark:text-red-400",
  };

  return (
    <AppLayout>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <Link href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
        </Link>

        {/* Document header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-card border border-border mb-8 relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5 flex-1 min-w-0">
              <span className="text-3xl">{getFileIcon(doc.file_type)}</span>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold tracking-tight truncate mb-0.5 pr-2">{doc.original_filename}</h1>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span>{formatFileSize(doc.file_size)}</span>
                  <span>·</span>
                  <span>Uploaded {new Date(doc.created_at).toLocaleDateString()}</span>
                  {doc.estimated_difficulty && (
                    <>
                      <span>·</span>
                      <span className={`px-2 py-0.5 text-[10px] rounded-full font-semibold capitalize ${diffColors[doc.estimated_difficulty] || ""}`}>
                        {doc.estimated_difficulty}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setViewerOpen(true)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" /> 
              View Original
            </button>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-4 border-t border-border">
            <StatItem icon={<FileType className="w-3.5 h-3.5" />} label="Pages" value={doc.pages} />
            <StatItem icon={<BarChart3 className="w-3.5 h-3.5" />} label="Words" value={doc.word_count.toLocaleString()} />
            <StatItem icon={<Clock className="w-3.5 h-3.5" />} label="Read" value={`${doc.reading_time_minutes} min`} />
            <StatItem icon={<Image className="w-3.5 h-3.5" />} label="Figures" value={doc.image_count} />
          </div>
        </motion.div>

        {/* Feature Grid */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <h2 className="text-sm font-semibold mb-3.5 flex items-center gap-1.5 text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> AI Features
          </h2>

          <motion.div variants={container} initial="hidden" animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {features.map((f) => (
              <motion.div key={f.label} variants={item}>
                <Link href={f.href}
                  className="block p-4 rounded-2xl bg-card border border-border card-hover group">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    {f.icon}
                  </div>
                  <h3 className="text-sm font-semibold tracking-tight mb-0.5">{f.label}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </main>

      {/* Document Viewer Modal */}
      {doc && viewerOpen && (
        <DocumentViewer
          docId={id}
          fileType={doc.file_type}
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </AppLayout>
  );
}

function StatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="text-base font-bold tracking-tight">{value}</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}
