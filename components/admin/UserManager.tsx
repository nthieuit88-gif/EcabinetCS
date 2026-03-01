import React, { useState, useEffect } from 'react';
import { getCurrentUnitData, saveCurrentUnitUsers, User, syncUsersFromSupabase, getCurrentUnitId } from '../../utils/dataManager';
import { Plus, Pencil, Trash2, X, Check, Search, Mail, User as UserIcon, Briefcase, Shield, Loader2 } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

const UserManager: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<Partial<User>>({
        name: '',
        email: '',
        role: 'Thành viên',
        dept: 'Phòng Kinh doanh',
        status: 'active',
        avatarColor: 'bg-blue-500'
    });

    useEffect(() => {
        loadUsers();
        
        const handleDataChange = () => loadUsers();
        window.addEventListener('data-change', handleDataChange);
        window.addEventListener('unit-change', handleDataChange);
        
        return () => {
            window.removeEventListener('data-change', handleDataChange);
            window.removeEventListener('unit-change', handleDataChange);
        };
    }, []);

    const loadUsers = async () => {
        setIsLoading(true);
        const unitId = getCurrentUnitId();
        
        // Try to sync from Supabase
        const syncedUsers = await syncUsersFromSupabase(unitId);
        if (syncedUsers && syncedUsers.length > 0) {
            setUsers(syncedUsers);
        } else {
            const data = getCurrentUnitData();
            setUsers(data.users || []);
        }
        setIsLoading(false);
    };

    const handleOpenModal = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setFormData(user);
        } else {
            setEditingUser(null);
            setFormData({
                name: '',
                email: '',
                role: 'Thành viên',
                dept: 'Phòng Kinh doanh',
                status: 'active',
                avatarColor: getRandomColor()
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const getRandomColor = () => {
        const colors = [
            "bg-gradient-to-br from-blue-500 to-indigo-600",
            "bg-gradient-to-br from-emerald-500 to-teal-600",
            "bg-gradient-to-br from-orange-500 to-red-600",
            "bg-gradient-to-br from-pink-500 to-rose-600",
            "bg-gradient-to-br from-indigo-500 to-purple-600",
            "bg-gradient-to-br from-blue-400 to-cyan-500"
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    const handleSave = async () => {
        if (!formData.name || !formData.email) return;

        const unitId = getCurrentUnitId();
        let newUsers = [...users];
        
        if (editingUser) {
            const updatedUser = { ...formData, id: editingUser.id } as User;
            newUsers = newUsers.map(u => u.id === editingUser.id ? updatedUser : u);
            
            // Update in Supabase
            const { error } = await supabase
                .from('users')
                .update({
                    name: updatedUser.name,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    dept: updatedUser.dept,
                    status: updatedUser.status,
                    avatar_color: updatedUser.avatarColor
                })
                .eq('id', updatedUser.id);
                
            if (error) console.error("Supabase update error:", error);
        } else {
            const newUser: User = {
                ...formData as User,
                id: Date.now(),
                unitId: unitId
            };
            newUsers.push(newUser);
            
            // Insert into Supabase
            const { error } = await supabase
                .from('users')
                .insert({
                    id: newUser.id,
                    name: newUser.name,
                    email: newUser.email,
                    role: newUser.role,
                    dept: newUser.dept,
                    status: newUser.status,
                    avatar_color: newUser.avatarColor,
                    unit_id: unitId
                });
                
            if (error) console.error("Supabase insert error:", error);
        }

        saveCurrentUnitUsers(newUsers);
        setUsers(newUsers);
        handleCloseModal();
        
        // Refresh from Supabase to ensure consistency
        syncUsersFromSupabase(unitId);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa nhân sự này?')) {
            const unitId = getCurrentUnitId();
            const newUsers = users.filter(u => u.id !== id);
            saveCurrentUnitUsers(newUsers);
            setUsers(newUsers);
            
            // Delete from Supabase
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', id);
                
            if (error) console.error("Supabase delete error:", error);
            
            // Refresh from Supabase
            syncUsersFromSupabase(unitId);
        }
    };

    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.dept.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const DEPARTMENTS = ["Hội đồng quản trị", "Ban Giám đốc", "Phòng Kế toán", "Phòng Nhân sự", "Phòng IT", "Phòng Kinh doanh"];
    const ROLES = ["Admin", "Giám đốc", "Thư ký", "Thành viên"];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-800">Quản lý nhân sự</h2>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm nhân sự..." 
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 whitespace-nowrap"
                    >
                        <Plus size={18} /> Thêm mới
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="px-6 py-4">Nhân sự</th>
                                <th className="px-6 py-4">Vai trò & Phòng ban</th>
                                <th className="px-6 py-4">Trạng thái</th>
                                <th className="px-6 py-4 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">
                                        <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-10 w-10 rounded-full ${user.avatarColor} text-white flex items-center justify-center font-bold shadow-sm`}>
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800">{user.name}</div>
                                                <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                                    <Mail size={10} /> {user.email || 'Chưa cập nhật'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                                                <Shield size={14} className="text-blue-500" /> {user.role}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                <Briefcase size={12} /> {user.dept}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                            user.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {user.status === 'active' ? 'Đang hoạt động' : 'Ngoại tuyến'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleOpenModal(user)}
                                                className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                title="Sửa"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(user.id)}
                                                className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                title="Xóa"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">
                                        Không tìm thấy nhân sự nào phù hợp
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">{editingUser ? 'Sửa thông tin nhân sự' : 'Thêm nhân sự mới'}</h3>
                            <button onClick={handleCloseModal} className="p-1 rounded hover:bg-slate-200 text-slate-500">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Họ và tên <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                    <input 
                                        type="text" 
                                        className="w-full border border-slate-200 rounded-lg pl-10 pr-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        placeholder="Nhập họ tên..."
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Email <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                    <input 
                                        type="email" 
                                        className="w-full border border-slate-200 rounded-lg pl-10 pr-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        value={formData.email}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                        placeholder="example@company.com"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Phòng ban</label>
                                    <select 
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                                        value={formData.dept}
                                        onChange={e => setFormData({...formData, dept: e.target.value})}
                                    >
                                        {DEPARTMENTS.map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Vai trò</label>
                                    <select 
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                                        value={formData.role}
                                        onChange={e => setFormData({...formData, role: e.target.value})}
                                    >
                                        {ROLES.map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Trạng thái</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="status" 
                                            value="active" 
                                            checked={formData.status === 'active'} 
                                            onChange={() => setFormData({...formData, status: 'active'})}
                                            className="text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-medium text-slate-700">Hoạt động</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="status" 
                                            value="offline" 
                                            checked={formData.status === 'offline'} 
                                            onChange={() => setFormData({...formData, status: 'offline'})}
                                            className="text-slate-600 focus:ring-slate-500"
                                        />
                                        <span className="text-sm font-medium text-slate-700">Ngoại tuyến</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button onClick={handleCloseModal} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100">
                                Hủy
                            </button>
                            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 flex items-center gap-2">
                                <Check size={16} /> Lưu lại
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManager;
