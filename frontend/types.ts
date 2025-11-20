export enum Role {
    ADMIN = 'ADMIN',
    TEACHER = 'TEACHER',
    STUDENT = 'STUDENT'
}

export interface User {
    id: number;
    email: string;
    fullName: string;
    role: Role;
}

export interface AuthState {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;
}

export interface Student {
  id: number;
  userId: number;
  admissionNumber: string;
  user: User;
  scores?: Score[];
}

export interface Score {
  id: number;
  score: number;
  categoryId: number;
  category?: { name: string, weight: number };
}

export interface Assignment {
    id: number;
    subject: { id: number, name: string, code: string };
    classroom: { id: number, name: string };
}