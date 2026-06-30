"use client";

import React, { use, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Send, Loader2, MessageSquare, Sparkles, Copy, Check } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { apiChatStream, apiGetChatHistory } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkBreaks from "remark-breaks";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { DocumentViewer } from "@/components/document/DocumentViewer";
import { apiGetDocument } from "@/lib/api";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  sources?: { page: number; score: number }[];
}

const MemoizedMessage = React.memo(({ msg, onCitationClick }: { msg: Message, onCitationClick?: (page: number) => void }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
      
      {/* AI Avatar */}
      {msg.role === "assistant" && (
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm bg-primary">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
      )}

      {/* Message Content */}
      <div className={`group relative max-w-[85%] ${
        msg.role === "user"
          ? "bg-muted text-foreground px-5 py-3.5 rounded-3xl rounded-tr-sm text-[15px] leading-relaxed shadow-sm" 
          : "text-foreground text-[15px] leading-relaxed pt-1 w-full"
      }`}>
        {msg.role === "assistant" && msg.content && (
          <button 
            onClick={() => {
              navigator.clipboard.writeText(msg.content);
              // Simple toast or just visual feedback could go here
            }}
            className="absolute -right-10 top-0 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-md hover:bg-muted text-muted-foreground"
            title="Copy message"
          >
            <Copy className="w-4 h-4" />
          </button>
        )}

        {msg.role === "user" ? (
          <div className="whitespace-pre-wrap">{msg.content}</div>
        ) : (
          <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none break-words prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:text-foreground prose-p:leading-relaxed prose-li:my-1 prose-ul:my-2">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]} 
              rehypePlugins={[rehypeKatex]}
              components={{
                p: ({node, children, ...props}: any) => <div className="mb-4 last:mb-0" {...props}>{children}</div>,
                code({node, inline, className, children, ...props}: any) {
                  const match = /language-(\w+)/.exec(className || '')
                  return !inline ? (
                    <div className="relative rounded-md overflow-hidden my-4 border border-border">
                      <div className="bg-muted/50 px-4 py-1.5 text-[11px] font-mono text-muted-foreground border-b border-border flex justify-between items-center">
                        <span>{match ? match[1] : 'code'}</span>
                      </div>
                      <pre className="p-4 overflow-x-auto bg-muted/30 m-0" {...props}>
                        <code className={className}>{children}</code>
                      </pre>
                    </div>
                  ) : (
                    <code className="bg-muted px-1.5 py-0.5 rounded-md text-[0.875em] text-primary" {...props}>
                      {children}
                    </code>
                  )
                }
              }}
            >
              {msg.content || "..."}
            </ReactMarkdown>
          </div>
        )}
        
        {/* Citations */}
        {msg.sources && msg.sources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border flex flex-wrap gap-2">
            {msg.sources.map((s, j) => (
              <span 
                key={j} 
                onClick={() => onCitationClick && onCitationClick(s.page)}
                className="px-2 py-1 rounded-md text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 transition-colors hover:bg-primary/20 cursor-pointer"
              >
                Page {s.page}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
});
MemoizedMessage.displayName = "MemoizedMessage";

import { useParams } from "next/navigation";

export default function ChatPage() {
  const params = useParams();
  const id = params?.id as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<any>(null);
  const [viewerPage, setViewerPage] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      apiGetDocument(id).then(setDoc).catch(() => {});
      apiGetChatHistory(id).then((data) => {
        setMessages(data.messages || []);
      }).catch(() => {});
    }
  }, [id]);

  useEffect(() => {
    if (!messagesEndRef.current) return;
    const el = document.getElementById('chat-scroll-container');
    if (el) {
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
      if (isNearBottom || messages.length <= 1) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || streaming) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setStreaming(true);

    try {
      for await (const event of apiChatStream(id, userMsg.content)) {
        if (event.type === "token") {
          // Smooth out bursty tokens by splitting them into smaller chunks and adding a tiny delay
          // The 's' flag is critical so '.' matches newlines, preventing markdown formatting from breaking!
          const chunks = event.content.match(/.{1,3}/gs) || [];
          for (const chunk of chunks) {
            await new Promise(r => setTimeout(r, 8)); // Typewriter delay
            setMessages((prev) => {
              const updated = [...prev];
              if (updated[updated.length - 1]?.role !== "assistant") {
                updated.push({ role: "assistant", content: chunk, sources: [] });
              } else {
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: updated[updated.length - 1].content + chunk,
                };
              }
              return updated;
            });
          }
        } else if (event.type === "sources") {
          setMessages((prev) => {
            const updated = [...prev];
            if (updated[updated.length - 1]?.role !== "assistant") {
              updated.push({ role: "assistant", content: "", sources: event.sources });
            } else {
              updated[updated.length - 1] = { ...updated[updated.length - 1], sources: event.sources };
            }
            return updated;
          });
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], content: "Failed to generate response. Please try again." };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  };

  return (
    <AppLayout>

      {/* Header */}
      <div className="relative z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 sticky top-0">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href={`/document/${id}`}
            className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-foreground leading-tight">Document Chat</h1>
            <p className="text-[12px] text-muted-foreground">Powered by StudyAI</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div id="chat-scroll-container" className="relative z-0 flex-1 overflow-y-auto px-4 pt-8 pb-32 bg-background">
        <div className="max-w-3xl mx-auto space-y-8">
          {messages.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10 shadow-sm">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">How can I help you today?</h3>
              <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
                Ask any question about your document. I will find relevant sections and respond with exact page citations.
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-xl mx-auto">
                {["Summarize the key points", "What is the conclusion?", "Explain the methodology", "List main findings"].map((q) => (
                  <button key={q} onClick={() => setInput(q)}
                    className="px-4 py-2.5 rounded-full text-[13px] font-medium bg-muted/50 text-muted-foreground border border-border hover:bg-muted hover:text-foreground transition-all">
                    {q}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map((msg, i) => (
            <MemoizedMessage key={i} msg={msg} onCitationClick={(page) => setViewerPage(page)} />
          ))}

          {streaming && messages[messages.length - 1]?.role === "user" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm bg-primary">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex items-center gap-2 pt-2 text-sm text-muted-foreground font-medium">
                <Loader2 className="w-4 h-4 animate-spin text-primary" /> Thinking...
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Floating Input Area (Claude-style) */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-background via-background to-transparent z-20">
        <div className="max-w-3xl mx-auto relative">
          <div className="relative flex items-end shadow-lg shadow-black/5 dark:shadow-black/20 rounded-2xl bg-card border border-border overflow-hidden focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all">
            <textarea 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask anything about this document..." 
              disabled={streaming}
              rows={1}
              style={{ minHeight: '56px', maxHeight: '200px' }}
              className="flex-1 px-5 py-4 bg-transparent text-[15px] text-foreground resize-none focus:outline-none disabled:opacity-50 placeholder:text-muted-foreground leading-relaxed" 
            />
            <div className="p-2 shrink-0 h-[56px] flex items-center justify-center">
              <button 
                onClick={handleSend} 
                disabled={!input.trim() || streaming}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-primary-foreground bg-primary hover:opacity-90 disabled:bg-muted disabled:text-muted-foreground transition-all"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </div>
          <p className="text-center text-[11px] text-muted-foreground mt-3 font-medium">
            AI can make mistakes. Consider verifying important information.
          </p>
        </div>
      </div>
      
      {/* Document Viewer Modal */}
      {doc && viewerPage !== null && (
        <DocumentViewer
          docId={id}
          fileType={doc.file_type}
          pageNumber={viewerPage}
          isOpen={viewerPage !== null}
          onClose={() => setViewerPage(null)}
        />
      )}
    </AppLayout>
  );
}
