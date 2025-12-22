import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { Building2, Plus, LogOut } from 'lucide-react';

const DashboardHome = () => {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState<any[]>([]);
  const user = authService.getCurrentUser();

  useEffect(() => {
    const organizations = authService.getOrganizations();
    setOrgs(organizations);
  }, []);

  const handleSelectOrg = (orgId: string, role: string) => {
    authService.selectOrganization(orgId);
    navigate(`/dashboard/${role}`);
  };

  const handleLogout = () => {
    authService.logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Building2 className="w-8 h-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">EduTracker</h1>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-sm text-gray-600">Welcome, {user?.firstName}</span>
             <button onClick={handleLogout} className="text-gray-500 hover:text-red-600">
               <LogOut className="w-5 h-5" />
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Your Organizations</h2>
            <button 
                onClick={() => navigate('/pricing')}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
                <Plus className="w-5 h-5" />
                Create Organization
            </button>
        </div>

        {orgs.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Organizations Yet</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    You haven't joined or created any organizations yet. Get started by creating your own school or asking for an invite.
                </p>
                <button 
                    onClick={() => navigate('/pricing')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                    Create Organization
                </button>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orgs.map((org) => (
                    <div 
                        key={org.organizationId}
                        onClick={() => handleSelectOrg(org.organizationId, org.role)}
                        className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 cursor-pointer transition-all group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                                <Building2 className="w-6 h-6 text-blue-600" />
                            </div>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                org.role === 'admin' ? 'bg-purple-50 text-purple-600' :
                                org.role === 'teacher' ? 'bg-green-50 text-green-600' :
                                'bg-blue-50 text-blue-600'
                            }`}>
                                {org.role.charAt(0).toUpperCase() + org.role.slice(1)}
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{org.name}</h3>
                        <p className="text-sm text-gray-500">Click to access dashboard</p>
                    </div>
                ))}
            </div>
        )}
      </main>
    </div>
  );
};

export default DashboardHome;
