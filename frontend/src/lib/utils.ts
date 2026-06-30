import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format bytes to human-readable */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/** Format date to relative time */
export function formatRelativeTime(dateStr: string): string {
  // Ensure the date string is parsed as UTC if it doesn't specify a timezone
  const tzDateStr = dateStr.endsWith("Z") || dateStr.includes("+") ? dateStr : `${dateStr}Z`;
  const date = new Date(tzDateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/** Get file type icon */
export function getFileIcon(fileType: string): string {
  const icons: Record<string, string> = {
    pdf: "📄",
    docx: "📝",
    pptx: "📊",
    txt: "📃",
    md: "📋",
  };
  return icons[fileType] || "📁";
}

/** Get file type color */
export function getFileColor(fileType: string): string {
  const colors: Record<string, string> = {
    pdf: "text-red-400",
    docx: "text-blue-400",
    pptx: "text-orange-400",
    txt: "text-gray-400",
    md: "text-green-400",
  };
  return colors[fileType] || "text-gray-400";
}

/** Random celebration message */
export function getCorrectMessage(): string {
  const messages = [
    "🎉 Boo-yah! You're right!",
    "🌟 Excellent!",
    "💪 Great job!",
    "✨ Perfect!",
    "🔥 Amazing work!",
    "🏆 Nailed it!",
    "⭐ Brilliant!",
    "🎯 Spot on!",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

/** Random incorrect message */
export function getIncorrectMessage(): string {
  const messages = [
    "😅 Nahh... Hard luck!",
    "💭 Better luck next time!",
    "🤏 Almost there!",
    "👍 Nice try!",
    "📚 Keep learning!",
    "🔄 Try again next time!",
    "💡 Good effort!",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}
