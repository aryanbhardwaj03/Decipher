export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  plan?: "Basic" | "Plus" | "Pro";
  xp?: number;
  preferences?: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface XPTransaction {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
}

export interface XPHistoryResponse {
  total_xp: number;
  weekly_xp: number;
  history: XPTransaction[];
}

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  defaultAiModel: string;
  summaryLength: "short" | "medium" | "long";
  responseLanguage: string;
  emailNotifications: boolean;
  browserNotifications: boolean;
}

export interface Document {
  id: string;
  title?: string;
  original_filename?: string;
  file_type?: string;
  file_size?: number;
  status?: "processing" | "ready" | "error" | string;
  pages?: number;
  word_count?: number;
  image_count?: number;
  table_count?: number;
  reading_time_minutes?: number;
  estimated_difficulty?: string | null;
  is_favorite?: boolean;
  summary?: string;
  thumbnailUrl?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface Summary {
  id: string;
  documentId: string;
  content: string;
  type: "brief" | "detailed" | "bullet_points";
  createdAt: string;
}
