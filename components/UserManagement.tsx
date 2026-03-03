import React, { useState, useEffect, useMemo } from 'react';
import ScrollReveal from './ui/ScrollReveal';
import { Users, UserPlus, Search, Filter, Trash2, Pencil, X, Check, ShieldCheck, Mail, Building2 } from 'lucide-react';
import { User, getCurrentUnitData, saveCurrentUnitUsers, syncUsersFromSupabase, getCurrentUnitId } from '../utils/dataManager';
import { supabase } from '../utils/supabaseClient';

const ROLES = ["Admin", "Lãnh đạo", "Công chức"];
const AVATAR_COLORS = [
    "bg-gradient-to-br from-blue-500 to-indigo-600",
    "bg-gradient-to-br from-emerald-500 to-teal-600",
    "bg-gradient-to-br from-orange-500 to-red-600",
    "bg-gradient-to-br from-pink-500 to-rose-600",
    "bg-gradient-to-br from-indigo-500 to-purple-600",
    "bg-gradient-to-br from-blue-400 to-cyan-500"
];

const UserRow: React.FC<{ user: User, onEdit: (u: User) => void, onDelete: (id: number) => void }> = ({ user, onEdit, onDelete }) => (
    <div className="group flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-slate-100 mb-1">
        <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-2xl flex items-center justify-center text-white font-black shadow-sm ${user.avatarColor}`}>
                {user.name.charAt(0)}
            </div>
            <div>
                <div className="text-sm font-black text-slate-800 leading-none mb-1.5">{user.name}</div>
                <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 uppercase tracking-tight">
                    <Mail size={10} /> {user.email || 'Chưa cập nhật'}
                </div>
            </div>
        </div>
        <div className="flex items-center gap-3">
             <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                 user.role === 'Admin' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 
                 user.role === 'Lãnh đạo' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 
                 'bg-slate-100 text-slate-600 border border-slate-200'
             }`}>
                 {user.role}
             </span>
             <div className={`h-2.5 w-2.5 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-200/50 ${user.status === 'active' ? 'bg-teal-500 animate-pulse' : 'bg-slate-300'}`} title={user.status === 'active' ? 'Online' : 'Offline'}></div>
             
             <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(user); }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    title="Sửa thông tin"
                >
                    <Pencil size={14} />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(user.id); }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                    title="Xóa nhân sự"
                >
                    <Trash2 size={14} />
                </button>
             </div>
        </div>
    </div>
);

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [unitName, setUnitName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter state
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Modal State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [isEditing, setIsEditing] = useState(false);

  // Load Data on Mount
  useEffect(() => {
      const loadUsers = async () => {
          const unitData = getCurrentUnitData();
          setUnitName(unitData.name);
          
          // Show local data first
          setUsers(unitData.users);
          
          // Then sync from Supabase
          const unitId = getCurrentUnitId();
          const syncedUsers = await syncUsersFromSupabase(unitId);
          if (syncedUsers && syncedUsers.length > 0) {
              setUsers(syncedUsers);
          }
      };
      
      loadUsers();
  }, []);

  // Filter Logic
  const filteredUsers = useMemo(() => {
      return users.filter(user => {
          const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
          const matchesRole = selectedRole ? user.role === selectedRole : true;
          return matchesSearch && matchesRole;
      });
  }, [users, searchTerm, selectedRole]);

  const handleAddNew = () => {
      setFormData({
          name: "",
          role: "Công chức",
          dept: "Văn phòng",
          status: "active",
          avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
          email: ""
      });
      setIsEditing(false);
      setShowForm(true);
  };

  const handleEdit = (user: User) => {
      setFormData(user);
      setIsEditing(true);
      setShowForm(true);
  };

  const handleDelete = async (id: number) => {
      if (window.confirm("Bạn có chắc chắn muốn xóa nhân sự này khỏi hệ thống?")) {
          // Optimistic update
          const updatedUsers = users.filter(u => u.id !== id);
          setUsers(updatedUsers);
          saveCurrentUnitUsers(updatedUsers);

          // Delete from Supabase
          const { error } = await supabase
              .from('users')
              .delete()
              .eq('id', id);
              
          if (error) {
              console.error("Failed to delete user from Supabase:", error);
              // Revert if needed, but for now just log
          }
      }
  };

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.name) return;

      const unitId = getCurrentUnitId();
      let updatedUsers: User[];
      let savedUser: User;

      if (isEditing) {
          savedUser = { ...formData } as User;
          updatedUsers = users.map(u => u.id === formData.id ? savedUser : u);
          
          // Update in Supabase
          const { error } = await supabase
              .from('users')
              .update({
                  name: savedUser.name,
                  role: savedUser.role,
                  dept: savedUser.dept,
                  status: savedUser.status,
                  avatar_color: savedUser.avatarColor,
                  email: savedUser.email
              })
              .eq('id', savedUser.id);
              
          if (error) console.error("Failed to update user in Supabase:", error);
      } else {
          savedUser = {
              ...formData,
              id: Date.now(),
              unitId: unitId
          } as User;
          updatedUsers = [savedUser, ...users];
          
          // Insert to Supabase
          const { error } = await supabase
              .from('users')
              .insert({
                  id: savedUser.id,
                  name: savedUser.name,
                  role: savedUser.role,
                  dept: savedUser.dept,
                  status: savedUser.status,
                  avatar_color: savedUser.avatarColor,
                  email: savedUser.email,
                  unit_id: savedUser.unitId
              });
              
          if (error) console.error("Failed to insert user to Supabase:", error);
      }

      setUsers(updatedUsers);
      saveCurrentUnitUsers(updatedUsers);
      
      setShowForm(false);
  };

  return (
    <section id="users" className="py-6 bg-white border-y border-slate-900/5 relative">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-5 gap-8 items-start">
            
            {/* Left Description */}
            <div className="lg:col-span-2">
                <ScrollReveal>
                    <div className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-purple-50 px-3 py-1 text-[10px] font-black text-purple-600 mb-4 uppercase tracking-wider">
                         <ShieldCheck size={12} />
                         <span>Phân quyền chặt chẽ</span>
                    </div>
                    <h2 className="mb-4 text-3xl font-black tracking-tighter text-slate-900 sm:text-4xl leading-tight">
                        Quản lý <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-600">Nhân sự</span> & Tổ chức
                    </h2>
                    <p className="text-base text-slate-600/80 mb-8 leading-relaxed font-medium">
                        Bạn đang quản lý dữ liệu cho: <strong className="text-slate-900">{unitName}</strong>. Dữ liệu này được lưu trữ riêng biệt và chỉ có thể truy cập bởi tài khoản quản trị của đơn vị.
                    </p>
                    
                    <div className="space-y-5">
                        <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm transition-all hover:shadow-md">
                            <div className="h-12 w-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 shrink-0 shadow-inner">
                                <Building2 size={24} />
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900 text-sm uppercase tracking-wide">Cơ cấu tổ chức</h4>
                                <p className="text-xs text-slate-500 mt-1.5 font-bold leading-relaxed">Quản lý danh sách nhân sự theo chức vụ: Admin, Lãnh đạo, Công chức.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm transition-all hover:shadow-md">
                            <div className="h-12 w-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-inner">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900 text-sm uppercase tracking-wide">Bảo mật LocalStorage</h4>
                                <p className="text-xs text-slate-500 mt-1.5 font-bold leading-relaxed">Dữ liệu mỗi đơn vị được phân vùng (namespace) riêng biệt để đảm bảo tính riêng tư.</p>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>
            </div>

            {/* Right UI Simulation */}
            <div className="lg:col-span-3">
                <ScrollReveal delay={100}>
                    <div className="rounded-3xl border border-slate-900/10 bg-white shadow-2xl overflow-hidden flex flex-col h-[520px]">
                        {/* Fake Browser Header */}
                        <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between shrink-0">
                             <div className="flex flex-col">
                                <div className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-wide">
                                    <Users size={18} className="text-purple-600" /> Danh sách nhân sự
                                </div>
                                <span className="text-[10px] font-bold text-slate-500">{unitName}</span>
                             </div>
                             <button 
                                onClick={handleAddNew}
                                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:brightness-110 transition-all shadow-lg shadow-blue-500/20 active:scale-95 transform"
                             >
                                 <UserPlus size={14} /> Thêm mới
                             </button>
                        </div>

                        <div className="flex flex-1 overflow-hidden">
                            {/* Sidebar Role Filter */}
                            <div className="w-[160px] sm:w-[200px] border-r border-slate-100 bg-slate-50/50 overflow-y-auto flex flex-col shrink-0 custom-scrollbar">
                                <div className="p-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3">Lọc theo chức vụ</span>
                                    <div className="space-y-1">
                                        <button 
                                            onClick={() => setSelectedRole(null)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${!selectedRole ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
                                        >
                                            <span>Tất cả</span>
                                            <span className="text-[9px] bg-white/50 px-1.5 py-0.5 rounded-full">{users.length}</span>
                                        </button>
                                        {ROLES.map(role => (
                                            <button 
                                                key={role}
                                                onClick={() => setSelectedRole(role)}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${selectedRole === role ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
                                            >
                                                <span>{role}</span>
                                                <span className="text-[9px] bg-white/50 px-1.5 py-0.5 rounded-full">{users.filter(u => u.role === role).length}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Main User List */}
                            <div className="flex-1 flex flex-col bg-white">
                                {/* Search Filter */}
                                <div className="p-3 border-b border-slate-100 flex gap-2 bg-white shrink-0">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-3 text-slate-400" size={14} />
                                        <input 
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:bg-white focus:border-purple-300 transition-all" 
                                            placeholder="Tìm tên hoặc email..." 
                                        />
                                    </div>
                                    <button className="p-2.5 border border-slate-200 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"><Filter size={16} /></button>
                                </div>

                                {/* List */}
                                <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map(user => (
                                            <UserRow 
                                                key={user.id} 
                                                user={user} 
                                                onEdit={handleEdit}
                                                onDelete={handleDelete}
                                            />
                                        ))
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                                            <Users size={48} className="mb-3 opacity-10" />
                                            <p className="text-xs font-bold uppercase tracking-widest opacity-50">Không tìm thấy nhân sự phù hợp.</p>
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 border-t border-slate-100 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                                    Hiển thị {filteredUsers.length} nhân sự
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>
            </div>
        </div>

        {/* MODAL FORM: Add / Edit User */}
        {showForm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
                <div className="w-full max-w-lg bg-white rounded-[32px] shadow-[0_32px_80px_rgba(0,0,0,0.2)] border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div className="flex items-center gap-3">
                             <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-lg shadow-blue-500/20"><UserPlus size={24} /></div>
                             <div>
                                <h4 className="font-black text-slate-800 uppercase tracking-wide">{isEditing ? "Chỉnh sửa nhân sự" : "Thêm nhân sự mới"}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{unitName}</p>
                             </div>
                        </div>
                        <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200 transition-colors"><X size={24} /></button>
                    </div>

                    <form onSubmit={handleSave} className="p-8 space-y-6">
                        <div className="grid gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Họ và tên</label>
                                <input 
                                    required
                                    className="w-full text-sm font-black text-slate-800 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-4 py-3.5 outline-none transition-all"
                                    placeholder="Nhập họ và tên..."
                                    value={formData.name || ''}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Email công việc</label>
                                    <input 
                                        className="w-full text-sm font-black text-slate-800 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-2xl px-4 py-3.5 outline-none transition-all"
                                        placeholder="email@ecabinet.vn"
                                        value={formData.email || ''}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Chức vụ</label>
                                    <select 
                                        className="w-full text-sm font-black text-slate-800 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-2xl px-4 py-3.5 outline-none transition-all appearance-none"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Trạng thái</label>
                                    <select 
                                        className="w-full text-sm font-black text-slate-800 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-2xl px-4 py-3.5 outline-none transition-all appearance-none"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                    >
                                        <option value="active">Trực tuyến (Active)</option>
                                        <option value="offline">Ngoại tuyến (Offline)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button 
                                type="button" 
                                onClick={() => setShowForm(false)}
                                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                            >
                                Hủy bỏ
                            </button>
                            <button 
                                type="submit" 
                                className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:brightness-110 transition-all flex items-center justify-center gap-2"
                            >
                                <Check size={18} /> {isEditing ? "Cập nhật" : "Xác nhận thêm"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
      </div>
    </section>
  );
};

export default UserManagement;