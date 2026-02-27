import React, { useState, useEffect, useRef } from 'react';
import { Video, Mic, UserPlus, Upload, X, Minimize2, Maximize2, Users, FileText, Send, Paperclip, CheckCircle2, Eye, FileType, Clock, Calendar, ChevronRight, ArrowLeft, MapPin, Loader2, ShieldCheck, Database, Search, CheckSquare, Square, Info, ShieldAlert } from 'lucide-react';
import MeetingRoom from './MeetingRoom';
import { getCurrentUnitData, saveCurrentUnitBookings, Booking, Room, Document } from '../utils/dataManager';

// --- Types ---
type MeetingStatus = 'finished' | 'ongoing' | 'upcoming';

interface MeetingUser {
    name: string;
    role: string;
    status: 'online' | 'offline';
}

interface MeetingDoc {
    id?: number;
    name: string;
    type: 'pdf' | 'doc' | 'docx' | 'xlsx' | 'pptx' | 'file';
    size: string;
    url: string;
    fromRepo?: boolean; // Flag to indicate link with Repository
}

interface DailyMeeting {
    id: number;
    title: string;
    timeStart: string;
    timeEnd: string;
    code: string;
    location: string;
    status: MeetingStatus;
    attendees: MeetingUser[];
    documents: MeetingDoc[];
    host?: string;
}

interface OngoingMeetingBubbleProps {
    onJoinMeeting?: (meeting: { id?: number; title: string; code: string; documents?: any[] }) => void;
}

const OngoingMeetingBubble: React.FC<OngoingMeetingBubbleProps> = ({ onJoinMeeting }) => {
    // View State: 'collapsed' -> 'list' -> 'detail' -> 'room'
    const [viewState, setViewState] = useState<'collapsed' | 'list' | 'detail' | 'room'>('collapsed');
    const [selectedMeeting, setSelectedMeeting] = useState<DailyMeeting | null>(null);
    const [activeTab, setActiveTab] = useState<'users' | 'docs'>('users');
    const [meetings, setMeetings] = useState<DailyMeeting[]>([]);
    
    // Timer & UI State
    const [time, setTime] = useState(0);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [newUserName, setNewUserName] = useState('');
    const [previewFile, setPreviewFile] = useState<MeetingDoc | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    
    // Repo Modal State
    const [showRepoModal, setShowRepoModal] = useState(false);
    const [repoSearch, setRepoSearch] = useState('');
    const [selectedRepoIds, setSelectedRepoIds] = useState<number[]>([]);
    
    // Role state for this widget (Assumed admin for this interaction)
    const [isAdmin] = useState(true);
    const [availableUsers, setAvailableUsers] = useState<MeetingUser[]>([]);
    const [availableDocs, setAvailableDocs] = useState<Document[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load data
    useEffect(() => {
        loadMeetings();
        
        const handleDataChange = () => loadMeetings();
        window.addEventListener('unit-change', handleDataChange);
        window.addEventListener('data-change', handleDataChange);
        
        return () => {
            window.removeEventListener('unit-change', handleDataChange);
            window.removeEventListener('data-change', handleDataChange);
        };
    }, []);

    const loadMeetings = () => {
        const data = getCurrentUnitData();
        const roomsMap = new Map(data.rooms.map(r => [r.id, r]));
        
        // Load available users for dropdown
        setAvailableUsers(data.users.map(u => ({
            name: u.name,
            role: u.role,
            status: u.status === 'active' ? 'online' : 'offline'
        })));

        // Load available docs
        setAvailableDocs(data.documents || []);
        
        // Filter for "today" - for demo purposes, we'll use the current date's day
        // If no meetings for today, we might want to show all or a specific set.
        // For this implementation, let's show ALL meetings to ensure visibility, 
        // but sort them to show today's or upcoming ones first.
        // Or better: filter by day matching today if possible.
        
        const todayDate = new Date().getDate();
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        // Map Booking to DailyMeeting
        const mappedMeetings: DailyMeeting[] = (data.bookings || []).map(booking => {
            const room = roomsMap.get(booking.roomId);
            
            // Determine status based on time (mock logic)
            // In a real app, compare booking.startTime/endTime with current time
            let status: MeetingStatus = 'upcoming';
            const now = new Date();
            const [startH, startM] = booking.startTime.split(':').map(Number);
            const [endH, endM] = booking.endTime.split(':').map(Number);
            
            // Simple check: if day matches today
            if (booking.day === todayDate) {
                const startTime = new Date(currentYear, currentMonth, todayDate, startH, startM, 0);
                const endTime = new Date(currentYear, currentMonth, todayDate, endH, endM, 0);
                
                if (now >= startTime && now <= endTime) {
                    status = 'ongoing';
                } else if (now > endTime) {
                    status = 'finished';
                }
            } else if (booking.day < todayDate) {
                status = 'finished';
            }
            
            // Override for demo: Make one specific meeting 'ongoing' if needed, or rely on real time.
            // Force the first meeting to be ongoing for demo purposes if no meeting is ongoing
            if (status !== 'ongoing' && booking.id === (data.bookings?.[0]?.id || 0)) {
                 status = 'ongoing';
            }
            
            return {
                id: booking.id,
                title: booking.title,
                timeStart: booking.startTime,
                timeEnd: booking.endTime,
                code: `MEET-${booking.id}`,
                location: room ? room.name : 'Unknown',
                status: status,
                host: booking.attendees[0]?.name || 'Unknown',
                attendees: booking.attendees.map(u => ({
                    name: u.name,
                    role: u.role,
                    status: u.status === 'active' ? 'online' : 'offline'
                })),
                documents: booking.documents.map((d: any, idx: number) => ({
                    id: idx,
                    name: d.name,
                    type: d.type || 'file',
                    size: d.size || 'Unknown',
                    url: d.url || '',
                    fromRepo: d.fromRepo || false
                }))
            };
        });

        // Sort: Ongoing -> Upcoming -> Finished
        mappedMeetings.sort((a, b) => {
            const statusOrder = { ongoing: 0, upcoming: 1, finished: 2 };
            return statusOrder[a.status] - statusOrder[b.status];
        });

        setMeetings(mappedMeetings);
        
        // If we have a selected meeting, update it with fresh data
        if (selectedMeeting) {
            const updated = mappedMeetings.find(m => m.id === selectedMeeting.id);
            if (updated) setSelectedMeeting(updated);
        }
    };

    // Timer logic for Ongoing meeting duration
    useEffect(() => {
        const interval = setInterval(() => {
            setTime((t) => t + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleMeetingClick = (meeting: DailyMeeting) => {
        setSelectedMeeting(meeting);
        setViewState('detail');
        setActiveTab('users');
    };

    const handleBackToList = () => {
        setViewState('list');
        setSelectedMeeting(null);
    };

    const handleJoinRoom = () => {
        if (onJoinMeeting && selectedMeeting) {
            onJoinMeeting({
                id: selectedMeeting.id,
                title: selectedMeeting.title,
                code: selectedMeeting.code,
                documents: selectedMeeting.documents
            });
        } else {
            setViewState('room');
        }
    };

    const handleLeaveRoom = () => {
        setViewState('detail');
    };

    const handleAddUser = (user: MeetingUser) => {
        if (selectedMeeting) {
            const updatedMeeting = { ...selectedMeeting, attendees: [...selectedMeeting.attendees, user] };
            setSelectedMeeting(updatedMeeting);
            setShowInviteModal(false);
        }
    };

    const saveMeetingUpdates = (meetingId: number, newDocuments: MeetingDoc[]) => {
        const data = getCurrentUnitData();
        const currentBookings = data.bookings || [];
        
        const updatedBookings = currentBookings.map(b => {
            if (b.id === meetingId) {
                return {
                    ...b,
                    documents: newDocuments.map(d => ({
                        name: d.name,
                        size: d.size,
                        type: d.type,
                        url: d.url,
                        fromRepo: d.fromRepo
                    }))
                };
            }
            return b;
        });
        
        saveCurrentUnitBookings(updatedBookings);
    };

    const handleBatchUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !selectedMeeting) return;
        
        const files: File[] = Array.from(e.target.files);
        if (files.length === 0) return;

        if (files.length > 10) {
            alert("Vui lòng chọn tối đa 10 tài liệu cùng lúc.");
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setIsUploading(true);

        setTimeout(() => {
            const newDocs: MeetingDoc[] = files.map(file => {
                const ext = file.name.split('.').pop()?.toLowerCase() || 'file';
                const sizeMB = file.size / (1024 * 1024);
                const sizeStr = sizeMB < 1 
                    ? `${(file.size / 1024).toFixed(0)} KB` 
                    : `${sizeMB.toFixed(1)} MB`;

                return {
                    name: file.name,
                    type: (['pdf', 'doc', 'docx', 'xlsx', 'pptx'].includes(ext) ? ext : 'file') as any,
                    size: sizeStr,
                    url: URL.createObjectURL(file),
                    fromRepo: false
                };
            });

            const updatedDocs = [...selectedMeeting.documents, ...newDocs];
            const updatedMeeting = { 
                ...selectedMeeting, 
                documents: updatedDocs 
            };
            
            setSelectedMeeting(updatedMeeting);
            saveMeetingUpdates(selectedMeeting.id, updatedDocs);
            setIsUploading(false);
            
            if (fileInputRef.current) fileInputRef.current.value = '';
        }, 1500);
    };

    const toggleRepoSelection = (id: number) => {
        setSelectedRepoIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleAddFromRepo = () => {
        if (!selectedMeeting) return;

        const docsToAdd = availableDocs.filter(d => selectedRepoIds.includes(d.id)).map(d => ({
            id: d.id,
            name: d.name,
            type: d.type as any,
            size: d.size,
            url: d.url || '',
            fromRepo: true
        }));

        const updatedDocs = [...selectedMeeting.documents, ...docsToAdd];
        const updatedMeeting = { 
            ...selectedMeeting, 
            documents: updatedDocs
        };

        setSelectedMeeting(updatedMeeting);
        saveMeetingUpdates(selectedMeeting.id, updatedDocs);
        setShowRepoModal(false);
        setSelectedRepoIds([]);
    };

    const handleMeetingRoomAddDocument = async (file: File) => {
        if (!selectedMeeting) return;

        return new Promise<void>((resolve) => {
            setTimeout(() => {
                const ext = file.name.split('.').pop()?.toLowerCase() || 'file';
                const sizeMB = file.size / (1024 * 1024);
                const sizeStr = sizeMB < 1 
                    ? `${(file.size / 1024).toFixed(0)} KB` 
                    : `${sizeMB.toFixed(1)} MB`;

                const newDoc: MeetingDoc = {
                    id: selectedMeeting.documents.length,
                    name: file.name,
                    type: (['pdf', 'doc', 'docx', 'xlsx', 'pptx'].includes(ext) ? ext : 'file') as any,
                    size: sizeStr,
                    url: URL.createObjectURL(file),
                    fromRepo: false
                };

                const updatedDocs = [...selectedMeeting.documents, newDoc];
                const updatedMeeting = { 
                    ...selectedMeeting, 
                    documents: updatedDocs 
                };
                
                setSelectedMeeting(updatedMeeting);
                saveMeetingUpdates(selectedMeeting.id, updatedDocs);
                resolve();
            }, 1000);
        });
    };

    const handleMeetingRoomAddRepoDocuments = async (docs: any[]) => {
        if (!selectedMeeting) return;

        const newDocs = docs
            .filter(doc => !selectedMeeting.documents.some(d => d.name === doc.name))
            .map(doc => ({
                id: selectedMeeting.documents.length + Math.random(), // Temp ID
                name: doc.name,
                type: doc.type as any,
                size: doc.size,
                url: doc.url || '',
                fromRepo: true
            }));

        if (newDocs.length === 0) return;

        const updatedDocs = [...selectedMeeting.documents, ...newDocs];
        const updatedMeeting = { 
            ...selectedMeeting, 
            documents: updatedDocs 
        };
        
        setSelectedMeeting(updatedMeeting);
        saveMeetingUpdates(selectedMeeting.id, updatedDocs);
    };

    if (viewState === 'room' && selectedMeeting) {
        return (
            <MeetingRoom 
                onLeave={handleLeaveRoom} 
                meetingTitle={selectedMeeting.title} 
                meetingCode={selectedMeeting.code} 
                documents={selectedMeeting.documents}
                onAddDocument={handleMeetingRoomAddDocument}
                onAddRepoDocuments={handleMeetingRoomAddRepoDocuments}
            />
        );
    }

    if (viewState === 'collapsed') {
        const ongoing = meetings.find(m => m.status === 'ongoing');
        return (
            <div className="fixed bottom-6 right-6 z-50 animate-bounce-slow">
                <button 
                    onClick={() => setViewState('list')}
                    className="relative flex items-center gap-3 pl-4 pr-6 py-3 bg-white/90 backdrop-blur-md border border-teal-500/30 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:scale-105 transition-transform group"
                >
                    <span className="relative flex h-3 w-3">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${ongoing ? 'bg-red-400' : 'bg-green-400'}`}></span>
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${ongoing ? 'bg-red-500' : 'bg-green-500'}`}></span>
                    </span>
                    <div className="flex flex-col items-start text-left">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">
                            {ongoing ? 'Đang họp' : 'Lịch hôm nay'}
                        </span>
                        <span className="text-sm font-bold text-slate-800 group-hover:text-teal-600 transition-colors max-w-[150px] truncate leading-none">
                            {ongoing ? ongoing.title : `${meetings.length} phiên họp`}
                        </span>
                    </div>
                    <div className="absolute -top-1 -right-1 h-6 w-6 bg-teal-500 rounded-full flex items-center justify-center text-white shadow-md">
                        <Calendar size={12} />
                    </div>
                </button>
            </div>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <div className="w-[380px] bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300 relative">
                
                {/* Global Header */}
                <div className="bg-gradient-to-r from-teal-600 to-blue-600 p-4 text-white flex items-center justify-between shadow-md relative z-10 shrink-0">
                    <div className="flex items-center gap-2">
                        {viewState === 'detail' && (
                            <button onClick={handleBackToList} className="mr-1 hover:bg-white/20 p-1 rounded-full transition-colors">
                                <ArrowLeft size={16} />
                            </button>
                        )}
                        <div>
                            <h3 className="font-black text-sm leading-none flex items-center gap-2 uppercase tracking-wide">
                                <ShieldCheck size={14} className="text-teal-300" />
                                Ecabinet Hub
                            </h3>
                            <div className="text-[10px] opacity-75 mt-1 font-bold">
                                {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={() => setViewState('collapsed')}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <Minimize2 size={18} />
                    </button>
                </div>

                {/* VIEW: LIST OF MEETINGS */}
                {viewState === 'list' && (
                    <div className="max-h-[440px] overflow-y-auto bg-slate-50 p-3 space-y-2.5 custom-scrollbar">
                        {meetings.map((meeting) => (
                            <div 
                                key={meeting.id}
                                onClick={() => handleMeetingClick(meeting)}
                                className={`group p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-lg ${
                                    meeting.status === 'ongoing' 
                                    ? 'bg-white border-teal-500/40 shadow-sm ring-1 ring-teal-500/10' 
                                    : 'bg-white border-slate-100 hover:border-teal-200 shadow-sm'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                            meeting.status === 'ongoing' ? 'bg-red-500 text-white animate-pulse' :
                                            meeting.status === 'finished' ? 'bg-slate-200 text-slate-500' :
                                            'bg-blue-100 text-blue-600'
                                        }`}>
                                            {meeting.status === 'ongoing' ? 'Trực tiếp' : 
                                             meeting.status === 'finished' ? 'Kết thúc' : 'Sắp diễn ra'}
                                        </div>
                                        <div className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                            {meeting.timeStart}
                                        </div>
                                    </div>
                                    {meeting.status === 'ongoing' && (
                                        <div className="h-2 w-2 rounded-full bg-red-500 ring-4 ring-red-500/20"></div>
                                    )}
                                </div>
                                <h4 className={`font-black text-[15px] mb-2 leading-tight ${meeting.status === 'finished' ? 'text-slate-400' : 'text-slate-800 group-hover:text-teal-700'}`}>
                                    {meeting.title}
                                </h4>
                                <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400">
                                    <span className="flex items-center gap-1.5"><MapPin size={12} className="text-blue-500" /> {meeting.location}</span>
                                    <span className="flex items-center gap-1.5"><Users size={12} className="text-teal-500" /> {meeting.attendees.length} đại biểu</span>
                                </div>
                                {meeting.status === 'ongoing' && (
                                    <button 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            if (onJoinMeeting) {
                                                onJoinMeeting({
                                                    id: meeting.id,
                                                    title: meeting.title,
                                                    code: meeting.code
                                                });
                                            } else {
                                                setSelectedMeeting(meeting);
                                                setViewState('room');
                                            }
                                        }}
                                        className="mt-4 w-full py-2 bg-gradient-to-r from-teal-600 to-teal-500 text-white text-xs font-black rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
                                    >
                                        <Video size={14} /> THAM GIA PHIÊN HỌP
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* VIEW: MEETING DETAIL */}
                {viewState === 'detail' && selectedMeeting && (
                    <div className="flex flex-col h-[480px]">
                        {/* Persistent Ongoing Meeting Action Bar */}
                        <div className={`p-4 flex flex-col border-b shrink-0 transition-all ${selectedMeeting.status === 'ongoing' ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex items-start justify-between">
                                <div className="flex flex-col min-w-0 pr-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className={`font-black text-base truncate ${selectedMeeting.status === 'ongoing' ? 'text-white' : 'text-slate-800'}`}>
                                            {selectedMeeting.title}
                                        </h4>
                                    </div>
                                    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold ${selectedMeeting.status === 'ongoing' ? 'text-slate-400' : 'text-slate-500'}`}>
                                        <span className="flex items-center gap-1"><Clock size={12} className="text-teal-400" /> {selectedMeeting.timeStart} - {selectedMeeting.timeEnd}</span>
                                        <span className="flex items-center gap-1"><MapPin size={12} className="text-blue-400" /> {selectedMeeting.location}</span>
                                        {selectedMeeting.status === 'ongoing' && (
                                            <span className="text-red-400 font-mono tracking-tighter bg-red-400/10 px-1.5 py-0.5 rounded-full border border-red-500/20">
                                                LIVE: {formatDuration(time)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {selectedMeeting.status === 'ongoing' && (
                                    <div className="flex flex-col gap-2 shrink-0">
                                        <button 
                                            onClick={handleJoinRoom}
                                            className="bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-black px-4 py-2 rounded-xl shadow-lg shadow-teal-500/30 transition-all flex items-center gap-2"
                                        >
                                            <Video size={14} /> VÀO PHÒNG
                                        </button>
                                        {isAdmin && (
                                            <button 
                                                onClick={() => setShowInviteModal(true)}
                                                className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black px-4 py-2 rounded-xl border border-white/10 transition-all flex items-center gap-2"
                                            >
                                                <UserPlus size={14} /> ADD USERS
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            {selectedMeeting.host && (
                                <div className="mt-3 flex items-center justify-between">
                                    <div className={`text-[10px] font-bold flex items-center gap-2 ${selectedMeeting.status === 'ongoing' ? 'text-slate-400' : 'text-slate-500'}`}>
                                        <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-[9px] text-white">
                                            {selectedMeeting.host.charAt(0)}
                                        </div>
                                        <span>Chủ trì: <span className={selectedMeeting.status === 'ongoing' ? 'text-teal-400' : 'text-slate-800'}>{selectedMeeting.host}</span></span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <ShieldCheck size={14} className="text-teal-500" />
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${selectedMeeting.status === 'ongoing' ? 'text-slate-500' : 'text-slate-400'}`}>BẢO MẬT AES-256</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-slate-100 bg-white shrink-0 shadow-sm z-10">
                            <button 
                                onClick={() => setActiveTab('users')}
                                className={`flex-1 py-3.5 text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${activeTab === 'users' ? 'text-teal-600 bg-teal-50/50 border-b-2 border-teal-500' : 'text-slate-400 hover:bg-slate-50'}`}
                            >
                                <Users size={14} /> Đại biểu ({selectedMeeting.attendees.length})
                            </button>
                            <button 
                                onClick={() => setActiveTab('docs')}
                                className={`flex-1 py-3.5 text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${activeTab === 'docs' ? 'text-blue-600 bg-blue-50/50 border-b-2 border-blue-500' : 'text-slate-400 hover:bg-slate-50'}`}
                            >
                                <FileText size={14} /> Tài liệu ({selectedMeeting.documents.length})
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto bg-white p-3 relative custom-scrollbar">
                            {activeTab === 'users' ? (
                                <div className="space-y-2">
                                    {selectedMeeting.attendees.map((u, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-teal-200 transition-all animate-in fade-in slide-in-from-left-2">
                                            <div className="relative">
                                                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-sm font-black text-slate-600 shrink-0 border border-slate-100">
                                                    {u.name.charAt(0)}
                                                </div>
                                                {u.status === 'online' && (
                                                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-white ring-2 ring-green-500/20"></div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[13px] text-slate-800 font-black truncate leading-none mb-1">{u.name}</div>
                                                <div className="text-[10px] text-slate-400 font-bold tracking-tight truncate leading-none uppercase">{u.role}</div>
                                            </div>
                                            {u.status === 'online' && selectedMeeting.status === 'ongoing' && (
                                                <span className="text-[9px] text-green-600 font-black bg-green-50 px-2 py-0.5 rounded-full border border-green-200 shrink-0 uppercase tracking-wider">Trực tuyến</span>
                                            )}
                                        </div>
                                    ))}
                                    
                                    {isAdmin && (
                                        <button 
                                            onClick={() => setShowInviteModal(true)}
                                            className="w-full mt-2 py-3 bg-slate-50 border-2 border-dashed border-slate-200 text-slate-500 hover:text-teal-600 hover:border-teal-300 hover:bg-teal-50/50 rounded-2xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all group"
                                        >
                                            <UserPlus size={16} className="group-hover:scale-110 transition-transform" /> ADD USERS
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {selectedMeeting.documents.map((f, i) => (
                                        <div key={i} className="group flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-blue-200 transition-all animate-in fade-in slide-in-from-right-2">
                                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${f.type === 'pdf' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                <FileText size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 mb-1 leading-none">
                                                    <div className="text-[13px] text-slate-800 font-black truncate max-w-[140px]">{f.name}</div>
                                                    {f.fromRepo && (
                                                        <span title="Đồng bộ từ Kho tài liệu" className="text-[8px] font-black bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full flex items-center uppercase"><Database size={8} className="mr-0.5"/> Kho</span>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{f.size} • {f.type}</div>
                                            </div>
                                            <button 
                                                onClick={() => setPreviewFile(f)}
                                                className="p-2 text-slate-300 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all" 
                                                title="Xem nhanh"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    
                                    {isAdmin && (
                                        <div className="mt-4 space-y-2">
                                            <button 
                                                onClick={() => setShowRepoModal(true)}
                                                className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                                            >
                                                <Database size={14} /> CHỌN TỪ KHO SỐ
                                            </button>

                                            <div className="relative">
                                                <input 
                                                    type="file" 
                                                    hidden 
                                                    ref={fileInputRef} 
                                                    multiple 
                                                    onChange={handleBatchUpload}
                                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                                                />
                                                <button 
                                                    onClick={() => !isUploading && fileInputRef.current?.click()}
                                                    disabled={isUploading}
                                                    className="w-full py-2.5 border-2 border-dashed border-slate-200 text-slate-500 rounded-xl text-[11px] font-black uppercase tracking-wider hover:border-teal-400 hover:text-teal-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                    {isUploading ? (
                                                        <>
                                                            <Loader2 size={14} className="animate-spin" /> Đang tải...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload size={14} /> Tải từ thiết bị
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* MODALS */}
                        
                        {/* Invite Modal Overlay */}
                        {showInviteModal && (
                            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md z-[60] flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-200">
                                <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-[300px] border border-slate-100 flex flex-col items-center max-h-[400px]">
                                    <div className="h-14 w-14 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner shrink-0">
                                        <UserPlus size={28} />
                                    </div>
                                    <h4 className="font-black text-slate-800 mb-1 text-sm uppercase tracking-wide shrink-0">Mời đại biểu</h4>
                                    <p className="text-[11px] text-slate-500 mb-4 font-bold shrink-0">Chọn nhân sự để thêm vào cuộc họp</p>
                                    
                                    <div className="w-full flex-1 overflow-y-auto custom-scrollbar space-y-2 mb-4 border border-slate-100 rounded-xl p-2 bg-slate-50">
                                        {availableUsers
                                            .filter(u => !selectedMeeting?.attendees.some(att => att.name === u.name))
                                            .map((user, idx) => (
                                            <button 
                                                key={idx}
                                                onClick={() => handleAddUser(user)}
                                                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white hover:shadow-sm hover:border-teal-200 border border-transparent transition-all group text-left"
                                            >
                                                <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-black">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-bold text-slate-700 truncate group-hover:text-teal-700">{user.name}</div>
                                                    <div className="text-[9px] text-slate-400 uppercase">{user.role}</div>
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 text-teal-500">
                                                    <UserPlus size={14} />
                                                </div>
                                            </button>
                                        ))}
                                        {availableUsers.filter(u => !selectedMeeting?.attendees.some(att => att.name === u.name)).length === 0 && (
                                            <div className="text-center py-4 text-xs text-slate-400 italic">
                                                Tất cả nhân sự đã có mặt
                                            </div>
                                        )}
                                    </div>

                                    <button 
                                        onClick={() => setShowInviteModal(false)}
                                        className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shrink-0"
                                    >
                                        Đóng
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Repository Selection Modal */}
                        {showRepoModal && (
                            <div className="absolute inset-0 z-[70] bg-white flex flex-col animate-in slide-in-from-bottom-5 duration-200">
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                                    <h4 className="font-black text-sm text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                                        <Database size={16} className="text-blue-600" /> Kho tài liệu số
                                    </h4>
                                    <button onClick={() => setShowRepoModal(false)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="p-3 border-b border-slate-50">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                                        <input 
                                            value={repoSearch}
                                            onChange={(e) => setRepoSearch(e.target.value)}
                                            placeholder="Tìm tên văn bản, nghị quyết..."
                                            className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                                    {availableDocs
                                        .filter(d => d.name.toLowerCase().includes(repoSearch.toLowerCase()))
                                        .map(doc => {
                                            const isSelected = selectedRepoIds.includes(doc.id);
                                            return (
                                                <div 
                                                    key={doc.id}
                                                    onClick={() => toggleRepoSelection(doc.id)}
                                                    className={`flex items-start gap-4 p-3 rounded-2xl border cursor-pointer transition-all ${
                                                        isSelected 
                                                        ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-500/10' 
                                                        : 'bg-white border-slate-100 hover:border-blue-200'
                                                    }`}
                                                >
                                                    <div className={`mt-0.5 ${isSelected ? 'text-blue-600' : 'text-slate-300'}`}>
                                                        {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className={`text-xs font-black leading-tight mb-1.5 ${isSelected ? 'text-blue-800' : 'text-slate-800'}`}>
                                                            {doc.name}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                            <span className="bg-slate-100 px-1.5 py-0.5 rounded-md">{doc.type}</span>
                                                            <span>{doc.size}</span>
                                                            <span>{doc.date}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                                        ĐÃ CHỌN: <span className="text-blue-600 font-black">{selectedRepoIds.length}</span>
                                    </span>
                                    <button 
                                        onClick={handleAddFromRepo}
                                        disabled={selectedRepoIds.length === 0}
                                        className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20"
                                    >
                                        ĐỒNG BỘ TÀI LIỆU
                                    </button>
                                </div>
                            </div>
                        )}

                         {/* Preview Modal Overlay */}
                         {previewFile && (
                            <div className="absolute inset-0 z-[80] bg-slate-900 flex flex-col animate-in fade-in duration-200">
                                <div className="h-12 bg-slate-800 flex items-center justify-between px-4 text-white border-b border-slate-700 shrink-0">
                                    <span className="text-[11px] font-black truncate flex items-center gap-2 uppercase tracking-wider">
                                        <FileText size={16} className="text-teal-400" /> {previewFile.name}
                                    </span>
                                    <button onClick={() => setPreviewFile(null)} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="flex-1 flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-8 text-center">
                                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 flex flex-col items-center max-w-[240px]">
                                        <FileType size={48} className="text-teal-500 mb-4 opacity-75" />
                                        <h5 className="text-slate-800 font-black text-sm uppercase mb-1">Preview {previewFile.type}</h5>
                                        <p className="text-[11px] font-bold text-slate-400 leading-relaxed mb-4">Tài liệu đang được mã hóa và tải lên trình xem số hóa.</p>
                                        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-teal-500 w-[65%] animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OngoingMeetingBubble;