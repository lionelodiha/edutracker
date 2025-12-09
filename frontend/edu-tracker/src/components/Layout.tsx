import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

const Layout = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
