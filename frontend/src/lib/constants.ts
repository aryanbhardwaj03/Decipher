/** API base URL */
export const API_BASE = "";

/** Supported file types */
export const SUPPORTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "text/plain": [".txt"],
  "text/markdown": [".md"],
  "application/vnd.ms-powerpoint": [".ppt"],
  "application/msword": [".doc"],
};

export const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".pptx", ".ppt", ".doc", ".txt", ".md"];

/** Summary types */
export const SUMMARY_TYPES = [
  { id: "short", label: "Short Summary", icon: "📝", description: "2-3 paragraph overview" },
  { id: "detailed", label: "Detailed Summary", icon: "📖", description: "Comprehensive breakdown" },
  { id: "bullet", label: "Bullet Points", icon: "🔹", description: "Key points as bullets" },
  { id: "takeaways", label: "Key Takeaways", icon: "💡", description: "Top insights" },
  { id: "executive", label: "Executive Summary", icon: "💼", description: "Business-ready overview" },
  { id: "beginner", label: "Beginner Friendly", icon: "🌱", description: "Simple explanation" },
  { id: "technical", label: "Technical Summary", icon: "⚙️", description: "Deep technical detail" },
] as const;

/** Note types */
export const NOTE_TYPES = [
  { id: "smart", label: "Smart Notes", icon: "🧠", description: "Comprehensive study notes" },
  { id: "revision", label: "Revision Notes", icon: "📋", description: "Quick review notes" },
  { id: "formulas", label: "Formula Sheet", icon: "🔢", description: "Equations & formulas" },
  { id: "definitions", label: "Definitions", icon: "📚", description: "Key terms explained" },
  { id: "dates", label: "Key Dates", icon: "📅", description: "Important timelines" },
  { id: "concepts", label: "Key Concepts", icon: "💎", description: "Core ideas & theories" },
] as const;

/** Quiz question types */
export const QUIZ_TYPES = [
  { id: "mcq", label: "Multiple Choice", icon: "🔘" },
  { id: "true_false", label: "True / False", icon: "✅" },
  { id: "short_answer", label: "Short Answer", icon: "✍️" },
  { id: "fill_blanks", label: "Fill in Blanks", icon: "📝" },
] as const;

/** XP thresholds */
export const XP_LEVELS = [
  { level: 1, xp: 0, title: "Beginner" },
  { level: 2, xp: 100, title: "Learner" },
  { level: 3, xp: 300, title: "Scholar" },
  { level: 4, xp: 600, title: "Expert" },
  { level: 5, xp: 1000, title: "Master" },
  { level: 6, xp: 2000, title: "Genius" },
];
