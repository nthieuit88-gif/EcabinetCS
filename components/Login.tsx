import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUnitData, getAllUnits, setCurrentUnitId, getCurrentUnitId, User, updateUserSession } from '../utils/dataManager';
import { Search, Lock, User as UserIcon, ArrowRight, ShieldCheck, Building2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Login = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [units, setUnits] = useState<{id: string, name: string}[]>([]);
  const [currentUnitId, setCurrentUnitIdState] = useState('');
  const [showUnitMenu, setShowUnitMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const data = getCurrentUnitData();
    setUnits(getAllUnits());
    setCurrentUnitIdState(getCurrentUnitId());

    // Sort: Admin first, then others
    const sortedUsers = [...data.users].sort((a, b) => {
      if (a.role === 'Admin') return -1;
      if (b.role === 'Admin') return 1;
      return 0;
    });
    setUsers(sortedUsers);
  }, []);

  const handleUnitChange = (unitId: string) => {
    setCurrentUnitId(unitId);
    setCurrentUnitIdState(unitId);
    setShowUnitMenu(false);
    // The App component key change will trigger a remount, refreshing the data
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const performLogin = (user: User) => {
      // Generate Session ID
      const sessionId = crypto.randomUUID();
      
      // Update "Database" with new session ID
      updateUserSession(user.id, sessionId, user.unitId);
      
      // Store session ID locally
      localStorage.setItem('ECABINET_SESSION_ID', sessionId);

      // Login success
      localStorage.setItem('ECABINET_AUTH_USER', JSON.stringify(user));
      
      // Ensure we switch to the user's unit
      if (user.unitId) {
          setCurrentUnitId(user.unitId);
      }
      
      window.dispatchEvent(new Event('auth-change'));
      
      navigate('/');
  };

  const handleUserClick = (user: User) => {
    // Temporary Bypass: Allow all users in "unit_1" to login without password, except Admin
    if (user.unitId === 'unit_1' && user.role !== 'Admin') {
        performLogin(user);
        return;
    }

    setSelectedUser(user);
    setPassword('');
    setError('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    let validPassword = 'Longphu25##'; // Default password for members
    if (selectedUser.role === 'Admin') {
      if (selectedUser.unitId === 'unit_1') validPassword = 'Admin26##';
      else if (selectedUser.unitId === 'unit_2') validPassword = 'Admin@##';
      else if (selectedUser.unitId === 'unit_3') validPassword = 'Admin##@';
      else validPassword = 'Admin26##'; // Fallback
    }

    if (password === validPassword) {
      performLogin(selectedUser);
    } else {
      setError('Mật khẩu không đúng. Vui lòng thử lại.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-4xl bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden z-10 border border-white/50 flex flex-col md:flex-row min-h-[600px]">
        
        {/* Left Panel: Branding & Info */}
        <div className="md:w-5/12 bg-gradient-to-br from-teal-600 to-blue-700 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80')] opacity-10 bg-cover bg-center" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight">EcabinetCS</span>
            </div>
            
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              Phòng Họp Số <br/>Thông Minh
            </h1>
            <p className="text-blue-100 text-lg">
              Đăng nhập để truy cập tài liệu, lịch họp và quản lý công việc hiệu quả.
            </p>
          </div>
        </div>

        {/* Right Panel: User Selection & Login */}
        <div className="md:w-7/12 p-8 bg-slate-50 flex flex-col relative">
          
          {/* Unit Selection - Only show when not selecting password */}
          {!selectedUser && (
            <div className="mb-6 relative z-20">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Đơn vị làm việc</label>
                <button 
                    onClick={() => setShowUnitMenu(!showUnitMenu)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between text-slate-700 font-medium hover:border-blue-400 transition-all shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                            <Building2 size={18} />
                        </div>
                        <span className="truncate">{units.find(u => u.id === currentUnitId)?.name || 'Chọn đơn vị'}</span>
                    </div>
                    <ChevronDown size={18} className="text-slate-400" />
                </button>
                
                {showUnitMenu && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {units.map(unit => (
                            <button
                                key={unit.id}
                                onClick={() => handleUnitChange(unit.id)}
                                className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors ${currentUnitId === unit.id ? 'bg-teal-50 text-teal-700' : 'text-slate-600'}`}
                            >
                                <div className={`w-2 h-2 rounded-full ${currentUnitId === unit.id ? 'bg-teal-500' : 'bg-slate-300'}`} />
                                {unit.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>
          )}

          <AnimatePresence mode="wait">
            {!selectedUser ? (
              <motion.div 
                key="user-list"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col"
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Chọn tài khoản</h2>
                  <p className="text-slate-500">Vui lòng chọn tài khoản của bạn để tiếp tục</p>
                </div>

                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tên hoặc vai trò..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  />
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar -mr-2">
                  <div className="grid grid-cols-1 gap-3">
                    {filteredUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleUserClick(user)}
                        className="flex items-center p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all group text-left"
                      >
                        <div className={`w-12 h-12 rounded-full ${user.avatarColor} flex items-center justify-center text-white font-bold text-lg shadow-sm mr-4 group-hover:scale-105 transition-transform`}>
                          {user.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                            {user.name}
                          </h3>
                          <div className="flex items-center text-xs text-slate-500 gap-2">
                            <span className={`px-2 py-0.5 rounded-full ${user.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                              {user.role}
                            </span>
                            <span>•</span>
                            <span>{user.dept}</span>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                    
                    {filteredUsers.length === 0 && (
                      <div className="text-center py-10 text-slate-400">
                        <UserIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Không tìm thấy người dùng nào</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="password-input"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full"
              >
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="absolute top-8 left-8 text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm font-medium transition-colors"
                >
                  ← Quay lại
                </button>

                <div className="text-center mb-8">
                  <div className={`w-24 h-24 rounded-full ${selectedUser.avatarColor} flex items-center justify-center text-white font-bold text-4xl shadow-lg mx-auto mb-4`}>
                    {selectedUser.name.charAt(0)}
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">{selectedUser.name}</h2>
                  <p className="text-slate-500">{selectedUser.role} - {selectedUser.dept}</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                        placeholder="Nhập mật khẩu..."
                        autoFocus
                      />
                    </div>
                    {error && (
                      <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full inline-block" />
                        {error}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-teal-600 to-blue-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all active:scale-[0.98]"
                  >
                    Đăng nhập
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Login;
