"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { apiSummaryStream } from "@/lib/api";
import { cn } from "@/lib/utils";
import { SUMMARY_TYPES } from "@/lib/constants";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function SummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeType, setActiveType] = useState("");
  const [content, setContent] = useState("");
  const [generating, setGenerating] = useState(false);
  const [customFocus, setCustomFocus] = useState("");

  const handleGenerate = async (type: string) => {
    setActiveType(type);
    setContent("");
    setGenerating(true);
    try {
      for await (const event of apiSummaryStream(id, type, customFocus)) {
        if (event.type === "token") {
          const chunks = event.content.match(/.{1,3}/gs) || [];
          for (const chunk of chunks) {
            await new Promise(r => setTimeout(r, 8)); // Typewriter delay
            setContent((p) => p + chunk);
          }
        }
        else if (event.type === "error") { setContent("❌ " + event.content); break; }
      }
    } catch {
      setContent("Failed to generate summary.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AppLayout>
      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        <Link href={`/document/${id}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Document
        </Link>

        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-8">
          <span className="gradient-text">Document Summary</span>
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">
          {/* Sidebar */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2.5">Type</p>
            {SUMMARY_TYPES.map((type) => (
              <button key={type.id} onClick={() => handleGenerate(type.id)} disabled={generating}
                className={cn("w-full text-left px-3.5 py-2.5 rounded-xl border text-sm transition-all",
                  activeType === type.id ? "border-primary/30 bg-primary/[0.06]"
                    : "border-border bg-card hover:border-primary/20")}>
                <span className="mr-2 text-lg">{type.icon}</span>
                <span className="font-medium text-sm">{type.label}</span>
                <span className="block text-xs text-muted-foreground mt-1 ml-7">{type.description}</span>
              </button>
            ))}
            <div className="pt-3">
              <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">Custom Focus</p>
              <input type="text" value={customFocus} onChange={(e) => setCustomFocus(e.target.value)}
                placeholder="e.g., results section…"
                className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground" />
            </div>
          </div>

          {/* Content */}
          <div className="p-5 rounded-2xl bg-card border border-border min-h-[400px]">
            {!content && !generating ? (
              <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                Select a summary type to generate
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:mb-3 prose-headings:mt-6 prose-p:mb-4 prose-p:leading-relaxed prose-li:my-1 prose-table:w-full prose-table:border-collapse prose-th:border prose-th:border-border prose-th:bg-muted/50 prose-th:p-2 prose-td:border prose-td:border-border prose-td:p-2">
                {generating && !content && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating summary…
                  </div>
                )}
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                {generating && content && <span className="inline-block w-1.5 h-4 bg-primary animate-pulse ml-0.5 rounded-sm" />}
              </div>
            )}
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
