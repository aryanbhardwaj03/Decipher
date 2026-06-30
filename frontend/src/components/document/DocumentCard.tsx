"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Trash2, Clock, FileText, Image, Table2 } from "lucide-react";
import { cn, formatFileSize, formatRelativeTime, getFileIcon } from "@/lib/utils";
import type { Document } from "@/types";

interface DocumentCardProps {
  document?: Document;
  doc?: Document; // Support both for backwards compatibility
  onDelete?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  index?: number;
}

export function DocumentCard({ document, doc, onDelete, onToggleFavorite, index = 0 }: DocumentCardProps) {
  // Use whichever prop was passed, or an empty object if neither (prevents crashes)
  const d = document || doc || ({} as Partial<Document>);
  
  const isProcessing = d.status === "processing";
  const isError = d.status === "error";

  const diffColors: Record<string, string> = {
    easy: "text-emerald-500 bg-emerald-500/10",
    medium: "text-amber-500 bg-amber-500/10",
    hard: "text-red-500 bg-red-500/10",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative"
    >
      <Link href={isProcessing || !d.id ? "#" : `/document/${d.id}`}>
        <div className={cn(
          "relative p-4 rounded-2xl border transition-all bg-card border-border card-hover",
          isProcessing && "animate-pulse-soft",
          isError && "border-red-500/20"
        )}>
          {/* Header */}
          <div className="flex items-start justify-between mb-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xl shrink-0">{getFileIcon(d.file_type || "pdf")}</span>
              <div className="min-w-0">
                <h3 className="text-xs font-semibold truncate max-w-[180px] tracking-tight">
                  {d.original_filename || d.title || "Untitled Document"}
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {formatFileSize(d.file_size || 0)} · {d.created_at ? formatRelativeTime(d.created_at) : "Just now"}
                </p>
              </div>
            </div>

            {isProcessing && (
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-500/10 text-amber-500 font-semibold shrink-0">Processing</span>
            )}
            {isError && (
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-red-500/10 text-red-500 font-semibold shrink-0">Error</span>
            )}
            {d.status === "ready" && d.estimated_difficulty && (
              <span 
                className={cn("px-2 py-0.5 text-[10px] rounded-full font-semibold capitalize shrink-0 cursor-help", diffColors[d.estimated_difficulty])}
                title={`Estimated reading difficulty based on AI analysis of document vocabulary and sentence complexity`}
              >
                {d.estimated_difficulty}
              </span>
            )}
          </div>

          {/* Stats */}
          {d.status === "ready" && (
            <div className="grid grid-cols-4 gap-1.5 pt-2.5 border-t border-border">
              <MiniStat icon={<FileText className="w-2.5 h-2.5" />} value={d.pages || 0} label="Pages" />
              <MiniStat icon={<Clock className="w-2.5 h-2.5" />} value={`${d.reading_time_minutes || 0}m`} label="Read" />
              <MiniStat icon={<Image className="w-2.5 h-2.5" />} value={d.image_count || 0} label="Images" />
              <MiniStat icon={<Table2 className="w-2.5 h-2.5" />} value={d.table_count || 0} label="Tables" />
            </div>
          )}

          {/* Processing skeleton */}
          {isProcessing && (
            <div className="space-y-1.5 pt-2.5 border-t border-border">
              <div className="skeleton h-2.5 w-3/4 rounded" />
              <div className="skeleton h-2.5 w-1/2 rounded" />
            </div>
          )}
        </div>
      </Link>

      {/* Hover actions */}
      <div className="absolute top-2.5 right-2.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {onToggleFavorite && d.id && (
          <button onClick={(e) => { e.preventDefault(); onToggleFavorite(d.id!); }}
            className="p-1 rounded-lg bg-card/90 backdrop-blur border border-border hover:bg-muted transition-colors">
            <Heart className={cn("w-3 h-3", d.is_favorite ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
          </button>
        )}
        {onDelete && d.id && (
          <button onClick={(e) => { e.preventDefault(); onDelete(d.id!); }}
            className="p-1 rounded-lg bg-card/90 backdrop-blur border border-border hover:bg-red-500/10 hover:border-red-500/20 transition-colors">
            <Trash2 className="w-3 h-3 text-muted-foreground" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

function MiniStat({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-0.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] font-bold text-foreground">{value}</span>
      </div>
      <span className="text-[8px] text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  );
}
