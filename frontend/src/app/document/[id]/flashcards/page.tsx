"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, RotateCcw, Shuffle, ChevronLeft, ChevronRight } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { apiGenerateFlashcards, apiGetFlashcards } from "@/lib/api";
import { showToast } from "@/components/ui/Toaster";
import { cn } from "@/lib/utils";

interface Card { front: string; back: string; difficulty: string; }

export default function FlashcardsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [cards, setCards] = useState<Card[]>([]);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (id) {
      apiGetFlashcards(id).then((data) => { if (data.cards?.length > 0) setCards(data.cards); })
        .catch(() => {}).finally(() => setLoading(false));
    }
  }, [id]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const data = await apiGenerateFlashcards(id, 15);
      setCards(data.cards); setCurrent(0); setFlipped(false);
      showToast(`${data.cards.length} flashcards created!`, "success");
    } catch (err: any) {
      showToast(err.message || "Failed to generate", "error");
    } finally { setGenerating(false); }
  };

  const handleShuffle = () => { setCards([...cards].sort(() => Math.random() - 0.5)); setCurrent(0); setFlipped(false); };
  const handleNav = (dir: "prev" | "next") => {
    setFlipped(false);
    setTimeout(() => { setCurrent((p) => dir === "next" ? Math.min(p + 1, cards.length - 1) : Math.max(p - 1, 0)); }, 150);
  };

  const diffColors: Record<string, string> = {
    easy: "bg-emerald-500/10 text-emerald-500", medium: "bg-amber-500/10 text-amber-500", hard: "bg-red-500/10 text-red-500",
  };
  const card = cards[current];

  return (
    <AppLayout>
      <main className="max-w-xl mx-auto px-4 py-8">
        <Link href={`/document/${id}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Document
        </Link>

        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="text-xl font-bold tracking-tight mb-6">📚 Flashcards</motion.h1>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : cards.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-muted-foreground mb-5">No flashcards yet. Generate some from your document!</p>
            <button onClick={handleGenerate} disabled={generating}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-2 mx-auto shadow-lg shadow-primary/15"
              style={{ background: "var(--gradient-brand)" }}>
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : "Generate Flashcards"}
            </button>
          </div>
        ) : (
          <>
            {/* Controls */}
            <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
              <span>{current + 1} of {cards.length}</span>
              <div className="flex gap-1.5">
                <button onClick={handleShuffle} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Shuffle"><Shuffle className="w-3.5 h-3.5" /></button>
                <button onClick={handleGenerate} disabled={generating} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Regenerate"><RotateCcw className={cn("w-3.5 h-3.5", generating && "animate-spin")} /></button>
              </div>
            </div>

            {/* Progress */}
            <div className="h-1 bg-muted rounded-full overflow-hidden mb-5">
              <motion.div className="h-full rounded-full" style={{ background: "var(--gradient-brand)" }}
                animate={{ width: `${((current + 1) / cards.length) * 100}%` }} transition={{ duration: 0.3 }} />
            </div>

            {/* Card */}
            <div className="mb-5" style={{ perspective: "1000px" }}>
              <motion.div onClick={() => setFlipped(!flipped)}
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
                className="relative w-full h-64 cursor-pointer" style={{ transformStyle: "preserve-3d" }}>
                {/* Front */}
                <div className="absolute inset-0 rounded-2xl bg-card border border-border p-6 flex flex-col items-center justify-center text-center"
                  style={{ backfaceVisibility: "hidden" }}>
                  {card?.difficulty && (
                    <span className={cn("absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize", diffColors[card.difficulty] || diffColors.medium)}>
                      {card.difficulty}
                    </span>
                  )}
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">Question</p>
                  <p className="text-sm font-semibold leading-relaxed">{card?.front}</p>
                  <p className="text-[10px] text-muted-foreground mt-4">Click to flip</p>
                </div>
                {/* Back */}
                <div className="absolute inset-0 rounded-2xl bg-primary/[0.04] border border-primary/15 p-6 flex flex-col items-center justify-center text-center"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                  <p className="text-[10px] text-primary uppercase tracking-widest mb-3">Answer</p>
                  <p className="text-sm font-semibold leading-relaxed">{card?.back}</p>
                </div>
              </motion.div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => handleNav("prev")} disabled={current === 0}
                className="p-2.5 rounded-xl border border-border hover:bg-muted disabled:opacity-25 transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex gap-0.5">
                {cards.map((_, i) => (
                  <div key={i} className={cn("h-1.5 rounded-full transition-all",
                    i === current ? "w-5 bg-primary" : "w-1.5 bg-muted")} />
                ))}
              </div>
              <button onClick={() => handleNav("next")} disabled={current === cards.length - 1}
                className="p-2.5 rounded-xl border border-border hover:bg-muted disabled:opacity-25 transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </main>
    </AppLayout>
  );
}
