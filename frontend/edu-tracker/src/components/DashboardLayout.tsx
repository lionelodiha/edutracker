import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { 
  BookOpen, 
  LayoutDashboard, 
  Users, 
  BookOpenCheck, 
  MessageSquare, 
  Settings, 
  LogOut,
  Bell,
  Search,
  Menu,
  School
} from 'lucide-react';

interface SidebarItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'student' | 'teacher' | 'admin' | 'master_admin';
  userName?: string;
  organizationName?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, role, userName = 'User', organizationName }) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  // Define menu items based on role
  const getMenuItems = (): SidebarItem[] => {
    const common = [
      { icon: LayoutDashboard, label: 'Dashboard', path: `/dashboard/${role}` },
    ];

    if (role === 'teacher') {
      return [
        ...common,
        { icon: BookOpen, label: 'Courses', path: '/courses' },
        { icon: Users, label: 'Students', path: '/students' },
        { icon: BookOpenCheck, label: 'Assignments', path: '/assignments' },
        { icon: MessageSquare, label: 'Messages', path: '/messages' },
      ];
    } else if (role === 'student') {
      return [
        ...common,
        { icon: BookOpen, label: 'My Courses', path: '/my-courses' },
        { icon: BookOpenCheck, label: 'Assignments', path: '/my-assignments' },
        { icon: MessageSquare, label: 'Messages', path: '/messages' },
      ];
    } else if (role === 'master_admin') {
      return [
        ...common,
        { icon: School, label: 'All Schools', path: '/dashboard/master_admin' },
        { icon: Users, label: 'Global Users', path: '/admin/users' },
        { icon: Settings, label: 'System Config', path: '/admin/system' },
      ];
    } else {
      // Admin (School Admin)
      return [
        ...common,
        { icon: Users, label: 'Manage Users', path: '/admin/users' },
        { icon: BookOpen, label: 'All Courses', path: '/admin/courses' },
        { icon: Settings, label: 'System', path: '/admin/system' },
      ];
    }
  };

  const menuItems = getMenuItems();

  const handleLogout = () => {
    authService.logout();
  };

  return (
    <div className="flex h-screen bg-[#F3F4F6]">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-[#1E293B] text-white transition-all duration-300 ease-in-out flex flex-col fixed h-full z-30`}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-lg">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-wide">EduTracker</span>
              {organizationName && (
                <span className="text-xs text-slate-400 font-medium truncate max-w-[140px]" title={organizationName}>
                  {organizationName}
                </span>
              )}
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-white/10 text-white' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {isSidebarOpen && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-700 space-y-2">
          <button className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg w-full transition-colors">
            <Settings className="w-5 h-5" />
            {isSidebarOpen && <span>Settings</span>}
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg w-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${isSidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold text-gray-800">
              Welcome back, {userName}!
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-10 pr-4 py-2 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-[#1E293B]/20 outline-none w-64"
              />
            </div>
            
            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500 capitalize">{role}</p>
              </div>
              <img 
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
                alt="Profile" 
                className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white shadow-sm"
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
