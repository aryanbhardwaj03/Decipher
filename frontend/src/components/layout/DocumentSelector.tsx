"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { ChevronDown, FileText, Loader2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiGetDocuments } from "@/lib/api";

interface Document {
  id: string;
  original_filename: string;
}

export function DocumentSelector() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  
  const currentId = params?.id as string | undefined;
  
  const [isOpen, setIsOpen] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Fetch documents to show correct name even before opening dropdown
  useEffect(() => {
    if (!initialFetchDone) {
      apiGetDocuments()
        .then(data => {
          setDocuments(data.documents || []);
          setInitialFetchDone(true);
        })
        .catch(() => {});
    }
  }, [initialFetchDone]);

  // If we open dropdown and haven't fetched yet, show loader
  useEffect(() => {
    if (isOpen && !initialFetchDone && !loading) {
      setLoading(true);
      apiGetDocuments()
        .then(data => {
          setDocuments(data.documents || []);
          setInitialFetchDone(true);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen, initialFetchDone, loading]);

  
  const currentDoc = documents.find(d => d.id === currentId);
  const displayName = currentId ? (currentDoc?.original_filename || "Loading...") : "Select Document";

  const handleSelect = (docId: string) => {
    setIsOpen(false);
    if (docId === currentId) return;

    if (currentId && pathname) {
      // Replace the current document ID in the pathname with the new one
      const newPath = pathname.replace(`/document/${currentId}`, `/document/${docId}`);
      router.push(newPath);
    } else {
      // If we are on a global page (e.g. /dashboard), navigate to the document's dashboard
      router.push(`/document/${docId}`);
    }
  };

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 max-w-[200px] sm:max-w-[300px] h-9 px-3 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-muted/50 transition-all text-sm shadow-sm"
      >
        <FileText className="w-4 h-4 text-primary shrink-0" />
        <span className="truncate font-medium text-foreground">
          {displayName}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-lg overflow-hidden flex flex-col py-1"
          >
            <div className="px-3 py-2 border-b border-border mb-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Your Library</span>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto scrollbar-hide py-1">
              {loading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : documents.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No documents found.
                </div>
              ) : (
                documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => handleSelect(doc.id)}
                    className="w-full flex items-center justify-between px-4 py-2 text-sm text-left hover:bg-muted transition-colors"
                  >
                    <span className="truncate pr-4 text-foreground font-medium">{doc.original_filename}</span>
                    {doc.id === currentId && (
                      <Check className="w-4 h-4 text-primary shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
