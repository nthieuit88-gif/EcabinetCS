import React, { useState, useEffect } from 'react';
import { getCurrentUnitData, saveCurrentUnitBookings, Booking, Room, User, Document, syncDocumentsFromSupabase, getCurrentUnitId } from '../../utils/dataManager';
import { Trash2, Calendar, Clock, MapPin, Search, Filter, Plus, Pencil, X, Check, FileText } from 'lucide-react';

const BookingManager: React.FC = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
    const [formData, setFormData] = useState<Partial<Booking>>({
        title: '',
        day: new Date().getDate(),
        startTime: '08:00',
        endTime: '09:00',
        roomId: '',
        type: 'internal',
        attendees: [],
        documents: []
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const data = getCurrentUnitData();
        setBookings(data.bookings || []);
        setRooms(data.rooms || []);
        setUsers(data.users || []);
        
        const unitId = getCurrentUnitId();
        const docs = await syncDocumentsFromSupabase(unitId);
        setDocuments(docs);
    };

    const handleOpenModal = (booking?: Booking) => {
        if (booking) {
            setEditingBooking(booking);
            setFormData(booking);
        } else {
            setEditingBooking(null);
            setFormData({
                title: '',
                day: new Date().getDate(),
                startTime: '08:00',
                endTime: '09:00',
                roomId: rooms.length > 0 ? rooms[0].id : '',
                type: 'internal',
                attendees: [],
                documents: []
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingBooking(null);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.roomId) return;

        let newBookings = [...bookings];
        if (editingBooking) {
            newBookings = newBookings.map(b => b.id === editingBooking.id ? { ...formData, id: editingBooking.id } as Booking : b);
        } else {
            const newBooking: Booking = {
                ...formData as Booking,
                id: Date.now(),
                attendees: formData.attendees || [],
                documents: formData.documents || []
            };
            newBookings.push(newBooking);
        }

        saveCurrentUnitBookings(newBookings);
        setBookings(newBookings);
        handleCloseModal();
    };

    const handleDelete = (id: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa lịch đặt này?')) {
            const newBookings = bookings.filter(b => b.id !== id);
            saveCurrentUnitBookings(newBookings);
            setBookings(newBookings);
        }
    };

    const getRoomName = (roomId: string) => {
        const room = rooms.find(r => r.id === roomId);
        return room ? room.name : 'Phòng không xác định';
    };

    const filteredBookings = bookings.filter(booking => {
        const matchesSearch = booking.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'all' || booking.type === filterType;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-800">Quản lý đặt lịch</h2>
                <div className="flex gap-3 w-full md:w-auto">
                    <button 
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 whitespace-nowrap"
                    >
                        <Plus size={18} /> Thêm lịch họp
                    </button>
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm cuộc họp..." 
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select 
                        className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium bg-white focus:outline-none focus:border-blue-500"
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                    >
                        <option value="all">Tất cả loại</option>
                        <option value="internal">Nội bộ</option>
                        <option value="important">Quan trọng</option>
                        <option value="external">Đối ngoại</option>
                        <option value="training">Đào tạo</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="px-6 py-4">Cuộc họp</th>
                                <th className="px-6 py-4">Thời gian</th>
                                <th className="px-6 py-4">Địa điểm</th>
                                <th className="px-6 py-4">Loại</th>
                                <th className="px-6 py-4 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredBookings.map(booking => (
                                <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-800">{booking.title}</div>
                                        <div className="text-xs text-slate-400 mt-1">{booking.attendees.length} người tham dự</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                            <Calendar size={14} className="text-slate-400" />
                                            <span>Ngày {booking.day}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                            <Clock size={12} />
                                            <span>{booking.startTime} - {booking.endTime}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                            <MapPin size={14} className="text-slate-400" />
                                            <span>{getRoomName(booking.roomId)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                            booking.type === 'important' ? 'bg-red-100 text-red-600' : 
                                            booking.type === 'internal' ? 'bg-blue-100 text-blue-600' : 
                                            booking.type === 'external' ? 'bg-purple-100 text-purple-600' :
                                            'bg-amber-100 text-amber-600'
                                        }`}>
                                            {booking.type === 'internal' ? 'Nội bộ' : 
                                             booking.type === 'important' ? 'Quan trọng' :
                                             booking.type === 'external' ? 'Đối ngoại' : 'Đào tạo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleOpenModal(booking)}
                                                className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                title="Sửa"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(booking.id)}
                                                className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                title="Xóa"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredBookings.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                                        Không tìm thấy cuộc họp nào phù hợp
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
                    <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                {editingBooking ? <Pencil size={18} className="text-blue-600" /> : <Plus size={18} className="text-blue-600" />}
                                {editingBooking ? "Chỉnh sửa lịch họp" : "Thêm lịch họp mới"}
                            </h3>
                            <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase text-slate-500">Tên cuộc họp <span className="text-red-500">*</span></label>
                                <input 
                                    required
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    value={formData.title || ''}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase text-slate-500">Ngày</label>
                                    <input 
                                        type="number"
                                        min="1"
                                        max="31"
                                        required
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        value={formData.day || ''}
                                        onChange={(e) => setFormData({ ...formData, day: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase text-slate-500">Bắt đầu</label>
                                    <input 
                                        type="time"
                                        required
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        value={formData.startTime || ''}
                                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase text-slate-500">Kết thúc</label>
                                    <input 
                                        type="time"
                                        required
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        value={formData.endTime || ''}
                                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase text-slate-500">Phòng họp <span className="text-red-500">*</span></label>
                                    <select 
                                        required
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all bg-white"
                                        value={formData.roomId || ''}
                                        onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                                    >
                                        <option value="" disabled>Chọn phòng</option>
                                        {rooms.map(room => (
                                            <option key={room.id} value={room.id}>{room.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase text-slate-500">Loại cuộc họp</label>
                                    <select 
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all bg-white"
                                        value={formData.type || 'internal'}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                    >
                                        <option value="internal">Nội bộ</option>
                                        <option value="important">Quan trọng</option>
                                        <option value="external">Đối ngoại</option>
                                        <option value="training">Đào tạo</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase text-slate-500">Tài liệu đính kèm</label>
                                <div className="border border-slate-200 rounded-xl p-3 max-h-40 overflow-y-auto custom-scrollbar">
                                    {documents.length > 0 ? documents.map(doc => (
                                        <label key={doc.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="rounded text-blue-600 focus:ring-blue-500"
                                                checked={formData.documents?.some((d: any) => d.name === doc.name) || false}
                                                onChange={(e) => {
                                                    const currentDocs = formData.documents || [];
                                                    if (e.target.checked) {
                                                        // Add document
                                                        setFormData({ ...formData, documents: [...currentDocs, {
                                                            name: doc.name,
                                                            type: doc.type,
                                                            size: doc.size,
                                                            url: doc.url,
                                                            fromRepo: true
                                                        }] });
                                                    } else {
                                                        // Remove document
                                                        setFormData({ ...formData, documents: currentDocs.filter((d: any) => d.name !== doc.name) });
                                                    }
                                                }}
                                            />
                                            <FileText size={16} className="text-slate-400" />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-slate-700 truncate">{doc.name}</div>
                                                <div className="text-[10px] text-slate-400">{doc.size} • {doc.date}</div>
                                            </div>
                                        </label>
                                    )) : (
                                        <div className="text-center py-4 text-slate-400 text-sm">Chưa có tài liệu nào trong kho</div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase text-slate-500">Người tham dự</label>
                                <div className="border border-slate-200 rounded-xl p-3 max-h-40 overflow-y-auto custom-scrollbar">
                                    {users.map(user => (
                                        <label key={user.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="rounded text-blue-600 focus:ring-blue-500"
                                                checked={formData.attendees?.some(a => a.id === user.id) || false}
                                                onChange={(e) => {
                                                    const currentAttendees = formData.attendees || [];
                                                    if (e.target.checked) {
                                                        setFormData({ ...formData, attendees: [...currentAttendees, user] });
                                                    } else {
                                                        setFormData({ ...formData, attendees: currentAttendees.filter(a => a.id !== user.id) });
                                                    }
                                                }}
                                            />
                                            <span className="text-sm font-medium text-slate-700">{user.name}</span>
                                            <span className="text-xs text-slate-400 ml-auto">{user.role}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                <button 
                                    type="button" 
                                    onClick={handleCloseModal}
                                    className="flex-1 py-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-sm font-bold transition-colors"
                                >
                                    Hủy
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                                >
                                    <Check size={16} /> {editingBooking ? "Cập nhật" : "Lưu lịch họp"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingManager;
