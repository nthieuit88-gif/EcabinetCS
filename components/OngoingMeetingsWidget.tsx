import React, { useState, useEffect } from 'react';
import { Video, Users, Clock, MapPin, Calendar } from 'lucide-react';
import { getCurrentUnitData } from '../utils/dataManager';

interface OngoingMeetingsWidgetProps {
    onJoinMeeting?: (meeting: { id?: number; title: string; code: string; documents?: any[]; attendees?: any[] }) => void;
}

const OngoingMeetingsWidget: React.FC<OngoingMeetingsWidgetProps> = ({ onJoinMeeting }) => {
    const [meetings, setMeetings] = useState<any[]>([]);

    const loadMeetings = () => {
        const data = getCurrentUnitData();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayMeetings = (data.bookings || [])
            .filter(booking => {
                const meetingDate = new Date(today.getFullYear(), today.getMonth(), booking.day);
                return meetingDate.getTime() >= today.getTime() && meetingDate.getTime() < tomorrow.getTime();
            })
            .map(booking => {
                const room = data.rooms.find(r => r.id === booking.roomId);
                return {
                    ...booking,
                    location: room ? room.name : 'Unknown',
                    attendeesCount: booking.attendees?.length || 0
                };
            });
        setMeetings(todayMeetings);
    };

    useEffect(() => {
        loadMeetings();
        const handleDataChange = () => loadMeetings();
        window.addEventListener('data-change', handleDataChange);
        return () => window.removeEventListener('data-change', handleDataChange);
    }, []);

    if (meetings.length === 0) return null;

    return (
        <div className="container mx-auto px-4 sm:px-6 py-8">
            <h3 className="text-xl font-black text-slate-800 mb-6">Cuộc họp hôm nay</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {meetings.map((meeting) => (
                    <div key={meeting.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all">
                        <h4 className="font-black text-lg text-slate-800 mb-3">{meeting.title}</h4>
                        <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                            <span className="flex items-center gap-1.5"><Clock size={16} className="text-teal-500" /> {meeting.startTime} - {meeting.endTime}</span>
                            <span className="flex items-center gap-1.5"><MapPin size={16} className="text-blue-500" /> {meeting.location}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-sm font-bold text-slate-500"><Users size={16} /> {meeting.attendeesCount} người tham dự</span>
                            <button 
                                onClick={() => onJoinMeeting?.({
                                    id: meeting.id,
                                    title: meeting.title,
                                    code: `MEET-${meeting.id}`,
                                    documents: meeting.documents,
                                    attendees: meeting.attendees
                                })}
                                className="px-4 py-2 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 transition-colors flex items-center gap-2"
                            >
                                <Video size={16} /> Tham gia ngay
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OngoingMeetingsWidget;
