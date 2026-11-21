import type {
  ChatbotConfig,
  Course,
  CustomerInquiry,
  Flashcard,
  InquiryMessage,
  InquiryStatus,
  ResearchNote,
  StudySession,
  StudyTask,
  SyllabusModule,
  ThesisChapter,
  WorkspaceSnapshot,
} from '../types';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export interface SupabaseStatus {
  configured: boolean;
  connected: boolean;
  url?: string;
  authMode?: 'service_role' | 'anon' | 'none';
  tables?: Record<string, number>;
  error?: string | null;
}

export const api = {
  getWorkspace: () => request<WorkspaceSnapshot>('/api/workspace'),

  getSupabaseStatus: () => request<SupabaseStatus>('/api/supabase/status'),

  getSupabaseSchema: () => request<{ sql: string }>('/api/supabase/schema'),

  updateSupabaseConfig: (payload: { url?: string; anonKey?: string; serviceRoleKey?: string }) =>
    request<SupabaseStatus>('/api/supabase/config', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  seedSupabase: () =>
    request<{ success: boolean; seeded: Record<string, number>; message: string }>(
      '/api/supabase/seed',
      { method: 'POST' }
    ),

  createCourse: (payload: Partial<Course>) =>
    request<Course>('/api/courses', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteCourse: (id: string) =>
    request<{ ok: boolean }>(`/api/courses/${id}`, {
      method: 'DELETE',
    }),

  toggleModule: (courseId: string, moduleId: string, completed: boolean) =>
    request<SyllabusModule>(`/api/courses/${courseId}/modules/${moduleId}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed }),
    }),

  addModule: (courseId: string, payload: Partial<SyllabusModule>) =>
    request<SyllabusModule>(`/api/courses/${courseId}/modules`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  saveNote: (payload: Partial<ResearchNote>) =>
    request<ResearchNote>('/api/notes', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteNote: (id: string) =>
    request<{ ok: boolean }>(`/api/notes/${id}`, {
      method: 'DELETE',
    }),

  createFlashcard: (payload: Partial<Flashcard>) =>
    request<Flashcard>('/api/flashcards', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  rateFlashcard: (id: string, mastery: 0 | 1 | 2 | 3) =>
    request<Flashcard>(`/api/flashcards/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ mastery }),
    }),

  deleteFlashcard: (id: string) =>
    request<{ ok: boolean }>(`/api/flashcards/${id}`, {
      method: 'DELETE',
    }),

  saveTask: (payload: Partial<StudyTask>) =>
    request<StudyTask>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteTask: (id: string) =>
    request<{ ok: boolean }>(`/api/tasks/${id}`, {
      method: 'DELETE',
    }),

  saveChapter: (chapter: ThesisChapter) =>
    request<ThesisChapter>(`/api/thesis/chapters/${chapter.id}`, {
      method: 'PUT',
      body: JSON.stringify(chapter),
    }),

  recordSession: (payload: Partial<StudySession>) =>
    request<StudySession>('/api/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  askCopilot: (payload: { prompt: string; mode: string; contextText?: string }) =>
    request<{ text: string }>('/api/ai/copilot', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  generateFlashcards: (payload: { courseId: string; topic: string; count?: number }) =>
    request<Flashcard[]>('/api/ai/flashcards', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  generateQuiz: (payload: { topic: string; courseTitle?: string }) =>
    request<
      Array<{
        question: string;
        options: string[];
        correctIndex: number;
        explanation: string;
      }>
    >('/api/ai/quiz', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Customer Response & Inquiries API
  getInquiries: () => request<CustomerInquiry[]>('/api/customer-responses'),

  createInquiry: (payload: Partial<CustomerInquiry>) =>
    request<CustomerInquiry>('/api/customer-responses', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  replyToInquiry: (
    id: string,
    message: { content: string; sender: 'customer' | 'support_agent'; senderName: string }
  ) =>
    request<CustomerInquiry>(`/api/customer-responses/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify(message),
    }),

  updateInquiryStatus: (id: string, status: InquiryStatus) =>
    request<CustomerInquiry>(`/api/customer-responses/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  rateInquiry: (id: string, rating: number, feedback?: string) =>
    request<CustomerInquiry>(`/api/customer-responses/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ rating, feedback }),
    }),

  deleteInquiry: (id: string) =>
    request<{ ok: boolean }>(`/api/customer-responses/${id}`, {
      method: 'DELETE',
    }),

  // AI Chatbots & Auto-Responder API
  getChatbots: () => request<ChatbotConfig[]>('/api/chatbots'),

  saveChatbot: (bot: Partial<ChatbotConfig>) =>
    request<ChatbotConfig>(bot.id ? `/api/chatbots/${bot.id}` : '/api/chatbots', {
      method: bot.id ? 'PUT' : 'POST',
      body: JSON.stringify(bot),
    }),

  deleteChatbot: (id: string) =>
    request<{ ok: boolean }>(`/api/chatbots/${id}`, {
      method: 'DELETE',
    }),

  chatWithBot: (
    id: string,
    payload: {
      message: string;
      history?: Array<{ sender: 'user' | 'bot'; content: string }>;
    }
  ) =>
    request<{ reply: string; botId: string; model: string }>(`/api/chatbots/${id}/chat`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
