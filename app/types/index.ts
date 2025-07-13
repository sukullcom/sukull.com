import { Key, ReactNode } from "react";

// Define a proper editor interface
export interface MonacoEditor {
  getValue(): string;
  setValue(value: string): void;
  getModel(): unknown;
}

export interface Theme {
  id: string;
  label: string;
  color: string;
}

export interface Language {
  id: string;
  label: string;
  logoPath: string;
  monacoLanguage: string;
  defaultCode: string;
  pistonRuntime: LanguageRuntime;
}

export interface LanguageRuntime {
  language: string;
  version: string;
}

export interface ExecuteCodeResponse {
  compile?: {
    output: string;
  };
  run?: {
    output: string;
    stderr: string;
  };
}

export interface ExecutionResult {
  code: string;
  output: string;
  error: string | null;
}

export interface CodeEditorState {
  language: string;
  output: string;
  isRunning: boolean;
  error: string | null;
  theme: string;
  fontSize: number;
  editor: MonacoEditor | null;
  executionResult: ExecutionResult | null;

  setEditor: (editor: MonacoEditor) => void;
  getCode: () => string;
  setLanguage: (language: string) => void;
  setTheme: (theme: string) => void;
  setFontSize: (fontSize: number) => void;
  runCode: () => Promise<void>;
}

export interface Snippet {
  description: ReactNode;
  id: Key | null | undefined;
  _id: string;
  _creationTime: number;
  userId: string;
  language: string;
  code: string;
  title: string;
  userName: string;
}

// Common types for the application

// Generic form event type
export type FormEvent = React.FormEvent<HTMLFormElement>;

// React state setter type
export type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

// Generic API response
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  status?: number;
}

// User related types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  description?: string; 
  role?: string;
  meetLink?: string;
}

// Booking related types
export interface Booking {
  id: number;
  studentId: string;
  teacherId: string;
  startTime: string;
  endTime: string;
  status: string;
  meetLink?: string;
  field?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  student?: User;
  teacher?: User;
  studentName?: string;
  studentEmail?: string;
  studentUsername?: string;
}

// Teacher application types
export interface TeacherApplication {
  id: number;
  userId: string;
  field: string;
  quizResult: number;
  passed: boolean;
  teacherName?: string;
  teacherSurname?: string;
  teacherPhoneNumber?: string;
  teacherEmail?: string;
  classification?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Teacher fields types
export interface TeacherField {
  id: number;
  teacherId: string;
  subject: string;
  grade: string;
  displayName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FieldOption {
  subject: string;
  grade: string;
  displayName: string;
}

// Student application types
export interface StudentApplication {
  id: number;
  studentName: string;
  studentSurname: string;
  studentPhoneNumber: string;
  studentEmail: string;
  field: string;
  studentNeeds?: string;
  userId?: string;
  status: string;
  approved: boolean;
  createdAt: string;
}

// School type
export interface School {
  id: number;
  name: string;
  city: string;
  district: string;
  category: string;
  kind: string | null;
  type: string;
  totalPoints: number;
}

// TimeSlot for teacher availability
export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  dayOfWeek: number;
  isBooked?: boolean;
  isSelected?: boolean;
}

// Toast configuration
export interface ToastConfig {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  cancel?: React.ReactNode;
  duration?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
}