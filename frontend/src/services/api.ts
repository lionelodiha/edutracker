import axios from 'axios';
import { Role } from '../../types';

// Toggle mock API with Vite env var
const useMocks = (import.meta as any)?.env?.VITE_MOCK_API === 'true';

// Real API instance (always defined)
const realApi = axios.create({ baseURL: 'http://localhost:4000/api' });
realApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// Mock API data and implementation
const demoUsers = {
  'admin@school.com': { id: 1, fullName: 'Principal Skinner', role: Role.ADMIN as Role },
  'teacher@school.com': { id: 2, fullName: 'Mrs. Krabappel', role: Role.TEACHER as Role },
  'student1@school.com': { id: 3, fullName: 'Bart Simpson', role: Role.STUDENT as Role },
  'student2@school.com': { id: 4, fullName: 'Lisa Simpson', role: Role.STUDENT as Role },
} as const;

const categories = [
  { id: 1, name: 'Assignment', weight: 10 },
  { id: 2, name: 'Test', weight: 20 },
  { id: 3, name: 'Project', weight: 10 },
  { id: 4, name: 'Exam', weight: 60 },
];

const classes = [ { id: 1, name: 'SS1 Green' }, { id: 2, name: 'SS1 Yellow' } ];
const subjects = [
  { id: 1, name: 'Mathematics', code: 'MTH101' },
  { id: 2, name: 'English Language', code: 'ENG101' },
  { id: 3, name: 'Biology', code: 'BIO101' },
  { id: 4, name: 'Physics', code: 'PHY101' },
];
let teacherIdSeq = 2;
const teachers = [
  { id: 1, user: { id: 2, fullName: 'Mrs. Krabappel', email: 'teacher@school.com' } },
];
let assignmentIdSeq = 2;
const assignments = [
  { id: 1, subject: subjects[0], classroom: classes[0], teacher: teachers[0] },
  { id: 2, subject: subjects[2], classroom: classes[0], teacher: teachers[0] },
];

const students = [
  {
    id: 101,
    userId: 1001,
    admissionNumber: 'ADM001',
    user: { id: 1001, email: 'student1@school.com', fullName: 'Bart Simpson', role: Role.STUDENT as Role },
    scores: [
      { id: 1, score: 8, categoryId: 1 },
      { id: 2, score: 16, categoryId: 2 },
      { id: 3, score: 52, categoryId: 4 },
    ],
  },
  {
    id: 102,
    userId: 1002,
    admissionNumber: 'ADM002',
    user: { id: 1002, email: 'student2@school.com', fullName: 'Lisa Simpson', role: Role.STUDENT as Role },
    scores: [
      { id: 4, score: 9, categoryId: 1 },
      { id: 5, score: 18, categoryId: 2 },
      { id: 6, score: 55, categoryId: 4 },
    ],
  },
];

const studentDashboard = {
  student: {
    id: 101,
    userId: 1001,
    admissionNumber: 'ADM001',
    user: { id: 1001, email: 'student1@school.com', fullName: 'Bart Simpson', role: Role.STUDENT as Role },
    classroom: { id: 1, name: 'SS1 Green' },
  },
  term: { id: 1, name: '1st Term', academicSession: '2024/2025', isCurrent: true },
  subjects: [
    {
      subjectId: 1,
      subjectName: 'Mathematics',
      subjectCode: 'MTH101',
      totalScore: 78,
      breakdown: [
        { category: 'Assignment', score: 8, max: 10 },
        { category: 'Test', score: 15, max: 20 },
        { category: 'Exam', score: 55, max: 60 },
      ],
      grade: 'A',
    },
    {
      subjectId: 2,
      subjectName: 'English Language',
      subjectCode: 'ENG101',
      totalScore: 64,
      breakdown: [
        { category: 'Assignment', score: 7, max: 10 },
        { category: 'Test', score: 12, max: 20 },
        { category: 'Exam', score: 45, max: 60 },
      ],
      grade: 'B',
    },
  ],
  overallAverage: 71,
};

type AxiosLikeResponse<T> = Promise<{ data: T }>;

const mockApi = {
  interceptors: { request: { use: () => {} } },
  get(url: string): AxiosLikeResponse<any> {
    const path = url.replace(/^https?:\/\/[^/]+\/api/, '');
    if (path === '/classes') { return Promise.resolve({ data: classes }); }
    if (path === '/admin/stats') {
      return Promise.resolve({ data: { teachers: teachers.length, students: students.length, classes: classes.length } });
    }
    if (path === '/admin/teachers') { return Promise.resolve({ data: teachers }); }
    if (path === '/admin/students') { return Promise.resolve({ data: students.map(s => ({ ...s, classroom: classes.find(c=>c.id===1) })) }); }
    if (path === '/admin/classes') { return Promise.resolve({ data: classes }); }
    if (path === '/admin/subjects') { return Promise.resolve({ data: subjects }); }
    if (path === '/admin/assignments') { return Promise.resolve({ data: assignments }); }
    if (path === '/teacher/assignments') {
      return Promise.resolve({ data: assignments });
    }
    const classMatch = path.match(/^\/teacher\/class\/(\d+)\/subject\/(\d+)$/);
    if (classMatch) {
      return Promise.resolve({ data: { students, categories, termId: 1 } });
    }
    if (path === '/student/dashboard') {
      return Promise.resolve({ data: studentDashboard });
    }
    if (path === '/me') {
      const userRaw = localStorage.getItem('user');
      const user = userRaw ? JSON.parse(userRaw) : null;
      return Promise.resolve({ data: user });
    }
    return Promise.resolve({ data: {} });
  },
  post(url: string, body?: any): AxiosLikeResponse<any> {
    const path = url.replace(/^https?:\/\/[^/]+\/api/, '');
    if (path === '/auth/login') {
      const email = body?.email || '';
      const base = (demoUsers as any)[email] || { id: 999, fullName: 'Demo User', role: Role.STUDENT as Role };
      const user = { id: base.id, email, fullName: base.fullName, role: base.role };
      return Promise.resolve({ data: { token: 'mock-token', user } });
    }
    if (path === '/auth/signup') {
      const email = body?.email || '';
      const role = body?.role || Role.STUDENT;
      const user = { id: Math.floor(Math.random()*10000), email, fullName: body?.fullName || email.split('@')[0], role };
      return Promise.resolve({ data: { token: 'mock-token', user } });
    }
    if (path === '/admin/teachers') {
      const id = ++teacherIdSeq;
      teachers.push({ id, user: { id: id+1000, fullName: body.fullName, email: body.email } });
      return Promise.resolve({ data: { ok: true } });
    }
    if (path === '/admin/classes') {
      const id = classes.length ? Math.max(...classes.map(c=>c.id))+1 : 1;
      classes.push({ id, name: body.name });
      return Promise.resolve({ data: { id, name: body.name } });
    }
    if (path === '/admin/subjects') {
      const id = subjects.length ? Math.max(...subjects.map(s=>s.id))+1 : 1;
      subjects.push({ id, name: body.name, code: body.code });
      return Promise.resolve({ data: { id, name: body.name, code: body.code } });
    }
    if (path === '/admin/students') {
      const id = students.length ? Math.max(...students.map(s=>s.id))+1 : 100;
      students.push({ id, userId: id+1000, admissionNumber: body.admissionNumber, user: { id: id+1000, email: body.email, fullName: body.fullName, role: Role.STUDENT as Role } });
      return Promise.resolve({ data: { ok: true } });
    }
    if (path === '/admin/enrollments') {
      return Promise.resolve({ data: { ok: true } });
    }
    if (path === '/admin/assignments') {
      const id = ++assignmentIdSeq;
      const teacher = teachers.find(t=>t.id===body.teacherId);
      const classroom = classes.find(c=>c.id===body.classroomId);
      const subject = subjects.find(s=>s.id===body.subjectId);
      assignments.push({ id, teacher, classroom, subject } as any);
      return Promise.resolve({ data: { ok: true } });
    }
    if (path === '/teacher/scores') {
      return Promise.resolve({ data: { ok: true } });
    }
    return Promise.resolve({ data: {} });
  },
} as const;

// Hybrid API: use real API; if network fails, transparently fall back to mocks
const api: any = (() => {
  if (useMocks) return mockApi;
  const methodNames = ['get', 'post', 'put', 'patch', 'delete'];
  const proxy = new Proxy(realApi as any, {
    get(target, prop, receiver) {
      if (methodNames.includes(String(prop))) {
        return async (...args: any[]) => {
          try {
            return await (target as any)[prop](...args);
          } catch (err: any) {
            // Network error: no response object
            if (!err || !err.response) {
              const fn = (mockApi as any)[prop];
              if (typeof fn === 'function') {
                return await fn(...args);
              }
            }
            throw err;
          }
        };
      }
      return Reflect.get(target, prop, receiver);
    },
  });
  return proxy;
})();

export default api;
