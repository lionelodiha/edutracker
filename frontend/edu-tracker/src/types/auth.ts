export type UserRole = 'student' | 'teacher' | 'admin' | 'master_admin';
export type UserStatus = 'active' | 'pending' | 'rejected';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  username?: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  organizationId?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  organizationName?: string;
}

export interface LoginRequest {
  emailOrUsername: string;
  password: string;
  role?: UserRole;
}

export interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  username?: string;
  role: UserRole;
  status?: UserStatus;
}
