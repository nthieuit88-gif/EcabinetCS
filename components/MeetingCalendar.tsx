import React, { useState, useRef, useEffect } from 'react';
import ScrollReveal from './ui/ScrollReveal';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Users, Plus, X, Video, FileText, Trash2, UserPlus, Paperclip, Search, Check, Upload, Pencil, AlertCircle, FolderOpen } from 'lucide-react';
import { getCurrentUnitData, saveCurrentUnitBookings, Booking, Room, User, Document } from '../utils/dataManager';

// --- Types & Interfaces ---
interface MeetingDoc {
    name: string;
    size: string;
    type: string;
}

// Renamed to CalendarEvent to avoid collision with global DOM Event
export interface CalendarEvent {
    id: number;
    day: number; // Added day to track distinct events easier
    title: string;
    startTime: string;
    endTime: string;
    location: string;
    roomId: string;
    type: 'internal' | 'external' | 'training' | 'important';
    color: string;
    attendees: User[];
    documents: MeetingDoc[];
}

interface MeetingCalendarProps {
    onJoinMeeting?: (event: CalendarEvent) => void;
}

const MeetingCalendar: React.FC<MeetingCalendarProps> = ({ onJoinMeeting }) => {
  const [events, setEvents] = useState<Record<number, CalendarEvent[]>>({});
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [availableDocs, setAvailableDocs] = useState<Document[]>([]);
  
  // Create/Edit Form State
  const [showForm, setShowForm] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [formData, setFormData] = useState<{
      id?: number; // Optional ID for existing events
      day: number;
      title: string;
      startTime: string;
      endTime: string;
      roomId: string;
      type: 'internal' | 'external' | 'training' | 'important';
      attendees: User[];
      documents: MeetingDoc[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      loadData();
      
      // Listen for unit changes or other updates if needed
      const handleDataChange = () => loadData();
      window.addEventListener('unit-change', handleDataChange);
      window.addEventListener('data-change', handleDataChange);
      return () => {
          window.removeEventListener('unit-change', handleDataChange);
          window.removeEventListener('data-change', handleDataChange);
      };
  }, []);

  const loadData = () => {
      const data = getCurrentUnitData();
      setRooms(data.rooms || []);
      setAvailableUsers(data.users || []);
      setAvailableDocs(data.documents || []);
      
      // Convert Bookings to CalendarEvents
      const newEvents: Record<number, CalendarEvent[]> = {};
      (data.bookings || []).forEach(booking => {
          const room = data.rooms.find(r => r.id === booking.roomId);
          const event: CalendarEvent = {
              id: booking.id,
              day: booking.day,
              title: booking.title,
              startTime: booking.startTime,
              endTime: booking.endTime,
              location: room ? room.name : 'Unknown',
              roomId: booking.roomId,
              type: booking.type,
              color: getEventColor(booking.type),
              attendees: booking.attendees,
              documents: booking.documents
          };
          
          if (!newEvents[booking.day]) {
              newEvents[booking.day] = [];
          }
          newEvents[booking.day].push(event);
      });
      setEvents(newEvents);
  };

  const getEventColor = (type: string) => {
      const colors: Record<string, string> = {
          internal: "bg-blue-100 text-blue-700 border-l-2 border-blue-500",
          external: "bg-purple-100 text-purple-700 border-l-2 border-purple-500",
          training: "bg-amber-100 text-amber-700 border-l-2 border-amber-500",
          important: "bg-teal-100 text-teal-700 border-l-2 border-teal-500"
      };
      return colors[type] || colors.internal;
  };

  // --- Handlers ---

  const handleDateClick = (day: number) => {
      // Only Admin can create events
      const storedUser = localStorage.getItem('ECABINET_AUTH_USER');
      if (!storedUser) return;
      const user = JSON.parse(storedUser);
      if (user.role !== 'Admin') {
          alert("Bạn không có quyền tạo cuộc họp.");
          return;
      }

      // Create NEW event
      setFormData({
          day,
          title: "",
          startTime: "09:00",
          endTime: "10:30",
          roomId: rooms[0]?.id || "",
          type: "internal",
          attendees: [availableUsers[0]], // Default host
          documents: []
      });
      setShowForm(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
      // Only Admin can edit
      const storedUser = localStorage.getItem('ECABINET_AUTH_USER');
      if (!storedUser) return;
      const user = JSON.parse(storedUser);
      if (user.role !== 'Admin') {
          // If not admin, just view details (which is already open)
          return; 
      }

      // Populate form with EXISTING event data
      setFormData({
          id: event.id,
          day: event.day,
          title: event.title,
          startTime: event.startTime,
          endTime: event.endTime,
          roomId: event.roomId,
          type: event.type,
          attendees: event.attendees,
          documents: event.documents
      });
      setSelectedEvent(null); // Close view modal
      setShowForm(true); // Open edit modal
  };

  const handleDeleteEvent = (event: CalendarEvent) => {
      // Only Admin can delete
      const storedUser = localStorage.getItem('ECABINET_AUTH_USER');
      if (!storedUser) return;
      const user = JSON.parse(storedUser);
      if (user.role !== 'Admin') {
          alert("Bạn không có quyền xóa cuộc họp.");
          return;
      }

      if (window.confirm(`Bạn có chắc chắn muốn xóa cuộc họp "${event.title}"?`)) {
          const data = getCurrentUnitData();
          const newBookings = (data.bookings || []).filter(b => b.id !== event.id);
          saveCurrentUnitBookings(newBookings);
          loadData(); // Refresh UI
          setSelectedEvent(null);
      }
  };

  const handleSaveEvent = () => {
      if (!formData || !formData.title.trim()) return;

      const data = getCurrentUnitData();
      let currentBookings = data.bookings || [];

      const newBooking: Booking = {
          id: formData.id || Date.now(),
          day: formData.day,
          title: formData.title,
          startTime: formData.startTime,
          endTime: formData.endTime,
          roomId: formData.roomId,
          type: formData.type,
          attendees: formData.attendees,
          documents: formData.documents
      };

      if (formData.id) {
          // Update existing
          currentBookings = currentBookings.map(b => b.id === formData.id ? newBooking : b);
      } else {
          // Add new
          currentBookings.push(newBooking);
      }

      saveCurrentUnitBookings(currentBookings);
      loadData(); // Refresh UI

      setShowForm(false);
      setFormData(null);
  };

  const handleAddUser = (userId: number) => {
      if (!formData) return;
      const userToAdd = availableUsers.find(u => u.id === userId);
      if (userToAdd && !formData.attendees.find(u => u.id === userId)) {
          setFormData({
              ...formData,
              attendees: [...formData.attendees, userToAdd]
          });
      }
  };

  const handleRemoveUser = (userId: number) => {
      if (!formData) return;
      setFormData({
          ...formData,
          attendees: formData.attendees.filter(u => u.id !== userId)
      });
  };

  const handleAddAllUsers = () => {
      if (!formData) return;
      setFormData({
          ...formData,
          attendees: [...availableUsers]
      });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0] && formData) {
          const file = e.target.files[0];
          const newDoc: MeetingDoc = {
              name: file.name,
              size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
              type: file.name.split('.').pop() || 'file'
          };
          setFormData({
              ...formData,
              documents: [...formData.documents, newDoc]
          });
      }
  };

  const handleAddDocFromRepo = (doc: Document) => {
      if (!formData) return;
      // Check if already added
      if (formData.documents.some(d => d.name === doc.name)) return;

      const newDoc: MeetingDoc = {
          name: doc.name,
          size: doc.size,
          type: doc.type
      };
      setFormData({
          ...formData,
          documents: [...formData.documents, newDoc]
      });
      setShowDocModal(false);
  };

  const handleRemoveDoc = (index: number) => {
      if (!formData) return;
      const newDocs = [...formData.documents];
      newDocs.splice(index, 1);
      setFormData({ ...formData, documents: newDocs });
  };

  // Sub-component for Calendar Day
  const CalendarDay: React.FC<{ 
      day: number; 
      isToday?: boolean; 
      isOtherMonth?: boolean; 
      events?: CalendarEvent[]; 
      onEventClick: (e: CalendarEvent) => void;
      onDateClick: (day: number) => void;
  }> = ({ day, isToday, isOtherMonth, events = [], onEventClick, onDateClick }) => (
      <div 
          onClick={() => !isOtherMonth && onDateClick(day)}
          className={`min-h-[100px] border-b border-r border-slate-100 bg-white p-2 transition-colors relative group
          ${isOtherMonth ? 'bg-slate-50/50 cursor-default' : 'hover:bg-blue-50/30 cursor-pointer'}
          `}
      >
          {!isOtherMonth && (
              <button 
                onClick={(e) => {
                    e.stopPropagation();
                    const storedUser = localStorage.getItem('ECABINET_AUTH_USER');
                    if (storedUser) {
                        const user = JSON.parse(storedUser);
                        if (user.role === 'Admin') {
                             onDateClick(day);
                        } else {
                            alert("Bạn không có quyền tạo cuộc họp.");
                        }
                    }
                }}
                className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 p-1 bg-blue-600 text-white rounded-md shadow-sm transition-opacity z-10 hover:scale-110" 
                title="Thêm cuộc họp"
              >
                  <Plus size={12} />
              </button>
          )}

          <div className={`mb-2 text-right text-xs font-bold ${isToday ? 'ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/30' : isOtherMonth ? 'text-slate-300' : 'text-slate-700'}`}>
              {day}
          </div>
          <div className="space-y-1.5">
              {events.map((evt, i) => (
                  <div 
                      key={i} 
                      onClick={(e) => { e.stopPropagation(); onEventClick(evt); }}
                      className={`group relative cursor-pointer rounded px-2 py-1.5 text-[10px] font-bold shadow-sm transition-transform hover:scale-[1.02] active:scale-95 ${evt.color}`}
                  >
                      <div className="truncate">{evt.title}</div>
                      <div className="mt-0.5 opacity-75 text-[9px] font-medium">{evt.startTime} - {evt.endTime}</div>
                  </div>
              ))}
          </div>
      </div>
  );

  return (
    <section id="calendar" className="py-6 overflow-hidden bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center mb-8">
            <ScrollReveal>
                <h2 className="mb-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Lịch họp trực quan</h2>
                <p className="text-base text-slate-600/80">Quản lý thời gian biểu toàn tổ chức với giao diện lịch tháng thông minh.</p>
            </ScrollReveal>
        </div>

        <ScrollReveal delay={100} className="relative z-10">
            <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                {/* Calendar Header */}
                <div className="flex items-center justify-between border-b border-slate-100 p-4 bg-white">
                    <div className="flex items-center gap-4">
                        <h3 className="text-xl font-black text-slate-800">Tháng 10, 2024</h3>
                        <div className="flex gap-1">
                            <button className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                                <ChevronLeft size={16} />
                            </button>
                            <button className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button className="hidden sm:flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors">
                            Hôm nay
                        </button>
                        <button 
                            onClick={() => {
                                const storedUser = localStorage.getItem('ECABINET_AUTH_USER');
                                if (storedUser) {
                                    const user = JSON.parse(storedUser);
                                    if (user.role === 'Admin') {
                                        handleDateClick(new Date().getDate());
                                    } else {
                                        alert("Bạn không có quyền tạo cuộc họp.");
                                    }
                                }
                            }}
                            className={`flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg hover:shadow-teal-500/30 hover:brightness-110 transition-all ${
                                (() => {
                                    const storedUser = localStorage.getItem('ECABINET_AUTH_USER');
                                    return storedUser && JSON.parse(storedUser).role !== 'Admin' ? 'opacity-50 cursor-not-allowed' : '';
                                })()
                            }`}
                        >
                            <CalendarIcon size={14} /> <span className="hidden sm:inline">Đặt lịch họp</span>
                        </button>
                    </div>
                </div>

                {/* Calendar Grid Header */}
                <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
                    {['CN', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy'].map((d, i) => (
                        <div key={d} className={`py-2 text-center text-[10px] font-extrabold uppercase tracking-wider ${i === 0 || i === 6 ? 'text-slate-400' : 'text-slate-600'}`}>
                            {d}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid Body */}
                <div className="grid grid-cols-7 bg-slate-100 gap-px border-b border-slate-100">
                    {/* Week 1 */}
                    {[29, 30].map(d => <CalendarDay key={d} day={d} isOtherMonth onEventClick={() => {}} onDateClick={() => {}} />)}
                    {[1, 2, 3, 4, 5].map(d => <CalendarDay key={d} day={d} events={events[d]} onEventClick={setSelectedEvent} onDateClick={handleDateClick} />)}

                    {/* Week 2 */}
                    {[6, 7, 8, 9].map(d => <CalendarDay key={d} day={d} events={events[d]} onEventClick={setSelectedEvent} onDateClick={handleDateClick} />)}
                    <CalendarDay day={10} isToday events={events[10]} onEventClick={setSelectedEvent} onDateClick={handleDateClick} />
                    {[11, 12].map(d => <CalendarDay key={d} day={d} events={events[d]} onEventClick={setSelectedEvent} onDateClick={handleDateClick} />)}

                    {/* Week 3 */}
                    {[13, 14, 15, 16, 17, 18, 19].map(d => <CalendarDay key={d} day={d} events={events[d]} onEventClick={setSelectedEvent} onDateClick={handleDateClick} />)}
                </div>
                
                {/* Footer Legend */}
                <div className="bg-slate-50/50 p-3 flex flex-wrap gap-4 justify-center sm:justify-start text-[10px] font-semibold text-slate-500">
                    <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-teal-500"></div> Quan trọng</div>
                    <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-blue-500"></div> Nội bộ</div>
                    <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-purple-500"></div> Đối ngoại</div>
                    <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-amber-500"></div> Đào tạo</div>
                </div>
            </div>

            {/* --- Event Detail Modal (View Only) --- */}
            {selectedEvent && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in">
                    <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95">
                         {/* Modal Header */}
                         <div className={`p-4 ${selectedEvent.color.split(' ')[0]} flex justify-between items-start`}>
                             <div className="flex flex-col">
                                 <h4 className="font-bold text-lg text-slate-800 pr-4 leading-tight">{selectedEvent.title}</h4>
                                 <span className="text-[10px] uppercase font-bold text-slate-500 bg-white/50 px-2 py-0.5 rounded mt-1 w-fit">
                                    Ngày {selectedEvent.day}/10
                                 </span>
                             </div>
                             <div className="flex gap-1">
                                 {(() => {
                                     const storedUser = localStorage.getItem('ECABINET_AUTH_USER');
                                     const isAdmin = storedUser && JSON.parse(storedUser).role === 'Admin';
                                     
                                     if (!isAdmin) return null;

                                     return (
                                         <>
                                             <button 
                                                onClick={() => handleEditEvent(selectedEvent)}
                                                className="p-1.5 rounded-full bg-white/50 hover:bg-blue-100 text-slate-600 hover:text-blue-600 transition-colors"
                                                title="Sửa cuộc họp"
                                             >
                                                <Pencil size={14} />
                                             </button>
                                             <button 
                                                onClick={() => handleDeleteEvent(selectedEvent)}
                                                className="p-1.5 rounded-full bg-white/50 hover:bg-red-100 text-slate-600 hover:text-red-600 transition-colors"
                                                title="Xóa cuộc họp"
                                             >
                                                <Trash2 size={14} />
                                             </button>
                                         </>
                                     );
                                 })()}
                                 <button onClick={() => setSelectedEvent(null)} className="p-1.5 rounded-full bg-white/50 hover:bg-white text-slate-600 transition-colors">
                                     <X size={14} />
                                 </button>
                             </div>
                         </div>

                         {/* Modal Body */}
                         <div className="p-5 space-y-4">
                             <div className="flex items-center gap-3 text-slate-600">
                                 <Clock size={18} className="text-slate-400" />
                                 <span className="text-sm font-semibold">{selectedEvent.startTime} - {selectedEvent.endTime}</span>
                             </div>
                             <div className="flex items-center gap-3 text-slate-600">
                                 <MapPin size={18} className="text-slate-400" />
                                 <span className="text-sm font-semibold">{selectedEvent.location}</span>
                             </div>
                             <div className="flex items-center gap-3 text-slate-600">
                                 <Users size={18} className="text-slate-400" />
                                 <span className="text-sm font-semibold">{selectedEvent.attendees.length} thành viên</span>
                             </div>
                             {selectedEvent.documents.length > 0 && (
                                <div className="border-t border-slate-100 pt-3 mt-1">
                                    <div className="text-xs font-bold text-slate-500 uppercase mb-2">Tài liệu ({selectedEvent.documents.length})</div>
                                    <div className="space-y-1">
                                        {selectedEvent.documents.map((doc, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-sm text-blue-600 hover:underline cursor-pointer">
                                                <Paperclip size={12} /> {doc.name}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                             )}
                             <div className="pt-2">
                                 <button 
                                    onClick={() => {
                                        if (onJoinMeeting && selectedEvent) {
                                            onJoinMeeting(selectedEvent);
                                        } else {
                                            alert("Chức năng đang phát triển");
                                        }
                                    }}
                                    className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                 >
                                     <Video size={16} /> Tham gia ngay
                                 </button>
                             </div>
                         </div>
                    </div>
                </div>
            )}
            
            {/* --- Management Form Modal (Create/Edit) --- */}
            {showForm && formData && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm animate-in fade-in">
                    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-5">
                         {/* Header */}
                         <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                             <div>
                                <h4 className="font-bold text-lg text-slate-800">
                                    {formData.id ? "Chỉnh sửa lịch họp" : `Đặt lịch họp ngày ${formData.day}/10`}
                                </h4>
                                <p className="text-xs text-slate-500">Điền thông tin chi tiết cuộc họp</p>
                             </div>
                             <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-slate-200 text-slate-500 transition-colors">
                                 <X size={20} />
                             </button>
                         </div>

                         {/* Form Body */}
                         <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                             
                             {/* Section 1: General Info */}
                             <div className="grid gap-4">
                                 <div className="space-y-1.5">
                                     <label className="text-xs font-bold uppercase text-slate-500">Tiêu đề cuộc họp <span className="text-red-500">*</span></label>
                                     <input 
                                        type="text" 
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all" 
                                        placeholder="Ví dụ: Họp giao ban tuần..." 
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                        autoFocus 
                                     />
                                 </div>
                                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                     <div className="space-y-1.5">
                                         <label className="text-xs font-bold uppercase text-slate-500">Bắt đầu</label>
                                         <input 
                                            type="time" 
                                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium" 
                                            value={formData.startTime} 
                                            onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                                         />
                                     </div>
                                     <div className="space-y-1.5">
                                         <label className="text-xs font-bold uppercase text-slate-500">Kết thúc</label>
                                         <input 
                                            type="time" 
                                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium" 
                                            value={formData.endTime}
                                            onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                                         />
                                     </div>
                                     <div className="space-y-1.5">
                                         <label className="text-xs font-bold uppercase text-slate-500">Loại họp</label>
                                         <select 
                                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium bg-white"
                                            value={formData.type}
                                            onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                                         >
                                             <option value="internal">Nội bộ</option>
                                             <option value="important">Quan trọng</option>
                                             <option value="external">Đối ngoại</option>
                                             <option value="training">Đào tạo</option>
                                         </select>
                                     </div>
                                 </div>
                                 <div className="space-y-1.5">
                                     <label className="text-xs font-bold uppercase text-slate-500">Địa điểm</label>
                                     <select 
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium bg-white"
                                        value={formData.roomId}
                                        onChange={(e) => setFormData({...formData, roomId: e.target.value})}
                                     >
                                         <option value="" disabled>Chọn phòng họp</option>
                                         {rooms.map(room => (
                                             <option key={room.id} value={room.id}>{room.name} ({room.capacity} chỗ)</option>
                                         ))}
                                     </select>
                                 </div>
                             </div>

                             <div className="h-px bg-slate-100 w-full"></div>

                             {/* Section 2: Participants */}
                             <div className="space-y-3">
                                 <div className="flex justify-between items-center">
                                     <label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                                         <Users size={14} /> Thành phần tham dự ({formData.attendees.length})
                                     </label>
                                     
                                     {/* Add User Dropdown (Simulated) */}
                                     <div className="relative group">
                                         <button className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md flex items-center gap-1 transition-colors">
                                             <UserPlus size={12} /> Thêm nhân sự
                                         </button>
                                         <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden hidden group-hover:block z-20 max-h-60 overflow-y-auto custom-scrollbar">
                                             <div className="p-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
                                                 <span className="font-bold text-[10px] text-slate-400 uppercase">Gợi ý</span>
                                                 <button 
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAddAllUsers();
                                                    }}
                                                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:underline"
                                                 >
                                                    + Tất cả
                                                 </button>
                                             </div>
                                             {availableUsers.map(user => {
                                                 const isSelected = formData.attendees.some(u => u.id === user.id);
                                                 if (isSelected) return null;
                                                 return (
                                                     <button 
                                                        key={user.id}
                                                        onClick={() => handleAddUser(user.id)}
                                                        className="w-full text-left px-3 py-2 hover:bg-blue-50 text-xs font-bold text-slate-700 flex items-center justify-between"
                                                     >
                                                         <span>{user.name}</span>
                                                         <span className="text-[9px] text-slate-400 bg-slate-100 px-1 rounded">{user.dept}</span>
                                                     </button>
                                                 )
                                             })}
                                         </div>
                                     </div>
                                 </div>
                                 
                                 {/* Selected Users List */}
                                 <div className="flex flex-wrap gap-2">
                                     {formData.attendees.map(user => (
                                         <div key={user.id} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full pl-1 pr-2 py-1">
                                             <div className={`h-5 w-5 rounded-full ${user.avatarColor} text-white text-[9px] flex items-center justify-center font-bold`}>
                                                 {user.name.charAt(0)}
                                             </div>
                                             <span className="text-xs font-bold text-slate-700">{user.name}</span>
                                             <button onClick={() => handleRemoveUser(user.id)} className="p-0.5 rounded-full hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors">
                                                 <X size={12} />
                                             </button>
                                         </div>
                                     ))}
                                     {formData.attendees.length === 0 && (
                                         <span className="text-sm text-slate-400 italic">Chưa có người tham dự</span>
                                     )}
                                 </div>
                             </div>

                             <div className="h-px bg-slate-100 w-full"></div>

                             {/* Section 3: Documents */}
                             <div className="space-y-3">
                                 <div className="flex justify-between items-center">
                                     <label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                                         <Paperclip size={14} /> Tài liệu đính kèm ({formData.documents.length})
                                     </label>
                                     <div className="flex gap-2">
                                         <button 
                                            onClick={() => setShowDocModal(true)}
                                            className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md flex items-center gap-1 transition-colors"
                                         >
                                             <FolderOpen size={12} /> Chọn từ kho
                                         </button>
                                         <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-xs font-bold text-teal-600 bg-teal-50 hover:bg-teal-100 px-2 py-1 rounded-md flex items-center gap-1 transition-colors"
                                         >
                                             <Upload size={12} /> Tải lên
                                         </button>
                                     </div>
                                     <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                                 </div>

                                 {/* Doc List */}
                                 <div className="space-y-2">
                                     {formData.documents.map((doc, idx) => (
                                         <div key={idx} className="flex items-center justify-between p-2 rounded-lg border border-slate-200 bg-white hover:border-blue-300 transition-colors">
                                             <div className="flex items-center gap-3">
                                                 <div className="h-8 w-8 rounded bg-red-100 text-red-600 flex items-center justify-center">
                                                     <FileText size={16} />
                                                 </div>
                                                 <div>
                                                     <div className="text-sm font-bold text-slate-800">{doc.name}</div>
                                                     <div className="text-[10px] text-slate-400">{doc.size}</div>
                                                 </div>
                                             </div>
                                             <button onClick={() => handleRemoveDoc(idx)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                 <Trash2 size={14} />
                                             </button>
                                         </div>
                                     ))}
                                     {formData.documents.length === 0 && (
                                         <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">
                                             <p className="text-xs text-slate-400">Kéo thả tài liệu hoặc nhấn "Tải lên"</p>
                                         </div>
                                     )}
                                 </div>
                             </div>

                         </div>

                         {/* Footer Actions */}
                         <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                             <button onClick={() => setShowForm(false)} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors">
                                 Hủy bỏ
                             </button>
                             <button onClick={handleSaveEvent} className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/20 flex items-center gap-2">
                                 <Check size={16} /> {formData.id ? "Cập nhật" : "Lưu cuộc họp"}
                             </button>
                         </div>
                    </div>
                </div>
            )}

            {/* --- Document Selection Modal --- */}
            {showDocModal && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
                    <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <FolderOpen size={18} className="text-blue-600" /> Chọn tài liệu từ kho
                            </h3>
                            <button onClick={() => setShowDocModal(false)} className="p-1 rounded hover:bg-slate-200 text-slate-500 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto custom-scrollbar space-y-2">
                            {availableDocs.length > 0 ? (
                                availableDocs.map(doc => {
                                    const isSelected = formData?.documents.some(d => d.name === doc.name);
                                    return (
                                        <div 
                                            key={doc.id} 
                                            onClick={() => !isSelected && handleAddDocFromRepo(doc)}
                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                                                isSelected 
                                                ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed' 
                                                : 'bg-white border-slate-100 hover:border-blue-300 hover:shadow-md'
                                            }`}
                                        >
                                            <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                                <FileText size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-bold text-slate-800 truncate">{doc.name}</div>
                                                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                                    <span className="uppercase bg-slate-100 px-1.5 py-0.5 rounded">{doc.type}</span>
                                                    <span>{doc.size}</span>
                                                    <span>• {doc.date}</span>
                                                </div>
                                            </div>
                                            {isSelected && <Check size={16} className="text-teal-500" />}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-8 text-slate-400">
                                    <p>Kho tài liệu trống</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </ScrollReveal>
      </div>
    </section>
  );
};

export default MeetingCalendar;