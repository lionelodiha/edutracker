import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Loader2 } from 'lucide-react';
import { authService } from '../services/auth.service';

type AuthTab = 'login' | 'signup';

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<any>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) {
      setLoading(true);
      authService.validateInvitation(token)
        .then(data => {
          setInvitation(data);
          setActiveTab('signup');
          setSignupData(prev => ({
            ...prev,
            email: data.email,
          }));
        })
        .catch(err => {
          setError(err instanceof Error ? err.message : 'Invalid invitation');
        })
        .finally(() => setLoading(false));
    }
  }, [location]);

  // Login Form Data
  const [loginData, setLoginData] = useState({
    emailOrUsername: '',
    password: '',
    rememberMe: false
  });

  // Signup Form Data
  const [signupData, setSignupData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setLoginData(prev => ({
      ...prev,
      [e.target.name]: value
    }));
  };

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignupData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await authService.login({
        emailOrUsername: loginData.emailOrUsername,
        password: loginData.password
      });
      navigate(`/dashboard/${response.user.role}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (signupData.password !== signupData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      if (invitation) {
          await authService.signupInvite({
              token: invitation.token,
              password: signupData.password,
              firstName: signupData.firstName,
              lastName: signupData.lastName,
              middleName: signupData.middleName,
              username: signupData.username || signupData.email.split('@')[0] + Math.floor(1000 + Math.random() * 9000),
          });
          // Assuming signupInvite returns AuthResponse with token if successful
          // We redirect to dashboard
          navigate(`/dashboard/${invitation.role}`);
      } else {
          await authService.signup({
            email: signupData.email,
            password: signupData.password,
            firstName: signupData.firstName,
            lastName: signupData.lastName,
            middleName: signupData.middleName,
            username: signupData.username || signupData.email.split('@')[0] + Math.floor(1000 + Math.random() * 9000), // Fallback generation if empty
            role: 'admin' // Default to school owner
          });
          setSuccess("Account created successfully! Please login.");
          setActiveTab('login');
          // Pre-fill login email if available
          setLoginData(prev => ({ ...prev, emailOrUsername: signupData.email }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Brand */}
      <div className="hidden lg:flex w-1/2 bg-[#1E293B] items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent"></div>
        <div className="text-center z-10">
          <div className="bg-white/10 p-4 rounded-2xl inline-flex mb-6 backdrop-blur-sm">
            <BookOpen className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">EduTracker</h1>
          <p className="text-blue-100 text-xl max-w-md mx-auto">
            Manage your school, students, and curriculum with ease.
          </p>
        </div>
        
        {/* Decorative circles */}
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Right Side - Auth Forms */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="bg-[#1E293B] p-2 rounded-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#1E293B]">EduTracker</span>
          </div>

          {/* Tabs */}
          {!invitation && (
          <div className="flex bg-gray-100 p-1 rounded-xl mb-8">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'login'
                  ? 'bg-[#1E293B] text-white shadow-md'
                  : 'text-gray-500 hover:text-[#1E293B]'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setActiveTab('signup')}
              className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'signup'
                  ? 'bg-[#1E293B] text-white shadow-md'
                  : 'text-gray-500 hover:text-[#1E293B]'
              }`}
            >
              Sign Up
            </button>
          </div>
          )}

          {invitation && (
            <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-700 rounded-r-lg text-sm">
              <p className="font-bold text-lg mb-1">Invitation to Join</p>
              <p className="font-semibold">{invitation.organizationName}</p>
              <p>Role: <span className="capitalize">{invitation.role}</span></p>
              <p className="mt-2 text-xs text-blue-600">Please complete your registration below.</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-r-lg text-sm">
              {success}
            </div>
          )}

          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email or Username</label>
                <input
                  type="text"
                  name="emailOrUsername"
                  value={loginData.emailOrUsername}
                  onChange={handleLoginChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-[#1E293B] placeholder-gray-400 focus:border-[#1E293B] focus:ring-1 focus:ring-[#1E293B] outline-none transition-all"
                  placeholder="Enter email or username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-[#1E293B] placeholder-gray-400 focus:border-[#1E293B] focus:ring-1 focus:ring-[#1E293B] outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={loginData.rememberMe}
                    onChange={handleLoginChange}
                    className="w-4 h-4 rounded border-gray-300 text-[#1E293B] focus:ring-[#1E293B]"
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <a href="#" className="text-sm text-[#1E293B] font-semibold hover:underline">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1E293B] text-white py-3.5 rounded-lg font-bold hover:bg-[#334155] transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={signupData.firstName}
                    onChange={handleSignupChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-[#1E293B] placeholder-gray-400 focus:border-[#1E293B] focus:ring-1 focus:ring-[#1E293B] outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={signupData.lastName}
                    onChange={handleSignupChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-[#1E293B] placeholder-gray-400 focus:border-[#1E293B] focus:ring-1 focus:ring-[#1E293B] outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name (Optional)</label>
                <input
                  type="text"
                  name="middleName"
                  value={signupData.middleName}
                  onChange={handleSignupChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-[#1E293B] placeholder-gray-400 focus:border-[#1E293B] focus:ring-1 focus:ring-[#1E293B] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username (Optional)</label>
                <input
                  type="text"
                  name="username"
                  value={signupData.username}
                  onChange={handleSignupChange}
                  placeholder="Auto-generated if empty"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-[#1E293B] placeholder-gray-400 focus:border-[#1E293B] focus:ring-1 focus:ring-[#1E293B] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={signupData.email}
                  onChange={handleSignupChange}
                  required
                  readOnly={!!invitation}
                  className={`w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-[#1E293B] placeholder-gray-400 focus:border-[#1E293B] focus:ring-1 focus:ring-[#1E293B] outline-none transition-all ${invitation ? 'opacity-70 cursor-not-allowed' : ''}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={signupData.password}
                    onChange={handleSignupChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-[#1E293B] placeholder-gray-400 focus:border-[#1E293B] focus:ring-1 focus:ring-[#1E293B] outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={signupData.confirmPassword}
                    onChange={handleSignupChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-[#1E293B] placeholder-gray-400 focus:border-[#1E293B] focus:ring-1 focus:ring-[#1E293B] outline-none transition-all"
                  />
                </div>
              </div>

              <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1E293B] text-white py-3.5 rounded-lg font-bold hover:bg-[#334155] transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
          </button>
        </form>
      )}

      <div className="mt-8 pt-6 border-t border-gray-100 text-center">
        <p className="text-gray-600 mb-2">Want to register your school?</p>
        <a 
          href="/pricing" 
          className="text-[#1E293B] font-bold hover:underline flex items-center justify-center gap-2"
        >
          Register Organization <BookOpen className="w-4 h-4" />
        </a>
      </div>
    </div>
  </div>
</div>
  );
};

export default Auth;
