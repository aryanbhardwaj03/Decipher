"use client";

import { use, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Search as SearchIcon, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { apiSearchDocument } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SearchResult { text: string; page: number; score: number; type: string; }

export default function SearchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("semantic");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true); setSearched(true);
    try {
      const data = await apiSearchDocument(id, query, mode);
      setResults(data.results || []);
    } catch { setResults([]); } finally { setLoading(false); }
  };

  return (
    <AppLayout>
      <main className="max-w-3xl mx-auto px-4 py-8">
        <Link href={`/document/${id}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Document
        </Link>

        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="text-xl font-bold tracking-tight mb-6">🔍 Document Search</motion.h1>

        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()} placeholder="Search your document…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground" />
          </div>
          <button onClick={handleSearch} disabled={loading || !query.trim()}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40 shadow-lg shadow-primary/15"
            style={{ background: "var(--gradient-brand)" }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
          </button>
        </div>

        <div className="flex gap-1.5 mb-5">
          {["semantic", "keyword", "hybrid"].map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={cn("px-3 py-1 rounded-lg text-[10px] font-semibold capitalize transition-all",
                mode === m ? "text-white shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80")}
              style={mode === m ? { background: "var(--gradient-brand)" } : undefined}>
              {m}
            </button>
          ))}
        </div>

        <div className="space-y-2.5">
          {loading && (
            <div className="flex items-center gap-2 py-12 justify-center text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Searching…
            </div>
          )}
          {!loading && searched && results.length === 0 && (
            <div className="text-center py-12 text-xs text-muted-foreground">No results found. Try a different query or mode.</div>
          )}
          {results.map((r, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="p-3.5 rounded-xl bg-card border border-border card-hover">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-primary/[0.08] text-primary">p.{r.page}</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-muted text-muted-foreground capitalize">{r.type}</span>
                <span className="text-[9px] text-muted-foreground ml-auto">{Math.round(r.score * 100)}%</span>
              </div>
              <p className="text-xs text-foreground leading-relaxed line-clamp-3">{r.text}</p>
            </motion.div>
          ))}
        </div>
      </main>
    </AppLayout>
  );
}
