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

export type InquiryStatus = 'pending' | 'in_progress' | 'responded' | 'resolved';

export type InquiryCategory =
  | 'Academic Advisory'
  | 'Course Content'
  | 'Technical Support'
  | 'Thesis & Research'
  | 'Billing & Account'
  | 'General Inquiry';

export type InquiryPriority = 'high' | 'medium' | 'low';

export interface InquiryMessage {
  id: string;
  sender: 'customer' | 'support_agent' | 'ai_assistant';
  senderName: string;
  content: string;
  createdAt: string;
  isInternalNote?: boolean;
}

export interface CustomerInquiry {
  id: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  category: InquiryCategory;
  priority: InquiryPriority;
  status: InquiryStatus;
  courseId?: string;
  createdAt: string;
  updatedAt: string;
  messages: InquiryMessage[];
  aiSuggestedResponse?: string;
  satisfactionRating?: number; // 1 to 5 stars
  customerFeedback?: string;
}

export type ChatbotCategory =
  | 'Advisory'
  | 'Course Tutor'
  | 'Student Support'
  | 'Research Mentor'
  | 'FAQ Bot';

export interface ChatbotConfig {
  id: string;
  name: string;
  description: string;
  avatarIcon: string; // 'bot' | 'sparkles' | 'graduation-cap' | 'book-open' | 'message-square' | 'shield'
  avatarColor: string; // 'purple' | 'emerald' | 'sky' | 'amber' | 'rose'
  category: ChatbotCategory;
  model: string;
  temperature: number;
  systemPrompt: string;
  welcomeMessage: string;
  suggestedPrompts: string[];
  knowledgeBaseCourseIds: string[];
  assignedInquiryCategories: InquiryCategory[];
  isActive: boolean;
  autoReplyToInquiries: boolean;
  metrics: {
    conversationsCount: number;
    resolvedTicketsCount: number;
    avgSatisfaction: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ChatbotMessage {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  timestamp: string;
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
  inquiries: CustomerInquiry[];
  chatbots: ChatbotConfig[];
}
