import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, DoorOpen, CalendarDays, Home, Users, Settings, LogOut, FileText } from 'lucide-react';
import { User } from '../../utils/dataManager';

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('ECABINET_AUTH_USER');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('ECABINET_AUTH_USER');
    window.dispatchEvent(new Event('auth-change'));
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin' 
        ? 'bg-slate-800 text-white shadow-lg shadow-slate-900/50' 
        : 'text-slate-400 hover:bg-slate-800/50 hover:text-white';
    }
    return location.pathname.startsWith(path) 
      ? 'bg-slate-800 text-white shadow-lg shadow-slate-900/50' 
      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white';
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-20">
        <div className="p-6 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
              A
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight leading-none">Admin Panel</span>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1">Ecabinet System</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Tổng quan
          </div>
          <Link to="/admin" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive('/admin')}`}>
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
          
          <div className="px-4 py-2 mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Quản lý
          </div>
          <Link to="/admin/rooms" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive('/admin/rooms')}`}>
            <DoorOpen size={20} />
            Room Manager
          </Link>
          <Link to="/admin/bookings" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive('/admin/bookings')}`}>
            <CalendarDays size={20} />
            Booking Manager
          </Link>
          <Link to="/admin/users" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive('/admin/users')}`}>
            <Users size={20} />
            User Manager
          </Link>
          <Link to="/admin/documents" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive('/admin/documents')}`}>
            <FileText size={20} />
            Document Manager
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all">
            <Home size={20} />
            Về trang chủ
          </Link>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={20} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50 relative">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
            <h1 className="text-xl font-black text-slate-800 tracking-tight">
                {location.pathname === '/admin' && 'Dashboard Overview'}
                {location.pathname.startsWith('/admin/rooms') && 'Room Management'}
                {location.pathname.startsWith('/admin/bookings') && 'Booking Management'}
                {location.pathname.startsWith('/admin/users') && 'User Management'}
                {location.pathname.startsWith('/admin/documents') && 'Document Management'}
            </h1>
            <div className="flex items-center gap-4">
                <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                    <Settings size={20} />
                </button>
                <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                    <div className="text-right hidden sm:block">
                        <div className="text-sm font-bold text-slate-700">{user?.name || 'Admin User'}</div>
                        <div className="text-[10px] font-medium text-slate-400 uppercase">{user?.role || 'System Administrator'}</div>
                    </div>
                    <div className={`h-9 w-9 rounded-full ${user?.avatarColor || 'bg-gradient-to-br from-slate-700 to-slate-900'} flex items-center justify-center text-xs font-bold text-white shadow-md ring-2 ring-white`}>
                        {user?.name?.charAt(0) || 'A'}
                    </div>
                </div>
            </div>
        </header>
        <div className="p-8 w-full">
            <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
