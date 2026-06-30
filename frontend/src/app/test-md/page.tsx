"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function TestPage() {
  console.log("ReactMarkdown is:", ReactMarkdown);
  console.log("remarkGfm is:", remarkGfm);
  return <div>Test</div>;
}
