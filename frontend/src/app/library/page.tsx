"use client";
import { useEffect, useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { FolderOpen, Search, Filter, X } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { DocumentCard } from "@/components/document/DocumentCard";
import { apiGetDocuments, apiDeleteDocument, apiToggleFavorite } from "@/lib/api";
import { showToast } from "@/components/ui/Toaster";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { UploadZone } from "@/components/document/UploadZone";
import { motion, AnimatePresence } from "framer-motion";
import type { Document } from "@/types";

export default function LibraryPage() {
  const { user, loading: authLoading, isGuest } = useAuth();
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUpload, setShowUpload] = useState(false);

  const maxDocs = isGuest ? 10 : (user?.plan === "Basic" || !user?.plan ? 30 : Infinity);
  const isOverLimit = maxDocs !== Infinity && documents.length >= maxDocs;

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

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    if (documents.some((d) => d.status === "processing")) {
      const interval = setInterval(fetchDocuments, 3000);
      return () => clearInterval(interval);
    }
  }, [documents, fetchDocuments]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    const previousDocs = documents;
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    showToast("Document deleted", "success");
    try {
      await apiDeleteDocument(id);
    } catch {
      setDocuments(previousDocs);
      showToast("Failed to delete document", "error");
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

  const filteredDocs = documents.filter(doc => 
    (doc.original_filename || doc.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout onUploadClick={handleUploadClick}>
      <AnimatePresence>
        {showUpload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
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

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-primary/10 text-primary">
              <FolderOpen className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">My Library</h1>
              <p className="text-muted-foreground mt-1">All your uploaded documents in one place</p>
            </div>
          </div>
          <Button variant="default" onClick={() => setShowUpload(true)}>Upload New</Button>
        </div>

        <div className="flex gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search documents..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" /> Filter
          </Button>
        </div>

        {loading || authLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
        ) : filteredDocs.length === 0 ? (
          <EmptyState 
            icon={<FolderOpen className="w-10 h-10" />}
            title={searchQuery ? "No matching documents" : "Your library is empty"}
            description={searchQuery ? "Try adjusting your search terms." : "Upload your first document to get started."}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredDocs.map((doc, i) => (
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
      </main>
    </AppLayout>
  );
}
