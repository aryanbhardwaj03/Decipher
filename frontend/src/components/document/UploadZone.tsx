"use client";

import { useCallback, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { cn, formatFileSize, getFileIcon } from "@/lib/utils";
import { SUPPORTED_EXTENSIONS } from "@/lib/constants";
import { apiUploadDocument } from "@/lib/api";
import { showToast } from "@/components/ui/Toaster";

interface UploadZoneProps {
  onUploadComplete?: () => void;
  customButton?: boolean;
}

interface UploadingFile {
  file: File;
  status: "uploading" | "done" | "error";
  error?: string;
}

export function UploadZone({ onUploadComplete, customButton }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  }, []);

  const handleFiles = async (files: File[]) => {
    const validFiles = files.filter((f) => {
      const ext = "." + f.name.split(".").pop()?.toLowerCase();
      return SUPPORTED_EXTENSIONS.includes(ext);
    });

    if (validFiles.length === 0) {
      showToast("Unsupported file type. Use PDF, DOC, DOCX, PPT, PPTX, TXT, or MD.", "error");
      return;
    }

    const newUploading: UploadingFile[] = validFiles.map((f) => ({ file: f, status: "uploading" as const }));
    setUploading((prev) => [...prev, ...newUploading]);

    for (const item of newUploading) {
      try {
        await apiUploadDocument(item.file);
        setUploading((prev) => prev.map((u) => u.file === item.file ? { ...u, status: "done" as const } : u));
        showToast(`${item.file.name} uploaded!`, "success");
      } catch (err: any) {
        setUploading((prev) => prev.map((u) => u.file === item.file ? { ...u, status: "error" as const, error: err.message } : u));
        showToast(`Failed to upload ${item.file.name}`, "error");
      }
    }

    // Check if any uploads succeeded
    const anySuccess = newUploading.some((u) => !u.error);
    
    if (anySuccess) {
      if (customButton) {
        setIsAnalyzing(true);
      }
      setTimeout(() => {
        setUploading((prev) => prev.filter((u) => u.status === "uploading"));
        onUploadComplete?.();
      }, customButton ? 2500 : 1500);
    } else {
      setTimeout(() => {
        setUploading((prev) => prev.filter((u) => u.status === "uploading"));
      }, 1500);
    }
  };

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-12 animate-in fade-in zoom-in duration-500">
        <div className="relative">
          <motion.div 
            animate={{ y: [0, -10, 0] }} 
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="w-24 h-32 bg-card border-[3px] border-primary rounded-lg shadow-xl flex flex-col items-center justify-center relative overflow-hidden"
          >
            {/* Glasses icon for "smart" PDF */}
            <div className="absolute top-4 w-12 h-4 bg-gray-200 rounded-sm"></div>
            <div className="absolute top-10 w-16 flex justify-between">
              <div className="w-6 h-6 border-[3px] border-black rounded flex items-center justify-center"><div className="w-2 h-2 bg-black rounded-full animate-pulse"></div></div>
              <div className="w-2 h-1 bg-black mt-2"></div>
              <div className="w-6 h-6 border-[3px] border-black rounded flex items-center justify-center"><div className="w-2 h-2 bg-black rounded-full animate-pulse"></div></div>
            </div>
            <div className="absolute bottom-4 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">PDF</div>
          </motion.div>
          {/* Scanning line */}
          <motion.div 
            animate={{ top: ["0%", "100%", "0%"] }} 
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="absolute left-[-10px] right-[-10px] h-[3px] bg-blue-500 shadow-[0_0_8px_2px_rgba(59,130,246,0.5)] z-10 rounded-full"
          ></motion.div>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <p className="text-gray-400 text-sm">{uploading.find(u => u.status === 'done')?.file.name || 'document.pdf'}</p>
          <h3 className="text-foreground text-2xl font-bold tracking-tight">Analyzing with AI...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <motion.div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        animate={isDragging ? { scale: 1.01 } : { scale: 1 }}
        className={cn(
          "relative transition-all cursor-pointer group flex flex-col items-center justify-center overflow-hidden",
          customButton ? "border-none p-0" : "border-2 border-dashed rounded-3xl p-10 text-center min-h-[280px]",
          isDragging && !customButton ? "border-primary bg-primary/[0.05] scale-[1.02]" : "",
          !isDragging && !customButton ? "border-border/60 hover:border-primary/50 hover:bg-primary/[0.02] hover:shadow-sm" : ""
        )}
      >
        <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md" onChange={handleFileSelect}
          className="hidden" />

        {/* Subtle background glow effect for the drop zone */}
        {!customButton && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        )}

        {customButton ? (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <button className="bg-primary hover:opacity-90 text-primary-foreground text-[24px] font-semibold px-[42px] py-[22px] rounded-lg shadow-md transition-opacity flex items-center justify-center min-w-[280px]">
                Select files
              </button>
            </div>
            <p className="text-muted-foreground text-[15px] font-light">
              or drop files here
            </p>
          </div>
        ) : (
          <motion.div animate={isDragging ? { y: -5 } : { y: 0 }} className="space-y-6 relative z-10 flex flex-col items-center">
            {/* Cute Robot File Icon */}
            <motion.div 
              whileHover={{ y: -5, rotate: [-1, 1, -1, 0] }}
              transition={{ duration: 0.5 }}
              className="w-20 h-28 bg-card border-[3px] border-primary/20 group-hover:border-primary/50 rounded-xl shadow-sm group-hover:shadow-md flex flex-col items-center justify-center relative transition-colors duration-300"
            >
              <div className="absolute top-3 w-8 h-2.5 bg-muted-foreground/20 rounded-sm"></div>
              <div className="absolute top-9 w-12 flex justify-between">
                <div className="w-4 h-4 border-[2px] border-foreground/70 rounded flex items-center justify-center"><div className="w-1.5 h-1.5 bg-foreground/70 rounded-full group-hover:animate-pulse"></div></div>
                <div className="w-1.5 h-0.5 bg-foreground/70 mt-1.5"></div>
                <div className="w-4 h-4 border-[2px] border-foreground/70 rounded flex items-center justify-center"><div className="w-1.5 h-1.5 bg-foreground/70 rounded-full group-hover:animate-pulse"></div></div>
              </div>
              <div className="absolute bottom-3 bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded transition-colors group-hover:bg-primary group-hover:text-primary-foreground">FILE</div>
              
              {/* Floating elements around the icon on hover */}
              <div className="absolute -right-6 top-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 transform translate-x-2 group-hover:translate-x-0">
                 <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="absolute -left-5 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200 transform -translate-x-2 group-hover:translate-x-0">
                 <div className="w-2 h-2 rounded-full bg-orange-400" />
              </div>
            </motion.div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                {isDragging ? "Drop to unleash AI" : "Upload a new document"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-[250px] mx-auto leading-relaxed">
                Drag & drop your files here or click to browse. We support PDF, DOC, DOCX, PPT, PPTX, TXT, and Markdown.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary/80 bg-primary/10 px-3 py-1.5 rounded-full">
                <Upload className="w-3.5 h-3.5" />
                <span>Up to 150 MB per file</span>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Upload progress */}
      <AnimatePresence>
        {uploading.map((item, i) => (
          <motion.div key={item.file.name + i}
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-card border border-border"
          >
            <span className="text-lg">{getFileIcon(item.file.name.split(".").pop() || "")}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{item.file.name}</p>
              <p className="text-[10px] text-muted-foreground">{formatFileSize(item.file.size)}</p>
            </div>
            {item.status === "uploading" && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
            {item.status === "done" && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle2 className="w-4 h-4 text-emerald-500" /></motion.div>}
            {item.status === "error" && <X className="w-4 h-4 text-red-500" />}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
