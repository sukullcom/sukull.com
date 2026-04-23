import { Key, ReactNode } from "react";

// Monaco editor minimal wrapper interface (kod editörü soft-sunset'inde tutuluyor)
export interface MonacoEditor {
  getValue(): string;
  setValue(value: string): void;
  getModel(): { getValue(): string } | null;
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

export type FormEvent = React.FormEvent<HTMLFormElement>;

export type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  status?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  description?: string;
  role?: string;
  meetLink?: string;
}

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

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  dayOfWeek: number;
  isBooked?: boolean;
  isSelected?: boolean;
}

export interface ToastConfig {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  cancel?: React.ReactNode;
  duration?: number;
  position?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "top-center"
    | "bottom-center";
}
