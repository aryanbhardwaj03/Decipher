"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, FileDown } from "lucide-react";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import "@cyntler/react-doc-viewer/dist/index.css";
import { getSessionHeaders } from "@/lib/api";
import { API_BASE } from "@/lib/constants";

interface DocumentViewerProps {
  docId: string;
  pageNumber?: number;
  isOpen: boolean;
  onClose: () => void;
  fileType: string;
}

export function DocumentViewer({ docId, pageNumber, isOpen, onClose, fileType }: DocumentViewerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let url = "";
    
    const fetchDocument = async () => {
      setLoading(true);
      setError(null);
      try {
        const headers = getSessionHeaders(false);
        const response = await fetch(`${API_BASE}/api/documents/${docId}/file`, { headers });
        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Failed to load document: ${response.status} - ${errText}`);
        }

        const blob = await response.blob();
        
        // Use application/pdf for pdfs to ensure browser renders it
        const type = fileType.toLowerCase() === "pdf" ? "application/pdf" : blob.type;
        const typedBlob = new Blob([blob], { type });
        url = URL.createObjectURL(typedBlob);
        
        setBlobUrl(url);
      } catch (err: any) {
        setError(err.message || "Could not load the document.");
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [docId, isOpen, fileType]);

  if (!isOpen || typeof document === "undefined") return null;

  const isPdf = fileType.toLowerCase() === "pdf";

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8">
      <div className="bg-card w-full max-w-6xl h-full max-h-[90vh] rounded-2xl shadow-2xl flex flex-col border border-border overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <h2 className="font-semibold text-foreground">
            Document Viewer {pageNumber && <span className="text-muted-foreground ml-2">Page {pageNumber}</span>}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 relative bg-muted/10 flex items-center justify-center overflow-hidden">
          {loading && (
            <div className="flex flex-col items-center text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
              <p>Loading document...</p>
            </div>
          )}
          
          {error && (
            <div className="text-red-500 font-medium">{error}</div>
          )}

          {!loading && !error && blobUrl && (
            isPdf ? (
              <iframe 
                src={`${blobUrl}#page=${pageNumber || 1}`} 
                className="w-full h-full border-none" 
                title="PDF Viewer"
              />
            ) : ['txt', 'md'].includes(fileType.toLowerCase()) ? (
              <DocViewer
                documents={[{ 
                  uri: blobUrl, 
                  fileName: `document.${fileType}`
                }]}
                pluginRenderers={DocViewerRenderers}
                style={{ width: "100%", height: "100%" }}
                config={{
                  header: { disableHeader: true }
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto h-full">
                <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                  <FileDown className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-foreground">Local Preview Unavailable</h3>
                <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
                  Inline viewing for <span className="font-semibold">{fileType.toUpperCase()}</span> files relies on Microsoft Office Online Viewer, which cannot access files on your local machine (<code className="bg-muted px-1 py-0.5 rounded text-xs">localhost</code>). 
                  <br/><br/>
                  This will work automatically once your app is deployed to a public server. For now, you can download the file to view it locally.
                </p>
                <a 
                  href={blobUrl} 
                  download={`document.${fileType}`}
                  className="px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <FileDown className="w-4 h-4" /> Download File
                </a>
              </div>
            )
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
