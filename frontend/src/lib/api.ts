import { showToast } from "@/components/ui/Toaster";
import { API_BASE } from "./constants";

/** Get stored auth token */
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

/** Browser-local guest identity used for anonymous document ownership */
function getGuestId(): string | null {
  if (typeof window === "undefined") return null;

  const key = "studyai_guest_id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;

  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  localStorage.setItem(key, id);
  return id;
}

export function getSessionHeaders(includeJson = true): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = getToken();
  const guestId = getGuestId();

  if (token) headers.Authorization = `Bearer ${token}`;
  if (guestId) headers["X-Guest-Id"] = guestId;
  if (includeJson) headers["Content-Type"] = "application/json";

  return headers;
}

/** Set auth token */
export function setToken(token: string) {
  localStorage.setItem("token", token);
}

/** Clear auth token */
export function clearToken() {
  localStorage.removeItem("token");
}

/** Authenticated fetch wrapper */
async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const isFormData = options.body instanceof FormData;
  const headers: HeadersInit = {
    ...getSessionHeaders(!isFormData),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      cache: "no-store",
      ...options,
      headers,
    });

    if (response.status === 401) {
      if (!endpoint.startsWith("/api/auth/")) {
        const token = getToken();
        if (token) {
          clearToken();
          throw new Error("Session expired. Continue as guest or sign in again.");
        }
      }
    }

    return response;
  } catch (error: any) {
    if (error.name === "TypeError" && error.message === "Failed to fetch") {
      // This is a network or CORS error. Show the URL to help debug.
      showToast(`Network/CORS error connecting to ${API_BASE || "relative URL"}`, "error");
    }
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════════════════════════════

export async function apiLogin(email: string, password: string) {
  const res = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error((await res.json()).detail || "Login failed");
  return res.json();
}

export async function apiSendOtp(email: string) {
  const res = await apiFetch("/api/auth/send-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error((await res.json()).detail || "Failed to send OTP");
  return res.json();
}

export async function apiRegister(email: string, password: string, name: string, otp: string) {
  const res = await apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name, otp }),
  });
  if (!res.ok) throw new Error((await res.json()).detail || "Registration failed");
  return res.json();
}

export async function apiGoogleAuth(email: string, name: string, avatar_url: string) {
  const res = await apiFetch("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({ email, name, avatar_url }),
  });
  if (!res.ok) throw new Error((await res.json()).detail || "Google auth failed");
  return res.json();
}

export async function apiGetMe() {
  const res = await apiFetch("/api/auth/me");
  if (!res.ok) throw new Error("Not authenticated");
  return res.json();
}

export async function apiUpdateProfile(name: string) {
  const res = await apiFetch("/api/users/me", {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error((await res.json()).detail || "Profile update failed");
  return res.json();
}

export async function apiChangePassword(old_password: string, new_password: string) {
  const res = await apiFetch("/api/users/me/password", {
    method: "PUT",
    body: JSON.stringify({ old_password, new_password }),
  });
  if (!res.ok) throw new Error((await res.json()).detail || "Password change failed");
  return res.json();
}

export async function apiUploadAvatar(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await apiFetch("/api/users/me/avatar", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error((await res.json()).detail || "Avatar upload failed");
  return res.json();
}

export async function apiExportData() {
  const res = await fetch(`${API_BASE}/api/users/me/export`, {
    headers: getSessionHeaders(false),
  });
  if (!res.ok) throw new Error("Export failed");
  
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "studyai_export.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  return { success: true };
}

export async function apiDeleteAllData() {
  const res = await apiFetch("/api/users/me/data", {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete data");
  return res.json();
}

export async function apiGetXpHistory() {
  const res = await apiFetch("/api/users/me/xp");
  if (!res.ok) throw new Error("Failed to fetch XP history");
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════════
//  PAYMENTS
// ═══════════════════════════════════════════════════════════════════════

export async function apiCreateOrder(planName: string, amount: number) {
  const res = await apiFetch("/api/payments/create-order", {
    method: "POST",
    body: JSON.stringify({ plan_name: planName, amount }),
  });
  if (!res.ok) throw new Error("Failed to create order");
  return res.json();
}

export async function apiVerifyPayment(paymentId: string, orderId: string, signature: string, planName: string) {
  const res = await apiFetch("/api/payments/verify", {
    method: "POST",
    body: JSON.stringify({ 
      razorpay_payment_id: paymentId, 
      razorpay_order_id: orderId, 
      razorpay_signature: signature,
      plan_name: planName
    }),
  });
  if (!res.ok) throw new Error("Payment verification failed");
  return res.json();
}

export async function apiCancelSubscription() {
  const res = await apiFetch("/api/payments/cancel", {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to cancel subscription");
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════════
//  DOCUMENTS
// ═══════════════════════════════════════════════════════════════════════

export async function apiUploadDocument(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await apiFetch("/api/documents/new", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    let detail = `Upload failed (${res.status})`;
    try {
      const json = await res.json();
      if (json.detail) detail = typeof json.detail === "string" ? json.detail : JSON.stringify(json.detail);
    } catch (e) {}
    throw new Error(detail);
  }
  return res.json();
}

export async function apiGetDocuments() {
  try {
    const res = await apiFetch("/api/documents");
    if (!res.ok) throw new Error("Failed to fetch documents: " + res.statusText);
    return await res.json();
  } catch (error) {
    console.error("apiGetDocuments error:", error);
    throw error;
  }
}

export async function apiGetDocument(docId: string) {
  const res = await apiFetch(`/api/documents/${docId}`);
  if (!res.ok) throw new Error("Document not found");
  return res.json();
}

export async function apiDeleteDocument(docId: string) {
  const res = await apiFetch(`/api/documents/${docId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Delete failed");
  return res.json();
}

export async function apiToggleFavorite(docId: string) {
  const res = await apiFetch(`/api/documents/${docId}/favorite`, { method: "PATCH" });
  if (!res.ok) throw new Error("Failed to toggle favorite");
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════════
//  CHAT (SSE Streaming)
// ═══════════════════════════════════════════════════════════════════════

export async function* apiChatStream(docId: string, message: string) {
  const res = await fetch(`${API_BASE}/api/chat/${docId}`, {
    method: "POST",
    headers: getSessionHeaders(),
    body: JSON.stringify({ document_id: docId, message }),
  });

  if (!res.ok) throw new Error("Chat failed");

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6));
          yield data;
        } catch {
          // Skip malformed SSE
        }
      }
    }
  }
}

export async function apiGetChatHistory(docId: string) {
  const res = await apiFetch(`/api/chat/${docId}/history`);
  if (!res.ok) throw new Error("Failed to fetch chat history");
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════════
//  SUMMARY (SSE Streaming)
// ═══════════════════════════════════════════════════════════════════════

export async function* apiSummaryStream(docId: string, summaryType: string, customFocus: string = "") {
  const res = await fetch(`${API_BASE}/api/summary/${docId}`, {
    method: "POST",
    headers: getSessionHeaders(),
    body: JSON.stringify({ summary_type: summaryType, custom_focus: customFocus }),
  });

  if (!res.ok) throw new Error("Summary generation failed");

  // Check if response is JSON (cached) or SSE (stream)
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await res.json();
    yield { type: "token", content: data.content };
    yield { type: "done" };
    return;
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          yield JSON.parse(line.slice(6));
        } catch {}
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  QUIZ
// ═══════════════════════════════════════════════════════════════════════

export async function apiGenerateQuiz(
  docId: string,
  numQuestions: number,
  difficulty: string,
  questionTypes: string[],
  topicFocus: string = ""
) {
  const res = await apiFetch(`/api/quiz/${docId}/generate`, {
    method: "POST",
    body: JSON.stringify({
      num_questions: numQuestions,
      difficulty,
      question_types: questionTypes,
      topic_focus: topicFocus,
    }),
  });
  if (!res.ok) throw new Error((await res.json()).detail || "Quiz generation failed");
  return res.json();
}

export async function apiSubmitQuiz(quizId: string, answers: { question_index: number; answer: string }[]) {
  const res = await apiFetch("/api/quiz/submit", {
    method: "POST",
    body: JSON.stringify({ quiz_id: quizId, answers }),
  });
  if (!res.ok) throw new Error("Quiz submission failed");
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════════
//  FLASHCARDS
// ═══════════════════════════════════════════════════════════════════════

export async function apiGenerateFlashcards(docId: string, numCards: number = 15, topicFocus: string = "") {
  const res = await apiFetch(`/api/flashcards/${docId}/generate`, {
    method: "POST",
    body: JSON.stringify({ num_cards: numCards, topic_focus: topicFocus }),
  });
  if (!res.ok) throw new Error("Flashcard generation failed");
  return res.json();
}

export async function apiGetFlashcards(docId: string) {
  const res = await apiFetch(`/api/flashcards/${docId}`);
  if (!res.ok) throw new Error("Failed to fetch flashcards");
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════════
//  NOTES (SSE Streaming)
// ═══════════════════════════════════════════════════════════════════════

export async function* apiNotesStream(docId: string, noteType: string, customFocus: string = "") {
  const res = await fetch(`${API_BASE}/api/notes/${docId}`, {
    method: "POST",
    headers: getSessionHeaders(),
    body: JSON.stringify({ note_type: noteType, custom_focus: customFocus }),
  });

  if (!res.ok) throw new Error("Notes generation failed");

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await res.json();
    yield { type: "token", content: data.content };
    yield { type: "done" };
    return;
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          yield JSON.parse(line.slice(6));
        } catch {}
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  SEARCH
// ═══════════════════════════════════════════════════════════════════════

export async function apiSearchDocument(docId: string, query: string, mode: string = "semantic") {
  const res = await apiFetch(`/api/search/${docId}`, {
    method: "POST",
    body: JSON.stringify({ query, mode }),
  });
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════════
//  FIGURES
// ═══════════════════════════════════════════════════════════════════════

export async function apiGetFigures(docId: string) {
  const res = await apiFetch(`/api/figures/${docId}`);
  if (!res.ok) throw new Error("Failed to fetch figures");
  return res.json();
}

export async function apiExplainFigure(figureId: string) {
  const res = await apiFetch(`/api/figures/${figureId}/explain`, { method: "POST" });
  if (!res.ok) throw new Error("Figure explanation failed");
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════════
//  ADMIN
// ═══════════════════════════════════════════════════════════════════════

export async function apiGetAdminStats() {
  const res = await apiFetch("/api/admin/stats");
  if (!res.ok) throw new Error("Admin access denied");
  return res.json();
}

export async function apiGetAdminUsers(skip = 0, limit = 50) {
  const res = await apiFetch(`/api/admin/users?skip=${skip}&limit=${limit}`);
  if (!res.ok) throw new Error("Admin access denied");
  return res.json();
}

export async function apiGetAdminDocuments(skip = 0, limit = 50) {
  const res = await apiFetch(`/api/admin/documents?skip=${skip}&limit=${limit}`);
  if (!res.ok) throw new Error("Admin access denied");
  return res.json();
}
