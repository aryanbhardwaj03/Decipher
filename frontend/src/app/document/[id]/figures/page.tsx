"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, ZoomIn, X } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { apiGetFigures, apiExplainFigure } from "@/lib/api";
import { showToast } from "@/components/ui/Toaster";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Figure { id: string; page: number; image_data: string; width: number; height: number; caption: string | null; ai_description: string | null; }

export default function FiguresPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [figures, setFigures] = useState<Figure[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFigure, setSelectedFigure] = useState<Figure | null>(null);
  const [explaining, setExplaining] = useState(false);

  useEffect(() => {
    if (id) {
      apiGetFigures(id).then((data) => setFigures(data.figures || []))
        .catch(() => {}).finally(() => setLoading(false));
    }
  }, [id]);

  const handleExplain = async (figure: Figure) => {
    if (figure.ai_description) return;
    setExplaining(true);
    try {
      const result = await apiExplainFigure(figure.id);
      setFigures((prev) => prev.map((f) => f.id === figure.id ? { ...f, ai_description: result.description } : f));
      setSelectedFigure((prev) => prev?.id === figure.id ? { ...prev, ai_description: result.description } : prev);
    } catch { showToast("Failed to explain figure", "error"); }
    finally { setExplaining(false); }
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
          <span className="gradient-text">Figures ({figures.length})</span>
        </motion.h1>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-36 rounded-2xl" />)}
          </div>
        ) : figures.length === 0 ? (
          <div className="text-center py-16 text-xs text-muted-foreground">No figures found in this document.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {figures.map((fig, i) => (
              <motion.div key={fig.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                onClick={() => { setSelectedFigure(fig); handleExplain(fig); }}
                className="group relative cursor-pointer rounded-xl overflow-hidden border border-border card-hover bg-card">
                {fig.image_data && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={`data:image/png;base64,${fig.image_data}`} alt={`Figure p.${fig.page}`}
                    className="w-full h-32 object-contain bg-white dark:bg-white/95" />
                )}
                <div className="p-2">
                  <span className="text-[10px] text-muted-foreground">Page {fig.page}</span>
                </div>
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                  <ZoomIn className="w-5 h-5 text-white" />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Lightbox */}
        {selectedFigure && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setSelectedFigure(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="max-w-3xl w-full bg-card rounded-2xl overflow-hidden border border-border" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center px-4 py-3 border-b border-border">
                <span className="text-xs font-semibold">Page {selectedFigure.page}</span>
                <button onClick={() => setSelectedFigure(null)} className="p-1 rounded-lg hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
              </div>
              {selectedFigure.image_data && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={`data:image/png;base64,${selectedFigure.image_data}`} alt="Figure" className="w-full max-h-[55vh] object-contain bg-white dark:bg-white/95" />
              )}
              <div className="p-4">
                {explaining && !selectedFigure.ai_description && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing figure…
                  </div>
                )}
                {selectedFigure.ai_description && (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:mb-2 prose-headings:mt-4 prose-p:mb-2 prose-p:leading-relaxed text-xs">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedFigure.ai_description}</ReactMarkdown>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </AppLayout>
  );
}
