export type CourseStatus = 'active' | 'completed';

export interface SyllabusModule {
  id: string;
  courseId: string;
  week: number;
  title: string;
  topicSummary: string;
  completed: boolean;
  dueDate: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  instructor: string;
  credits: number;
  term: string;
  status: CourseStatus;
  grade: string;
  currentScore: number;
  weeklyHoursTarget: number;
  imageUrl: string;
  description: string;
  modules: SyllabusModule[];
}

export interface ResearchNote {
  id: string;
  courseId: string;
  title: string;
  authors: string;
  year: string;
  publication: string;
  citationKey: string;
  summary: string;
  body: string;
  tags: string[];
  updatedAt: string;
}

export interface Flashcard {
  id: string;
  courseId: string;
  front: string;
  back: string;
  hint: string;
  mastery: 0 | 1 | 2 | 3; // 0 = New, 1 = Learning, 2 = Reviewing, 3 = Mastered
  lastReviewedAt: string | null;
}

export interface StudyTask {
  id: string;
  courseId: string;
  title: string;
  type: 'Assignment' | 'Exam Prep' | 'Reading' | 'Research';
  dueDate: string;
  estimatedMinutes: number;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'done';
}

export interface ThesisChapter {
  id: string;
  orderIndex: number;
  title: string;
  targetWords: number;
  content: string;
  status: 'Drafting' | 'Revising' | 'Finalized';
  updatedAt: string;
}

export interface StudySession {
  id: string;
  courseId: string;
  durationMinutes: number;
  focusTopic: string;
  completedAt: string;
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode: 'synthesis' | 'explain' | 'thesis' | 'plan';
  courseId?: string;
  createdAt: string;
}

export interface WorkspaceSnapshot {
  scholar: {
    name: string;
    program: string;
    institution: string;
    term: string;
    gpa: number;
    avatarUrl: string;
    thesisTitle: string;
  };
  courses: Course[];
  notes: ResearchNote[];
  flashcards: Flashcard[];
  tasks: StudyTask[];
  thesisChapters: ThesisChapter[];
  sessions: StudySession[];
}
