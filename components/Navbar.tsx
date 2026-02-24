import React, { useState, useEffect } from 'react';
import { Menu, X, FolderOpen, CalendarDays, CreditCard, Building2, ChevronDown, Users, LogOut, User as UserIcon } from 'lucide-react';
import { getAllUnits, getCurrentUnitId, setCurrentUnitId, initData, User } from '../utils/dataManager';
import { useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUnitMenu, setShowUnitMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentUnitName, setCurrentUnitName] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  
  // Load data on mount
  useEffect(() => {
    initData();
    const units = getAllUnits();
    const currentId = getCurrentUnitId();
    const current = units.find(u => u.id === currentId);
    setCurrentUnitName(current ? current.name : 'Chọn đơn vị');

    const storedUser = localStorage.getItem('ECABINET_AUTH_USER');
    if (storedUser) {
        setUser(JSON.parse(storedUser));
    }
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleScroll = (e: React.MouseEvent<HTMLElement>, id: string) => {
    e.preventDefault();
    setIsOpen(false);
    
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 90; 
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      
      if (window.history.pushState) {
        window.history.pushState(null, '', `#${id}`);
      }
    }
  };

  const handleSwitchUnit = (unitId: string) => {
      setCurrentUnitId(unitId);
      setShowUnitMenu(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('ECABINET_AUTH_USER');
    window.dispatchEvent(new Event('auth-change'));
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-900/10 bg-white/70 backdrop-blur-xl">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex h-20 items-center justify-between gap-4">
          <a 
            href="#top" 
            onClick={(e) => handleScroll(e, 'top')}
            className="flex items-center gap-3 font-bold tracking-tight text-slate-900 shrink-0"
          >
            <div className="h-9 w-9 rounded-xl border border-white/60 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.85),rgba(255,255,255,0)_60%),linear-gradient(135deg,#0ea5a4,#2563eb)] shadow-[0_10px_26px_rgba(14,165,164,0.25)]"></div>
            <span className="text-lg hidden sm:inline-block">EcabinetCS</span>
            <span className="text-lg sm:hidden">EcabinetCS</span>
          </a>

          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-sm font-semibold text-slate-700/75">
            <a href="#documents" onClick={(e) => {
                const storedUser = localStorage.getItem('ECABINET_AUTH_USER');
                if (storedUser && JSON.parse(storedUser).role !== 'Admin') {
                    e.preventDefault();
                    alert("Chức năng tạm khóa cho tài khoản người dùng.");
                    return;
                }
                handleScroll(e, 'documents');
            }} className="group flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-slate-900/5 hover:text-teal-700 transition-all">
               <FolderOpen size={16} className="text-slate-400 group-hover:text-teal-600 transition-colors" />
               Kho tài liệu
            </a>
            <a href="#calendar" onClick={(e) => handleScroll(e, 'calendar')} className="group flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-slate-900/5 hover:text-teal-700 transition-all">
               <CalendarDays size={16} className="text-slate-400 group-hover:text-teal-600 transition-colors" />
               Lịch cuộc họp
            </a>
            <a href="#users" onClick={(e) => {
                const storedUser = localStorage.getItem('ECABINET_AUTH_USER');
                if (storedUser && JSON.parse(storedUser).role !== 'Admin') {
                    e.preventDefault();
                    alert("Chức năng tạm khóa cho tài khoản người dùng.");
                    return;
                }
                handleScroll(e, 'users');
            }} className="group flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-slate-900/5 hover:text-teal-700 transition-all">
               <Users size={16} className="text-slate-400 group-hover:text-teal-600 transition-colors" />
               Quản lý nhân sự
            </a>
            <a href="#pricing" onClick={(e) => {
                const storedUser = localStorage.getItem('ECABINET_AUTH_USER');
                if (storedUser && JSON.parse(storedUser).role !== 'Admin') {
                    e.preventDefault();
                    alert("Chức năng tạm khóa cho tài khoản người dùng.");
                    return;
                }
                handleScroll(e, 'pricing');
            }} className="group flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-slate-900/5 hover:text-teal-700 transition-all">
               <CreditCard size={16} className="text-slate-400 group-hover:text-teal-600 transition-colors" />
               Bảng giá
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-3 shrink-0">
             {/* Unit Switcher */}
             <div className="relative">
                <button 
                    onClick={() => {
                        if (user?.role !== 'Admin') {
                            alert("Bạn không có quyền chuyển đổi đơn vị.");
                            return;
                        }
                        setShowUnitMenu(!showUnitMenu);
                    }}
                    className={`flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition-all border border-slate-200 ${user?.role !== 'Admin' ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                    <Building2 size={14} className="text-teal-600" />
                    <span className="max-w-[150px] truncate">{currentUnitName}</span>
                    <ChevronDown size={14} />
                </button>

                {showUnitMenu && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                        <div className="bg-slate-50 px-4 py-2 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100">
                            Chuyển đổi đơn vị
                        </div>
                        <div className="p-1">
                            {getAllUnits().map(unit => (
                                <button
                                    key={unit.id}
                                    onClick={() => handleSwitchUnit(unit.id)}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${getCurrentUnitId() === unit.id ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <div className={`h-2 w-2 rounded-full ${getCurrentUnitId() === unit.id ? 'bg-teal-500' : 'bg-slate-300'}`}></div>
                                    {unit.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
             </div>

             {/* User Profile */}
             <div className="relative">
                <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
                >
                    <div className={`h-8 w-8 rounded-full ${user?.avatarColor || 'bg-slate-200'} flex items-center justify-center text-white font-bold text-xs shadow-sm`}>
                        {user?.name?.charAt(0) || <UserIcon size={14} className="text-slate-400" />}
                    </div>
                    <ChevronDown size={14} className="text-slate-400 mr-1" />
                </button>

                {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                        <div className="p-4 border-b border-slate-100">
                            <p className="text-sm font-bold text-slate-800">{user?.name || 'Guest'}</p>
                            <p className="text-xs text-slate-500">{user?.role || 'Visitor'}</p>
                        </div>
                        <div className="p-1">
                            {user?.role === 'Admin' && (
                                <button 
                                    onClick={() => navigate('/admin')}
                                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-teal-600 flex items-center gap-2 transition-colors"
                                >
                                    <Building2 size={16} />
                                    Trang quản trị
                                </button>
                            )}
                            <button 
                                onClick={handleLogout}
                                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors"
                            >
                                <LogOut size={16} />
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                )}
             </div>
          </div>

          <button 
            className="block lg:hidden rounded-xl border border-slate-900/10 bg-white/65 p-2.5 text-slate-700"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="border-t border-slate-900/10 bg-white/90 backdrop-blur-lg lg:hidden h-[calc(100vh-80px)] overflow-y-auto">
          <div className="container mx-auto grid gap-2 px-4 py-6">
            <div className="mb-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className={`h-10 w-10 rounded-full ${user?.avatarColor || 'bg-slate-200'} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                        {user?.name?.charAt(0) || <UserIcon size={16} className="text-slate-400" />}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-800">{user?.name || 'Guest'}</p>
                        <p className="text-xs text-slate-500">{user?.role || 'Visitor'}</p>
                    </div>
                </div>
                
                <p className="px-4 text-xs font-bold text-slate-400 uppercase mb-2">Đơn vị đang làm việc</p>
                {getAllUnits().map(unit => (
                    <button
                        key={unit.id}
                        onClick={() => {
                            if (user?.role !== 'Admin') {
                                alert("Bạn không có quyền chuyển đổi đơn vị.");
                                return;
                            }
                            handleSwitchUnit(unit.id);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold mb-1 flex items-center gap-2 ${getCurrentUnitId() === unit.id ? 'bg-teal-50 text-teal-700' : 'text-slate-600'} ${user?.role !== 'Admin' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                         <Building2 size={16} /> {unit.name}
                    </button>
                ))}
            </div>

            <a href="#documents" onClick={(e) => {
                const storedUser = localStorage.getItem('ECABINET_AUTH_USER');
                if (storedUser && JSON.parse(storedUser).role !== 'Admin') {
                    e.preventDefault();
                    alert("Chức năng tạm khóa cho tài khoản người dùng.");
                    return;
                }
                handleScroll(e, 'documents');
            }} className="flex items-center gap-3 rounded-2xl border border-slate-900/5 bg-white/70 px-4 py-3 font-medium text-slate-800">
               <FolderOpen size={18} className="text-teal-600" /> Kho tài liệu
            </a>
            <a href="#calendar" onClick={(e) => handleScroll(e, 'calendar')} className="flex items-center gap-3 rounded-2xl border border-slate-900/5 bg-white/70 px-4 py-3 font-medium text-slate-800">
               <CalendarDays size={18} className="text-teal-600" /> Lịch cuộc họp
            </a>
            <a href="#users" onClick={(e) => {
                const storedUser = localStorage.getItem('ECABINET_AUTH_USER');
                if (storedUser && JSON.parse(storedUser).role !== 'Admin') {
                    e.preventDefault();
                    alert("Chức năng tạm khóa cho tài khoản người dùng.");
                    return;
                }
                handleScroll(e, 'users');
            }} className="flex items-center gap-3 rounded-2xl border border-slate-900/5 bg-white/70 px-4 py-3 font-medium text-slate-800">
               <Users size={18} className="text-teal-600" /> Quản lý nhân sự
            </a>
            <a href="#pricing" onClick={(e) => {
                const storedUser = localStorage.getItem('ECABINET_AUTH_USER');
                if (storedUser && JSON.parse(storedUser).role !== 'Admin') {
                    e.preventDefault();
                    alert("Chức năng tạm khóa cho tài khoản người dùng.");
                    return;
                }
                handleScroll(e, 'pricing');
            }} className="flex items-center gap-3 rounded-2xl border border-slate-900/5 bg-white/70 px-4 py-3 font-medium text-slate-800">
               <CreditCard size={18} className="text-teal-600" /> Bảng giá
            </a>
            
            <div className="mt-4 pt-4 border-t border-slate-100">
                <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 font-medium text-red-600"
                >
                    <LogOut size={18} /> Đăng xuất
                </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
