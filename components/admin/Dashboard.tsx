import React, { useEffect, useState } from 'react';
import { getCurrentUnitData, UnitData, syncDocumentsFromSupabase, syncUsersFromSupabase, getCurrentUnitId } from '../../utils/dataManager';
import { Users, DoorOpen, CalendarDays, Activity, Loader2 } from 'lucide-react';

const Dashboard: React.FC = () => {
    const [data, setData] = useState<UnitData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadAllData = async () => {
            setIsLoading(true);
            const unitId = getCurrentUnitId();
            
            // Sync key data from Supabase
            await Promise.all([
                syncDocumentsFromSupabase(unitId),
                syncUsersFromSupabase(unitId)
            ]);
            
            setData(getCurrentUnitData());
            setIsLoading(false);
        };
        
        loadAllData();
        
        const handleDataChange = () => setData(getCurrentUnitData());
        window.addEventListener('data-change', handleDataChange);
        window.addEventListener('unit-change', loadAllData);
        
        return () => {
            window.removeEventListener('data-change', handleDataChange);
            window.removeEventListener('unit-change', loadAllData);
        };
    }, []);

    if (isLoading || !data) return (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Loader2 className="animate-spin mb-4" size={48} />
            <p className="font-medium">Đang tải dữ liệu tổng quan...</p>
        </div>
    );

    const stats = [
        { title: 'Tổng số phòng', value: data.rooms.length, icon: DoorOpen, color: 'bg-blue-500' },
        { title: 'Tổng số đặt lịch', value: data.bookings.length, icon: CalendarDays, color: 'bg-teal-500' },
        { title: 'Nhân sự', value: data.users.length, icon: Users, color: 'bg-purple-500' },
        { title: 'Đang hoạt động', value: data.users.filter(u => u.status === 'active').length, icon: Activity, color: 'bg-emerald-500' },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className={`h-12 w-12 rounded-xl ${stat.color} text-white flex items-center justify-center shadow-lg shadow-blue-500/20`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-lg text-slate-800 mb-4">Hoạt động gần đây</h3>
                    <div className="space-y-4">
                        {data.bookings.slice(0, 5).map((booking) => (
                            <div key={booking.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                    {booking.day}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-sm text-slate-800">{booking.title}</h4>
                                    <p className="text-xs text-slate-500">{booking.startTime} - {booking.endTime}</p>
                                </div>
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                    booking.type === 'important' ? 'bg-red-100 text-red-600' : 
                                    booking.type === 'internal' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                                }`}>
                                    {booking.type}
                                </span>
                            </div>
                        ))}
                        {data.bookings.length === 0 && (
                            <p className="text-sm text-slate-400 text-center py-4">Chưa có hoạt động nào</p>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-lg text-slate-800 mb-4">Trạng thái phòng</h3>
                    <div className="space-y-4">
                        {data.rooms.map((room) => (
                            <div key={room.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100">
                                <div>
                                    <h4 className="font-bold text-sm text-slate-800">{room.name}</h4>
                                    <p className="text-xs text-slate-500">{room.capacity} chỗ ngồi • {room.location}</p>
                                </div>
                                <span className={`h-2.5 w-2.5 rounded-full ${room.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
