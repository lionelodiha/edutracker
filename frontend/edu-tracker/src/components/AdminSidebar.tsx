import { useState, useEffect } from 'react';
import { Home, Users, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const AdminSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved) {
      setCollapsed(JSON.parse(saved));
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'Students', path: '/admin/students' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  return (
    <div className={`flex flex-col h-screen bg-gray-800 text-white transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {!collapsed && <span className="text-xl font-bold">EduTrack</span>}
        <button onClick={toggleSidebar} className="p-1 rounded hover:bg-gray-700">
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
      <nav className="flex-1 p-2 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center p-2 rounded hover:bg-gray-700 ${location.pathname === item.path ? 'bg-gray-700' : ''}`}
          >
            <item.icon size={20} />
            {!collapsed && <span className="ml-3">{item.label}</span>}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default AdminSidebar;
