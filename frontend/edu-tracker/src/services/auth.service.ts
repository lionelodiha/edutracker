import type { AuthResponse, LoginRequest, SignupRequest, User, UserStatus } from '../types/auth';

const STORAGE_KEY = 'edu_tracker_auth';
const DEMO_KEY = 'edu_tracker_demo';
const DEMO_USERS_KEY = 'edu_tracker_demo_users';
const API_URL = 'http://localhost:5270/api';

class AuthService {
  private getStoredAuth(): AuthResponse | null {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  private setStoredAuth(auth: AuthResponse) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  }

  // Demo Mode Helpers
  isDemoMode(): boolean {
    return localStorage.getItem(DEMO_KEY) === 'true';
  }

  enableDemoMode() {
    const demoUser: User = {
      id: 'demo-admin',
      email: 'demo@edutracker.com',
      firstName: 'Demo',
      lastName: 'Administrator',
      role: 'admin',
      status: 'active',
      avatarUrl: 'https://ui-avatars.com/api/?name=Demo+Admin',
      organizationId: 'demo-org'
    };
    this.setStoredAuth({ user: demoUser, token: 'demo-token' });
    localStorage.setItem(DEMO_KEY, 'true');
    
    // Initialize demo data
    if (!localStorage.getItem(DEMO_USERS_KEY)) {
        const initialDemoUsers: User[] = [
            demoUser,
            { id: 'demo-student', email: 'student@demo.com', firstName: 'Demo', lastName: 'Student', role: 'student', status: 'active', organizationId: 'demo-org', avatarUrl: 'https://ui-avatars.com/api/?name=Demo+Student' },
            { id: 'demo-teacher', email: 'teacher@demo.com', firstName: 'Demo', lastName: 'Teacher', role: 'teacher', status: 'active', organizationId: 'demo-org', avatarUrl: 'https://ui-avatars.com/api/?name=Demo+Teacher' }
        ];
        localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(initialDemoUsers));
    }
  }

  disableDemoMode() {
    localStorage.removeItem(DEMO_KEY);
    localStorage.removeItem(DEMO_USERS_KEY);
    localStorage.removeItem(STORAGE_KEY);
  }

  private getDemoUsers(): User[] {
      return JSON.parse(localStorage.getItem(DEMO_USERS_KEY) || '[]');
  }

  private setDemoUsers(users: User[]) {
      localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users));
  }

  isAuthenticated(): boolean {
    return !!this.getStoredAuth();
  }


  getCurrentUser(): User | null {
    const auth = this.getStoredAuth();
    return auth ? auth.user : null;
  }

  getOrganizationName(): string | undefined {
    const auth = this.getStoredAuth();
    return auth?.organizationName;
  }

  getToken(): string | null {
    const auth = this.getStoredAuth();
    return auth ? auth.token : null;
  }

  async logout() {
    this.disableDemoMode();
    localStorage.removeItem(STORAGE_KEY);
    window.location.href = '/login';
  }

  async createInvitation(email: string, role: string): Promise<any> {
    const auth = this.getStoredAuth();
    const token = auth?.token;
    const user = auth?.user;
    
    if (!token || !user?.organizationId) throw new Error('Not authenticated or no organization');

    const response = await fetch(`${API_URL}/invitations?organizationId=${user.organizationId}`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${token}` // Backend doesn't check auth yet, but good practice
        },
        body: JSON.stringify({ email, role })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create invitation');
    }

    return response.json();
  }

  async validateInvitation(token: string): Promise<any> {
    const response = await fetch(`${API_URL}/invitations/${token}`);
    if (!response.ok) {
        throw new Error('Invalid or expired invitation');
    }
    return response.json();
  }

  async signupInvite(data: any): Promise<AuthResponse> {
      const response = await fetch(`${API_URL}/auth/signup-invite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
      });

      if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Signup failed');
      }

      const result = await response.json();
      if (result.token) {
          this.setStoredAuth(result);
      }
      return result;
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    if (this.isDemoMode()) {
        // Should not happen usually, but just in case
        throw new Error('Already in demo mode');
    }
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
          emailOrUsername: credentials.emailOrUsername,
          password: credentials.password
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    this.setStoredAuth(data);
    return data;
  }

  async signup(data: SignupRequest): Promise<void> {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Signup failed');
    }
  }

  // Admin Methods
  async getPendingUsers(): Promise<User[]> {
    if (this.isDemoMode()) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return this.getDemoUsers().filter(u => u.status === 'pending');
    }

    const user = this.getCurrentUser();
    if (!user?.organizationId) return []; // Or throw error
    
    const response = await fetch(`${API_URL}/users/pending?organizationId=${user.organizationId}`);
    if (!response.ok) throw new Error('Failed to fetch pending users');
    return response.json();
  }

  async getAllUsers(): Promise<User[]> {
    if (this.isDemoMode()) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return this.getDemoUsers().filter(u => u.role !== 'admin');
    }

    const user = this.getCurrentUser();
    if (!user?.organizationId) return [];

    const response = await fetch(`${API_URL}/users?organizationId=${user.organizationId}`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  }

  async updateUserStatus(userId: string, status: UserStatus): Promise<void> {
    if (this.isDemoMode()) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const users = this.getDemoUsers();
        const user = users.find(u => u.id === userId);
        if (user) {
            user.status = status;
            this.setDemoUsers(users);
        }
        return;
    }

    const user = this.getCurrentUser();
    if (!user?.organizationId) throw new Error('No organization context');

    const response = await fetch(`${API_URL}/users/${userId}/status?organizationId=${user.organizationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) throw new Error('Failed to update status');
  }

  async createUser(data: SignupRequest & { status?: UserStatus }): Promise<void> {
    if (this.isDemoMode()) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const users = this.getDemoUsers();
        const newUser: User = {
            id: Math.random().toString(36).substr(2, 9),
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            middleName: data.middleName,
            role: data.role,
            status: data.status || 'pending',
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.firstName + ' ' + data.lastName)}`,
            organizationId: 'demo-org'
        };
        users.push(newUser);
        this.setDemoUsers(users);
        return;
    }

    const user = this.getCurrentUser();
    if (!user?.organizationId) throw new Error('No organization context');

    const response = await fetch(`${API_URL}/users?organizationId=${user.organizationId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
          ...data,
          username: data.username || data.email.split('@')[0] + Math.floor(1000 + Math.random() * 9000)
      }),
    });

    if (!response.ok) {
       const error = await response.json();
       throw new Error(error.message || 'Failed to create user');
    }
  }

  async deleteUser(userId: string): Promise<void> {
    if (this.isDemoMode()) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const users = this.getDemoUsers().filter(u => u.id !== userId);
        this.setDemoUsers(users);
        return;
    }

    const user = this.getCurrentUser();
    if (!user?.organizationId) throw new Error('No organization context');

    const response = await fetch(`${API_URL}/users/${userId}?organizationId=${user.organizationId}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to delete user');
  }
}

export const authService = new AuthService();
