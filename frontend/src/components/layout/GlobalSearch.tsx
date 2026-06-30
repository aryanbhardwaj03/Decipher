"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { Search, FileText, Router, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiGetDocuments } from "@/lib/api";

interface Document {
  id: string;
  original_filename: string;
  created_at: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (open && documents.length === 0) {
      apiGetDocuments()
        .then(data => setDocuments(data.documents || []))
        .catch(() => {});
    }
  }, [open, documents.length]);

  return (
    <>
      {/* Visual Search Bar in TopBar */}
      <div 
        className="group relative w-full max-w-sm cursor-text"
        onClick={() => setOpen(true)}
      >
        <Search className="absolute left-3.5 top-[11px] w-4 h-4 text-muted-foreground group-hover:text-primary/70 transition-colors pointer-events-none" />
        <div className="w-full pl-10 pr-3 py-2 bg-muted/30 border border-border hover:border-primary/30 rounded-xl text-[13px] text-muted-foreground transition-all duration-200 flex items-center justify-between shadow-sm hover:shadow-md hover:bg-muted/50">
          <span>Search your documents...</span>
        </div>
      </div>

      {/* Command Palette Modal */}
      <Command.Dialog 
        open={open} 
        onOpenChange={setOpen} 
        label="Global Command Menu"
        className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-background/50 backdrop-blur-sm"
      >
        {/* We use a wrapper to handle click outside explicitly or let Cmdk handle it. 
            Cmdk handles click outside natively when used as Dialog. */}
        <div className="w-full max-w-[600px] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center px-4 py-3 border-b border-border">
            <Search className="w-5 h-5 text-muted-foreground mr-3" />
            <Command.Input 
              autoFocus
              placeholder="Search your documents..." 
              className="flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-muted rounded-md text-muted-foreground transition-colors ml-2">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <Command.List className="max-h-[300px] overflow-y-auto p-2 scrollbar-hide">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            <Command.Group heading={<span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">Documents</span>}>
              {documents.map((doc) => (
                <Command.Item
                  key={doc.id}
                  value={doc.original_filename}
                  onSelect={() => {
                    setOpen(false);
                    router.push(`/document/${doc.id}`);
                  }}
                  className="flex items-center px-3 py-2.5 rounded-xl cursor-pointer hover:bg-muted aria-selected:bg-muted aria-selected:text-primary transition-colors text-sm text-foreground"
                >
                  <FileText className="w-4 h-4 mr-3 opacity-70" />
                  {doc.original_filename}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </div>
      </Command.Dialog>
    </>
  );
}
