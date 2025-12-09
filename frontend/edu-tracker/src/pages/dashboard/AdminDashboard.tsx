import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingScreen from '../../components/LoadingScreen';
import { Users, Server, Activity, Shield, AlertTriangle, Check, X, Trash2, UserPlus, Loader2 } from 'lucide-react';
import { authService } from '../../services/auth.service';
import type { User } from '../../types/auth';

const AdminDashboard = () => {
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    password: '',
    role: 'student' as const
  });

  // Invite System State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('student');
  const [generatedLink, setGeneratedLink] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  const handleCreateInvite = async (e: React.FormEvent) => {
      e.preventDefault();
      setInviteLoading(true);
      setGeneratedLink('');
      try {
          const result = await authService.createInvitation(inviteEmail, inviteRole);
          setGeneratedLink(`${window.location.origin}${result.inviteLink}`);
      } catch (err) {
          alert(err instanceof Error ? err.message : 'Failed to create invite');
      } finally {
          setInviteLoading(false);
      }
  };

  const fetchAllData = async () => {
    try {
      const [pending, all] = await Promise.all([
        authService.getPendingUsers(),
        authService.getAllUsers()
      ]);
      setPendingUsers(pending);
      setAllUsers(all);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Add a minimum loading time to show off the animation
    const minLoadTime = new Promise(resolve => setTimeout(resolve, 1000));
    Promise.all([fetchAllData(), minLoadTime]);
  }, []);

  const handleStatusUpdate = async (userId: string, status: 'active' | 'rejected') => {
    try {
      await authService.updateUserStatus(userId, status);
      await fetchAllData();
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await authService.deleteUser(userId);
      await fetchAllData();
    } catch (error) {
      console.error('Failed to delete user', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await authService.createUser({
        ...newUser,
        role: newUser.role as any
      });
      setShowCreateModal(false);
      setNewUser({ firstName: '', lastName: '', middleName: '', email: '', password: '', role: 'student' });
      await fetchAllData();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <LoadingScreen message="Loading Admin Dashboard..." />;

  const user = authService.getCurrentUser();
  const orgName = authService.getOrganizationName();

  return (
    <DashboardLayout role="admin" userName={user?.firstName || "Administrator"} organizationName={orgName}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* System Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-green-500 bg-green-50 px-2 py-1 rounded-full">+12%</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">2,543</h3>
            <p className="text-sm text-gray-500">Total Users</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-purple-50 rounded-xl">
                <Server className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-xs font-medium text-green-500 bg-green-50 px-2 py-1 rounded-full">99.9%</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Online</h3>
            <p className="text-sm text-gray-500">System Status</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-orange-50 rounded-xl">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-xs font-medium text-orange-500 bg-orange-50 px-2 py-1 rounded-full">High</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">1.2k</h3>
            <p className="text-sm text-gray-500">Active Sessions</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-red-50 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded-full">3</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Alerts</h3>
            <p className="text-sm text-gray-500">System Issues</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Management Table */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Pending Approvals</h3>
              <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                {pendingUsers.length} Pending
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                    <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                    <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500">Loading requests...</td>
                    </tr>
                  ) : pendingUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500">No pending approvals</td>
                    </tr>
                  ) : (
                    pendingUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                              {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs font-bold text-gray-500">{user.firstName[0]}</span>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            user.role === 'teacher' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-orange-50 text-orange-600">
                            Pending
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleStatusUpdate(user.id, 'active')}
                              className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Approve"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleStatusUpdate(user.id, 'rejected')}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Reject"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invite User Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Invite New User</h3>
              <div className="p-2 bg-blue-50 rounded-lg">
                <UserPlus className="w-5 h-5 text-blue-600" />
              </div>
            </div>

            <form onSubmit={handleCreateInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={inviteLoading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {inviteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Invite Link'}
              </button>
            </form>

            {generatedLink && (
              <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-xl">
                <p className="text-sm text-green-800 font-medium mb-2">Invitation Link Generated:</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedLink}
                    className="flex-1 bg-white px-3 py-2 rounded border border-green-200 text-sm text-gray-600 select-all"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(generatedLink)}
                    className="p-2 bg-white border border-green-200 rounded hover:bg-green-50 text-green-600 transition-colors"
                    title="Copy to clipboard"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-green-600 mt-2">
                  Link expires in 7 days. Only valid for {inviteEmail}.
                </p>
              </div>
            )}
          </div>

          {/* System Health / Logs */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6">System Health</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">Server Load</span>
                  <span className="text-gray-500">45%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full w-[45%]"></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">Memory Usage</span>
                  <span className="text-gray-500">72%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full w-[72%]"></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">Storage</span>
                  <span className="text-gray-500">28%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full w-[28%]"></div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <h4 className="text-sm font-bold text-gray-900 mb-4">Security Logs</h4>
                <div className="space-y-3">
                  {[
                     { msg: 'New admin login detected', time: '10:42 AM', type: 'info' },
                     { msg: 'Failed login attempt (IP: 192.168.1.5)', time: '09:15 AM', type: 'alert' },
                  ].map((log, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <Shield className={`w-4 h-4 ${log.type === 'alert' ? 'text-red-500' : 'text-blue-500'}`} />
                      <span className="text-gray-600 flex-1">{log.msg}</span>
                      <span className="text-gray-400 text-xs">{log.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Management Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">User Management</h3>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-[#1E293B] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#334155] transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add User
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                  <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">No users found</td>
                  </tr>
                ) : (
                  allUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-bold text-gray-500">{user.firstName[0]}</span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          user.role === 'teacher' ? 'bg-purple-50 text-purple-600' : 
                          user.role === 'admin' ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          user.status === 'active' ? 'bg-green-50 text-green-600' : 
                          user.status === 'pending' ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-4">
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Create New User</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={newUser.firstName}
                    onChange={e => setNewUser({...newUser, firstName: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white text-[#1E293B] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E293B]"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={newUser.lastName}
                    onChange={e => setNewUser({...newUser, lastName: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white text-[#1E293B] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E293B]"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                <input
                  type="text"
                  value={newUser.middleName}
                  onChange={e => setNewUser({...newUser, middleName: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white text-[#1E293B] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E293B]"
                  placeholder=""
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white text-[#1E293B] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E293B]"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={e => setNewUser({...newUser, password: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white text-[#1E293B] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E293B]"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={e => setNewUser({...newUser, role: e.target.value as any})}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#1E293B]"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-[#1E293B] text-white rounded-lg hover:bg-[#334155] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;
