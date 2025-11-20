import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Role } from '../../types';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [role, setRole] = useState<Role>(Role.TEACHER);
  const [classes, setClasses] = useState<any[]>([]);
  const [classroomId, setClassroomId] = useState<string>('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const endpoint = isSignup ? '/auth/signup' : '/auth/login';
      const body: any = isSignup ? { email, password, fullName: email.split('@')[0], role } : { email, password };
      if (isSignup && role === Role.STUDENT) {
        body.classroomId = Number(classroomId);
        body.admissionNumber = admissionNumber || 'ADM' + Math.floor(Math.random() * 900 + 100);
      }
      const res = await api.post(endpoint, body);
      const { token, user } = res.data;
      login(token, user);
      if (user.role === Role.ADMIN) navigate('/admin');
      else if (user.role === Role.TEACHER) navigate('/teacher');
      else if (user.role === Role.STUDENT) navigate('/student');
    } catch (err) {
      setError('Action failed, please check details and try again');
    }
  };

  useEffect(() => {
    if (isSignup && role === Role.STUDENT) {
      api.get('/classes').then((res) => setClasses(res.data)).catch(() => setClasses([]));
    }
  }, [isSignup, role]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 transform transition-all hover:scale-[1.01]">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">{isSignup ? 'Create Account' : 'Welcome Back'}</h2>
          <p className="text-gray-500 mt-2">{isSignup ? 'Sign up to EduTrack' : 'Sign in to EduTrack'}</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 text-sm rounded">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{isSignup ? 'Create an account' : 'Use your credentials'}</span>
            <button type="button" className="text-indigo-600 text-sm hover:underline" onClick={() => setIsSignup(!isSignup)}>
              {isSignup ? 'Have an account? Sign in' : 'New user? Sign up'}
            </button>
          </div>

          {isSignup && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                <option value={Role.TEACHER}>Teacher</option>
                <option value={Role.STUDENT}>Student</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
              placeholder="you@school.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {isSignup && role === Role.STUDENT && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                <select
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  value={classroomId}
                  onChange={(e) => setClassroomId(e.target.value)}
                  required
                >
                  <option value="">Select Class</option>
                  {classes.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admission Number</label>
                <input
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  value={admissionNumber}
                  onChange={(e) => setAdmissionNumber(e.target.value)}
                  placeholder="ADM001"
                />
              </div>
            </div>
          )}

          <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 transition-colors">
            {isSignup ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-400">
          <p>Demo Credentials:</p>
          <p>Admin: admin@school.com / password123</p>
          <p>Teacher: teacher@school.com / password123</p>
          <p>Student: student1@school.com / password123</p>
        </div>
      </div>
    </div>
  );
};

