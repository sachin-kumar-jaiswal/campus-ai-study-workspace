// ─── User ────────────────────────────────────────────────────────────────────

export type UserRole = 'student' | 'admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// ─── API ─────────────────────────────────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  success: true;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: { field?: string; message: string }[];
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ─── Document ─────────────────────────────────────────────────────────────────

export type DocumentStatus = 'uploading' | 'processing' | 'ready' | 'failed';

export interface Document {
  _id: string;
  owner: string;
  title: string;
  originalFileName: string;
  fileType: string;
  fileSize: number;
  storageKey: string;
  extractedText?: string;   // only present in detail view
  summary: string;
  status: DocumentStatus;
  pageCount: number;
  errorMessage: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentListResult {
  documents: Document[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface DocumentStats {
  total: number;
  processing: number;
  ready: number;
  failed: number;
  recent: Document[];
}

export interface QuizSummary {
  _id: string;
  title: string;
  sourceLabel: string;
  questionCount: number;
  attemptCount: number;
  latestScore: number | null;
  createdAt: string;
}

export interface QuizQuestion {
  prompt: string;
  options: string[];
}

export interface QuizDetail extends QuizSummary {
  questions: QuizQuestion[];
}

export interface QuizReviewQuestion extends QuizQuestion {
  selectedIndex: number;
  correctIndex: number;
  explanation: string;
}

export interface QuizResult {
  score: number;
  correctCount: number;
  totalQuestions: number;
  completedAt: string;
  review: QuizReviewQuestion[];
}

export type StudyPriority = 'low' | 'medium' | 'high';

export interface StudyTask {
  _id: string;
  title: string;
  subject: string;
  dueDate: string;
  durationMinutes: number;
  priority: StudyPriority;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface WeeklyStudyActivity {
  date: string;
  minutes: number;
  quizAttempts: number;
}

export interface StudyAnalytics {
  documents: number;
  readyDocuments: number;
  completedTasks: number;
  upcomingTasks: number;
  trackedStudyMinutes: number;
  quizAttempts: number;
  averageQuizScore: number | null;
  weeklyActivity: WeeklyStudyActivity[];
}

// ─── Conversation ─────────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  role: MessageRole;
  content: string;
  timestamp: string;
}

export interface Conversation {
  _id?: string;
  document: string;
  user: string;
  messages: ChatMessage[];
}

// ─── AI Tutor ────────────────────────────────────────────────────────────────

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AiConversationResult {
  conversationId: string | null;
  messages: AiChatMessage[];
}

// ─── UI ──────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';
