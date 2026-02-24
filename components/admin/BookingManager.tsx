import React, { useState, useEffect } from 'react';
import { getCurrentUnitData, saveCurrentUnitBookings, Booking, Room } from '../../utils/dataManager';
import { Trash2, Calendar, Clock, MapPin, Search, Filter } from 'lucide-react';

const BookingManager: React.FC = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        const data = getCurrentUnitData();
        setBookings(data.bookings || []);
        setRooms(data.rooms || []);
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
                                        <button 
                                            onClick={() => handleDelete(booking.id)}
                                            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                            title="Xóa"
                                        >
                                            <Trash2 size={16} />
                                        </button>
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
        </div>
    );
};

export default BookingManager;
