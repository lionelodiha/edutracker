import { useEffect, useState } from 'react';
import { School, Users, CheckCircle } from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';
import DashboardLayout from '../components/DashboardLayout';
import { authService } from '../services/auth.service';

interface OrganizationStats {
  id: string;
  name: string;
  subscriptionStatus: string;
  createdAt: string;
  userCount: number;
}

interface DashboardStats {
  totalOrganizations: number;
  totalUsers: number;
  activeSubscriptions: number;
}

const MasterAdminDashboard = () => {
  const [organizations, setOrganizations] = useState<OrganizationStats[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [orgRes, statsRes] = await Promise.all([
            fetch('http://localhost:5270/api/masteradmin/organizations'),
            fetch('http://localhost:5270/api/masteradmin/stats')
        ]);

        if (orgRes.ok && statsRes.ok) {
            setOrganizations(await orgRes.json());
            setStats(await statsRes.json());
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        // Add a small delay to show off the cool loading animation
        setTimeout(() => setLoading(false), 800);
      }
    };

    fetchData();
  }, []);

  if (loading) return <LoadingScreen message="Loading Master Dashboard..." />;

  const user = authService.getCurrentUser();
  const orgName = authService.getOrganizationName();

  return (
    <DashboardLayout role="master_admin" userName={user?.firstName || 'Master Admin'} organizationName={orgName}>
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Master Admin Overview</h1>
          <p className="text-slate-500">Manage all registered schools and organizations</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <School className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Schools</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats?.totalOrganizations || 0}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Users</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats?.totalUsers || 0}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Active Subscriptions</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats?.activeSubscriptions || 0}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Schools List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Registered Schools</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">School Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Users</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Joined Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {organizations.map((org) => (
                <tr key={org.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-slate-100 rounded-full flex items-center justify-center">
                        <School className="h-5 w-5 text-slate-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900">{org.name}</div>
                        <div className="text-sm text-slate-500">ID: {org.id.substring(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${org.subscriptionStatus === 'active' ? 'bg-green-100 text-green-800' : 
                        org.subscriptionStatus === 'trial' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                      {org.subscriptionStatus.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {org.userCount} users
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-indigo-600 hover:text-indigo-900">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
};

export default MasterAdminDashboard;
