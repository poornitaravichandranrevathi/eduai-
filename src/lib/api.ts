import type {
  Course,
  Flashcard,
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

export const api = {
  getWorkspace: () => request<WorkspaceSnapshot>('/api/workspace'),

  createCourse: (payload: Partial<Course>) =>
    request<Course>('/api/courses', {
      method: 'POST',
      body: JSON.stringify(payload),
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
};
