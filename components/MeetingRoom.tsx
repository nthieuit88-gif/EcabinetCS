import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, FileText, X, Download, Eye, Search, ZoomIn, ZoomOut, Printer, ChevronUp, ChevronDown, MoreVertical, FileSpreadsheet, File as FileIcon, Lock, Unlock, Shield, ShieldAlert, UserCog, Users, Plus, Upload, Loader2, Database, CheckSquare, Square, ChevronLeft, ChevronRight, Trash2, Pencil } from 'lucide-react';
import { getCurrentUnitData, Document, User } from '../utils/dataManager';
import * as XLSX from 'xlsx';
import { renderAsync } from 'docx-preview';
import { Document as PdfDocument, Page as PdfPage, pdfjs } from 'react-pdf';

// Import styles for react-pdf
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface MeetingRoomProps {
    onLeave: () => void;
    meetingTitle: string;
    meetingCode: string;
    documents?: any[];
    attendees?: any[];
    onAddDocument?: (file: File) => Promise<void>;
    onAddRepoDocuments?: (docs: Document[]) => Promise<void>;
    onUpdateDocuments?: (docs: any[]) => Promise<void>;
}

type UserRole = 'Admin' | 'Member';

interface DocItem {
    id: number;
    name: string;
    size: string;
    type: string;
    date: string;
    allowedRoles: UserRole[];
    url?: string;
    fromRepo?: boolean;
}

interface ParticipantItem {
    id: string;
    name: string;
    initial: string;
    color: string;
    isMuted?: boolean;
    isSpeaking?: boolean;
    role: string;
}

const Participant: React.FC<{ name: string; initial: string; color: string; isMuted?: boolean; isSpeaking?: boolean }> = ({ name, initial, color, isMuted, isSpeaking }) => (
    <div className={`relative bg-slate-800 rounded-2xl overflow-hidden flex items-center justify-center aspect-video group border-2 transition-all ${isSpeaking ? 'border-teal-500 shadow-[0_0_0_4px_rgba(20,184,166,0.2)]' : 'border-transparent'}`}>
        <div className={`h-24 w-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-inner ${color}`}>
            {initial}
        </div>
        <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm text-white font-medium flex items-center gap-2">
            {isMuted ? <MicOff size={14} className="text-red-400" /> : <div className={`h-2 w-2 rounded-full bg-green-500 ${isSpeaking ? 'animate-pulse' : ''}`}></div>}
            {name}
        </div>
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-2 bg-slate-900/60 rounded-full text-white hover:bg-slate-700 backdrop-blur-sm">
                <MoreVertical size={18} />
            </button>
        </div>
    </div>
);

// --- DOCUMENT VIEWER COMPONENT ---
const DocumentViewer: React.FC<{ doc: DocItem; onClose: () => void }> = ({ doc, onClose }) => {
    const isPdf = doc.type === 'pdf';
    const hasUrl = !!doc.url;
    const [content, setContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const docxContainerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    
    // PDF State
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setLoading(false);
    };

    const changePage = (offset: number) => {
        setPageNumber(prevPageNumber => prevPageNumber + offset);
    };

    const previousPage = () => changePage(-1);
    const nextPage = () => changePage(1);

    useEffect(() => {
        setPageNumber(1);
        setScale(1);
        setNumPages(null);
    }, [doc.id]);

    useEffect(() => {
        const loadContent = async () => {
            if (!hasUrl) return;
            
            setLoading(true);
            setError(null);
            
            try {
                if (doc.type === 'docx') {
                    const response = await fetch(doc.url!);
                    if (!response.ok) throw new Error(`Failed to fetch document: ${response.statusText}`);
                    const blob = await response.blob();
                    if (docxContainerRef.current) {
                        // Clear previous content
                        docxContainerRef.current.innerHTML = '';
                        await renderAsync(blob, docxContainerRef.current, null, {
                            className: 'docx',
                            inWrapper: true,
                            ignoreWidth: false,
                            ignoreHeight: false,
                            ignoreFonts: false,
                            breakPages: true,
                            ignoreLastRenderedPageBreak: true,
                            experimental: false,
                            trimXmlDeclaration: true,
                            debug: false,
                        });
                    }
                    setLoading(false);
                } else if (doc.type === 'xlsx' || doc.type === 'xls') {
                    const response = await fetch(doc.url!);
                    const arrayBuffer = await response.arrayBuffer();
                    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                    
                    let html = '<div class="excel-viewer space-y-8">';
                    workbook.SheetNames.forEach(sheetName => {
                        const worksheet = workbook.Sheets[sheetName];
                        const sheetHtml = XLSX.utils.sheet_to_html(worksheet);
                        html += `
                            <div class="sheet-section">
                                <h3 class="text-lg font-bold text-slate-800 mb-3 pb-2 border-b border-slate-200 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-600"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="9" y2="21"/></svg>
                                    ${sheetName}
                                </h3>
                                <div class="overflow-x-auto custom-scrollbar pb-4">
                                    ${sheetHtml}
                                </div>
                            </div>
                        `;
                    });
                    html += '</div>';
                    setContent(html);
                } else if (doc.type === 'txt') {
                    const response = await fetch(doc.url!);
                    const text = await response.text();
                    setContent(`<pre class="whitespace-pre-wrap font-mono text-sm bg-white p-8 shadow-lg min-h-[800px]">${text}</pre>`);
                }
            } catch (err) {
                // Silently handle fetch errors (e.g., expired blob URLs or CORS issues)
                // console.warn("Document load failed:", err);
                if (doc.url?.startsWith('blob:')) {
                    setError("Tệp cục bộ đã hết hạn. Vui lòng tải lên lại tài liệu.");
                } else {
                    setError("Không thể tải nội dung tài liệu. Vui lòng tải xuống để xem.");
                }
            } finally {
                setLoading(false);
            }
        };

        if (['docx', 'xlsx', 'xls', 'txt'].includes(doc.type)) {
            // Small delay to ensure ref is attached
            setTimeout(loadContent, 50);
        }
    }, [doc]);

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 2));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
    const handlePrint = () => window.print();

    const isLocalFile = doc.url?.startsWith('blob:') || doc.url?.startsWith('file:');

    return (
        <div className="flex flex-col h-full bg-slate-900 animate-in zoom-in-95 duration-200">
            {/* Viewer Header */}
            <div className="h-14 px-4 bg-slate-800 border-b border-white/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-teal-500/20 text-teal-400 flex items-center justify-center">
                        <FileText size={18} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="text-sm font-bold text-white leading-tight">{doc.name}</div>
                            {doc.allowedRoles.length === 1 && doc.allowedRoles.includes('Admin') && (
                                <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 rounded flex items-center gap-1">
                                    <Lock size={8} /> Admin Only
                                </span>
                            )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                            {isPdf && hasUrl ? 'Trình xem PDF' : (content || doc.type === 'docx' ? 'Trình xem nội dung' : 'Chế độ xem trước')} • {doc.size}
                        </div>
                    </div>
                </div>
                
                {/* Viewer Toolbar */}
                <div className="flex items-center gap-1 bg-slate-700/50 p-1 rounded-lg border border-white/5">
                    {isPdf ? (
                        <>
                            <button 
                                disabled={pageNumber <= 1} 
                                onClick={previousPage} 
                                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-50"
                                title="Trang trước"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-xs font-mono text-slate-300 px-2 text-center">
                                {pageNumber} / {numPages || '--'}
                            </span>
                            <button 
                                disabled={numPages !== null && pageNumber >= numPages} 
                                onClick={nextPage} 
                                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-50"
                                title="Trang sau"
                            >
                                <ChevronRight size={16} />
                            </button>
                            <div className="w-px h-4 bg-white/10 mx-1"></div>
                            <button onClick={handleZoomOut} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Thu nhỏ"><ZoomOut size={16} /></button>
                            <span className="text-xs font-mono text-slate-300 w-12 text-center">{Math.round(scale * 100)}%</span>
                            <button onClick={handleZoomIn} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Phóng to"><ZoomIn size={16} /></button>
                            <div className="w-px h-4 bg-white/10 mx-1"></div>
                        </>
                    ) : (
                        <>
                            <button onClick={handleZoomOut} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Thu nhỏ"><ZoomOut size={16} /></button>
                            <span className="text-xs font-mono text-slate-300 w-12 text-center">{Math.round(scale * 100)}%</span>
                            <button onClick={handleZoomIn} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Phóng to"><ZoomIn size={16} /></button>
                            <div className="w-px h-4 bg-white/10 mx-1"></div>
                        </>
                    )}
                    <button onClick={handlePrint} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="In"><Printer size={16} /></button>
                    <a href={doc.url} download={doc.name} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Tải về"><Download size={16} /></a>
                </div>

                <button onClick={onClose} className="p-2 bg-slate-700 hover:bg-red-500 text-white rounded-lg transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Viewer Body */}
            <div className="flex-1 bg-[#525659] overflow-hidden flex justify-center relative">
                {isPdf && hasUrl ? (
                    <div className="w-full h-full overflow-auto flex justify-center p-8 custom-scrollbar">
                        <div className="shadow-2xl">
                            <PdfDocument
                                file={doc.url}
                                onLoadSuccess={onDocumentLoadSuccess}
                                onLoadError={(error) => setError(`Lỗi tải PDF: ${error.message}`)}
                                loading={
                                    <div className="flex flex-col items-center justify-center p-10 text-white">
                                        <Loader2 className="animate-spin mb-2" size={32} />
                                        <span>Đang tải tài liệu...</span>
                                    </div>
                                }
                                error={
                                    <div className="flex flex-col items-center justify-center p-10 text-red-400">
                                        <ShieldAlert className="mb-2" size={32} />
                                        <span>Không thể tải tài liệu này.</span>
                                    </div>
                                }
                            >
                                <PdfPage 
                                    pageNumber={pageNumber} 
                                    scale={scale} 
                                    renderTextLayer={true} 
                                    renderAnnotationLayer={true}
                                    className="bg-white"
                                />
                            </PdfDocument>
                        </div>
                    </div>
                ) : doc.type === 'docx' && hasUrl ? (
                    <div className="w-full h-full overflow-auto relative custom-scrollbar bg-[#525659] p-8">
                        {loading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 z-10 text-slate-600">
                                <Loader2 className="animate-spin mb-2" size={32} />
                                <span>Đang tải nội dung...</span>
                            </div>
                        )}
                        <div 
                            ref={docxContainerRef} 
                            className="bg-white shadow-2xl mx-auto min-h-[1000px] origin-top transition-transform duration-200 ease-out"
                            style={{ transform: `scale(${scale})`, width: '800px' }} 
                        />
                    </div>
                ) : (doc.type === 'doc' || doc.type === 'pptx') && hasUrl ? (
                    isLocalFile ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-300 p-8 text-center">
                            <div className="bg-slate-700 p-6 rounded-full mb-6">
                                <FileText size={48} className="text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Không thể xem trước file cục bộ</h3>
                            <p className="max-w-md text-slate-400 mb-6">
                                Trình duyệt không hỗ trợ xem trước trực tiếp định dạng <strong>.{doc.type}</strong> từ máy tính cá nhân.
                                <br/>Vui lòng tải lên hệ thống hoặc tải về để xem.
                            </p>
                            <a href={doc.url} download={doc.name} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors flex items-center gap-2">
                                <Download size={20} /> Tải xuống tài liệu
                            </a>
                        </div>
                    ) : (
                        <iframe 
                            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(doc.url!)}`}
                            className="w-full h-full border-none bg-white" 
                            title="Office Viewer"
                        />
                    )
                ) : (
                    <div className="w-full h-full overflow-y-auto p-8 flex justify-center custom-scrollbar">
                        <div 
                            className="w-[800px] min-h-[1132px] bg-white shadow-2xl p-[60px] text-slate-900 relative origin-top transition-transform duration-200"
                            style={{ transform: `scale(${scale})` }}
                        >
                            {loading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 text-slate-500">
                                    <Loader2 className="animate-spin mb-2" size={32} />
                                    <span>Đang tải nội dung...</span>
                                </div>
                            )}
                            
                            {error && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 text-red-500">
                                    <ShieldAlert className="mb-2" size={32} />
                                    <span>{error}</span>
                                </div>
                            )}

                            {content && (
                                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
                            )}

                            {!content && !loading && !error && (
                                <>
                                    {/* Mock Content based on file type */}
                                    <div className="text-center mb-10">
                                        <div className="text-sm font-bold text-slate-500 mb-1">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                                        <div className="text-xs font-bold text-slate-500 underline mb-6">Độc lập - Tự do - Hạnh phúc</div>
                                        <h1 className="text-2xl font-bold uppercase mb-4 text-slate-900 leading-snug">{doc.name.split('.')[0]}</h1>
                                        <div className="h-px w-32 bg-slate-300 mx-auto"></div>
                                    </div>

                                    <div className="space-y-6 text-justify text-[15px] leading-relaxed font-serif">
                                        <p>
                                            <strong>Hà Nội, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</strong>
                                        </p>
                                        <p>
                                            Căn cứ vào Luật Doanh nghiệp số 59/2020/QH14 được Quốc hội nước Cộng hòa xã hội chủ nghĩa Việt Nam thông qua ngày 17/06/2020;
                                        </p>
                                        <p>
                                            Căn cứ vào Điều lệ tổ chức và hoạt động hiện hành của Công ty;
                                        </p>
                                        <p>
                                            Căn cứ vào Biên bản họp Hội đồng Quản trị số 12/BB-HĐQT về việc triển khai các hạng mục chuyển đổi số trong công tác quản trị và điều hành doanh nghiệp;
                                        </p>
                                        
                                        <h3 className="font-bold text-lg mt-8">QUYẾT ĐỊNH:</h3>
                                        
                                        <div className="pl-4">
                                            <p className="mb-4"><strong>Điều 1.</strong> Phê duyệt nội dung tài liệu "{doc.name}" làm cơ sở để các phòng ban liên quan triển khai thực hiện trong Quý hiện tại.</p>
                                            <p className="mb-4"><strong>Điều 2.</strong> Giao cho Giám đốc các Khối/Phòng ban căn cứ vào chức năng nhiệm vụ, có trách nhiệm hướng dẫn, đôn đốc và kiểm tra việc thực hiện Quyết định này.</p>
                                            <p className="mb-4"><strong>Điều 3.</strong> Quyết định này có hiệu lực kể từ ngày ký. Các ông (bà) Chánh Văn phòng, Giám đốc các Khối và Thủ trưởng các đơn vị liên quan chịu trách nhiệm thi hành Quyết định này.</p>
                                        </div>

                                        <div className="flex justify-between mt-16 pt-8">
                                            <div className="text-center w-1/2">
                                                <p className="font-bold italic text-sm">Nơi nhận:</p>
                                                <p className="text-sm">- Như Điều 3;</p>
                                                <p className="text-sm">- Lưu VT, HĐQT.</p>
                                            </div>
                                            <div className="text-center w-1/2">
                                                <p className="font-bold uppercase text-sm">TM. HỘI ĐỒNG QUẢN TRỊ</p>
                                                <p className="font-bold uppercase text-sm mt-1">CHỦ TỊCH</p>
                                                <div className="h-24"></div> {/* Signature Space */}
                                                <p className="font-bold">Nguyễn Văn A</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-10 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700 text-center">
                                        Đây là bản xem trước mô phỏng. Vui lòng tải xuống để xem định dạng gốc.
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const MeetingRoom: React.FC<MeetingRoomProps> = ({ onLeave, meetingTitle, meetingCode, documents = [], attendees = [], onAddDocument, onAddRepoDocuments, onUpdateDocuments }) => {
    const [micOn, setMicOn] = useState(true);
    const [cameraOn, setCameraOn] = useState(true);
    const [viewingDoc, setViewingDoc] = useState<DocItem | null>(null);
    const [time, setTime] = useState(new Date());
    const [activeTab, setActiveTab] = useState<'documents' | 'participants'>('documents');
    
    // Add Document State
    const [isAddingDoc, setIsAddingDoc] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Repo Modal State
    const [showRepoModal, setShowRepoModal] = useState(false);
    const [repoDocs, setRepoDocs] = useState<Document[]>([]);
    const [selectedRepoDocIds, setSelectedRepoDocIds] = useState<number[]>([]);

    // Role Based Access Control State
    const [currentUserRole, setCurrentUserRole] = useState<UserRole>('Admin');

    // Participants State (Moved here to fix ReferenceError)
    const [participants, setParticipants] = useState<ParticipantItem[]>(() => {
        const storedUser = localStorage.getItem('ECABINET_AUTH_USER');
        const currentUser = storedUser ? JSON.parse(storedUser) : null;

        if (attendees && attendees.length > 0) {
            return attendees
                .filter(user => !currentUser || user.id !== currentUser.id)
                .map((user, index) => {
                    const colors = [
                        "bg-gradient-to-br from-blue-500 to-blue-600",
                        "bg-gradient-to-br from-purple-500 to-purple-600",
                        "bg-gradient-to-br from-orange-500 to-orange-600",
                        "bg-gradient-to-br from-indigo-500 to-indigo-600",
                        "bg-gradient-to-br from-pink-500 to-pink-600",
                        "bg-gradient-to-br from-teal-500 to-teal-600"
                    ];
                    return {
                        id: user.id?.toString() || index.toString(),
                        name: user.name,
                        initial: user.name.charAt(0).toUpperCase(),
                        color: colors[index % colors.length],
                        role: user.role || 'Member',
                        isSpeaking: index === 0,
                        isMuted: index !== 0
                    };
                });
        }
        return [
            { id: '1', name: "Nguyễn Văn A", initial: "A", color: "bg-gradient-to-br from-blue-500 to-blue-600", isSpeaking: true, role: 'Admin' },
            { id: '2', name: "Trần Thị B", initial: "B", color: "bg-gradient-to-br from-purple-500 to-purple-600", isMuted: true, role: 'Member' },
            { id: '3', name: "Lê Hoàng C", initial: "C", color: "bg-gradient-to-br from-orange-500 to-orange-600", role: 'Member' },
            { id: '4', name: "Phạm Minh D", initial: "D", color: "bg-gradient-to-br from-indigo-500 to-indigo-600", role: 'Member' },
            { id: '5', name: "Hoàng Thùy L", initial: "L", color: "bg-gradient-to-br from-pink-500 to-pink-600", role: 'Member' },
        ];
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('ECABINET_AUTH_USER');
        const currentUser = storedUser ? JSON.parse(storedUser) : null;

        if (attendees && attendees.length > 0) {
            setParticipants(attendees
                .filter(user => !currentUser || user.id !== currentUser.id)
                .map((user, index) => {
                    const colors = [
                        "bg-gradient-to-br from-blue-500 to-blue-600",
                        "bg-gradient-to-br from-purple-500 to-purple-600",
                        "bg-gradient-to-br from-orange-500 to-orange-600",
                        "bg-gradient-to-br from-indigo-500 to-indigo-600",
                        "bg-gradient-to-br from-pink-500 to-pink-600",
                        "bg-gradient-to-br from-teal-500 to-teal-600"
                    ];
                    return {
                        id: user.id?.toString() || index.toString(),
                        name: user.name,
                        initial: user.name.charAt(0).toUpperCase(),
                        color: colors[index % colors.length],
                        role: user.role || 'Member',
                        isSpeaking: index === 0,
                        isMuted: index !== 0
                    };
                }));
        }
    }, [JSON.stringify(attendees)]);

    // Add Participant State
    const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
    const [availableUsers, setAvailableUsers] = useState<User[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

    // Load available users when modal opens
    useEffect(() => {
        if (showAddParticipantModal) {
            const unitData = getCurrentUnitData();
            const currentParticipantIds = participants.map(p => p.id);
            // Filter out users who are already participants (and current user)
            const storedUser = localStorage.getItem('ECABINET_AUTH_USER');
            const currentUser = storedUser ? JSON.parse(storedUser) : null;
            
            const filteredUsers = unitData.users.filter(u => 
                !currentParticipantIds.includes(u.id.toString()) && 
                (!currentUser || u.id !== currentUser.id)
            );
            setAvailableUsers(filteredUsers);
        }
    }, [showAddParticipantModal, participants]);

    const handleUserSelect = (id: number) => {
        setSelectedUserIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleAddSelectedUsers = () => {
        const newParticipants = availableUsers
            .filter(u => selectedUserIds.includes(u.id))
            .map(u => ({
                id: u.id.toString(),
                name: u.name,
                initial: u.name.charAt(0).toUpperCase(),
                color: u.avatarColor,
                role: u.role,
                isMuted: true,
                isSpeaking: false
            }));
        
        setParticipants(prev => [...prev, ...newParticipants]);
        setShowAddParticipantModal(false);
        setSelectedUserIds([]);
    };

    const handleRemoveParticipant = (participantId: string, participantName: string) => {
        if (currentUserRole !== 'Admin') return;
        if (window.confirm(`Bạn có chắc chắn muốn mời thành viên "${participantName}" ra khỏi phòng?`)) {
            setParticipants(prev => prev.filter(p => p.id !== participantId));
        }
    };

    // Documents state with Permissions
    const [docs, setDocs] = useState<DocItem[]>(() => {
        if (documents && documents.length > 0) {
            const maxId = Math.max(0, ...documents.map(d => typeof d.id === 'number' ? d.id : 0));
            return documents.map((doc, index) => ({
                id: doc.id || (maxId + index + 1),
                name: doc.name,
                size: doc.size || 'Unknown',
                type: doc.type || 'file',
                date: doc.date || new Date().toLocaleDateString('vi-VN'),
                allowedRoles: doc.allowedRoles || ['Admin', 'Member'],
                url: doc.url,
                fromRepo: doc.fromRepo
            }));
        }
        return [];
    });

    // Update docs when prop changes
    useEffect(() => {
        if (documents && documents.length > 0) {
            const maxId = Math.max(0, ...documents.map(d => typeof d.id === 'number' ? d.id : 0));
            setDocs(documents.map((doc, index) => ({
                id: doc.id || (maxId + index + 1),
                name: doc.name,
                size: doc.size || 'Unknown',
                type: doc.type || 'file',
                date: doc.date || new Date().toLocaleDateString('vi-VN'),
                allowedRoles: doc.allowedRoles || ['Admin', 'Member'],
                url: doc.url,
                fromRepo: doc.fromRepo
            })));
        } else {
            setDocs([]);
        }
    }, [JSON.stringify(documents)]);

    // Load repo docs when modal opens and listen for changes
    useEffect(() => {
        if (showRepoModal) {
            const loadRepoDocs = () => {
                const data = getCurrentUnitData();
                setRepoDocs(data.documents || []);
            };
            
            loadRepoDocs();
            window.addEventListener('data-change', loadRepoDocs);
            return () => window.removeEventListener('data-change', loadRepoDocs);
        }
    }, [showRepoModal]);

    const handleRepoDocSelect = (id: number) => {
        setSelectedRepoDocIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleAddSelectedRepoDocs = async () => {
        if (onAddRepoDocuments) {
            const selectedDocs = repoDocs.filter(d => selectedRepoDocIds.includes(d.id));
            await onAddRepoDocuments(selectedDocs);
            setShowRepoModal(false);
            setSelectedRepoDocIds([]);
            setIsAddingDoc(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        
        if (onAddDocument) {
            try {
                await onAddDocument(file);
                setIsAddingDoc(false);
            } catch (error) {
                console.error("Error adding document:", error);
                alert("Failed to add document");
            } finally {
                setIsUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        } else {
            // Fallback simulation
            setTimeout(() => {
                 const newDoc: DocItem = {
                    id: Date.now(),
                    name: file.name,
                    size: `${(file.size / 1024).toFixed(1)} KB`,
                    type: file.name.split('.').pop() || 'file',
                    date: new Date().toLocaleDateString('vi-VN'),
                    allowedRoles: ['Admin', 'Member'],
                    url: URL.createObjectURL(file),
                    fromRepo: false
                };
                setDocs(prev => [...prev, newDoc]);
                setIsUploading(false);
                setIsAddingDoc(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }, 1000);
        }
    };




    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Safety check: if role changes and user is viewing a restricted doc, close it
    useEffect(() => {
        if (viewingDoc && !viewingDoc.allowedRoles.includes(currentUserRole)) {
            setViewingDoc(null);
        }
    }, [currentUserRole, viewingDoc]);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const toggleRole = () => {
        setCurrentUserRole(prev => prev === 'Admin' ? 'Member' : 'Admin');
    };

    const toggleDocPermission = async (docId: number) => {
        if (currentUserRole !== 'Admin') return;
        
        const updatedDocs = docs.map(doc => {
            if (doc.id === docId) {
                const isRestricted = !doc.allowedRoles.includes('Member');
                return {
                    ...doc,
                    allowedRoles: (isRestricted ? ['Admin', 'Member'] : ['Admin']) as UserRole[]
                };
            }
            return doc;
        });

        setDocs(updatedDocs);
        if (onUpdateDocuments) {
            await onUpdateDocuments(updatedDocs);
        }
    };

    const handleDeleteDoc = async (docId: number, docName: string) => {
        if (currentUserRole !== 'Admin') return;
        if (!window.confirm(`Bạn có chắc chắn muốn xóa tài liệu "${docName}" không?`)) return;

        const updatedDocs = docs.filter(doc => doc.id !== docId);
        setDocs(updatedDocs);
        if (viewingDoc?.id === docId) setViewingDoc(null);
        
        if (onUpdateDocuments) {
            await onUpdateDocuments(updatedDocs);
        }
    };

    const handleRenameDoc = async (docId: number, currentName: string) => {
        if (currentUserRole !== 'Admin') return;
        const newName = window.prompt("Nhập tên mới cho tài liệu:", currentName);
        if (!newName || newName.trim() === "" || newName === currentName) return;

        const updatedDocs = docs.map(doc => {
            if (doc.id === docId) {
                return { ...doc, name: newName.trim() };
            }
            return doc;
        });

        setDocs(updatedDocs);
        if (onUpdateDocuments) {
            await onUpdateDocuments(updatedDocs);
        }
    };

    const handleDocClick = (doc: DocItem) => {
        if (doc.allowedRoles.includes(currentUserRole)) {
            setViewingDoc(doc);
        }
    };

    // Reorder functions (Up/Down)
    const moveUp = (index: number) => {
        if (index === 0) return;
        const newDocs = [...docs];
        [newDocs[index - 1], newDocs[index]] = [newDocs[index], newDocs[index - 1]];
        setDocs(newDocs);
    };

    const moveDown = (index: number) => {
        if (index === docs.length - 1) return;
        const newDocs = [...docs];
        [newDocs[index + 1], newDocs[index]] = [newDocs[index], newDocs[index + 1]];
        setDocs(newDocs);
    };

    const getFileIcon = (type: string) => {
        switch(type) {
            case 'pdf': return <FileText className="text-red-400 group-hover:text-red-300 transition-colors" size={24} />;
            case 'xlsx': return <FileSpreadsheet className="text-green-400 group-hover:text-green-300 transition-colors" size={24} />;
            case 'docx': return <FileText className="text-blue-400 group-hover:text-blue-300 transition-colors" size={24} />;
            case 'pptx': return <FileText className="text-orange-400 group-hover:text-orange-300 transition-colors" size={24} />;
            default: return <FileIcon className="text-slate-400" size={24} />;
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#1a1c23] flex flex-col text-white animate-in slide-in-from-bottom-10 fade-in duration-500">
            {/* Header */}
            <div className="h-20 px-6 flex items-center justify-between bg-transparent z-10 shrink-0">
                 <div className="flex flex-col">
                     <h2 className="font-bold text-xl tracking-tight">{meetingTitle}</h2>
                     <div className="flex items-center gap-3 text-sm font-medium text-slate-400 mt-0.5">
                         <span className="bg-slate-800/50 px-2 py-0.5 rounded text-slate-300">{meetingCode}</span>
                         <div className="h-1 w-1 rounded-full bg-slate-500"></div>
                         <span>{formatTime(time)}</span>
                     </div>
                 </div>
                 <div className="flex items-center gap-4">
                     {/* Role Simulation Toggle (For Demo) */}
                     <button 
                        onClick={toggleRole}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                            currentUserRole === 'Admin' 
                            ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/30' 
                            : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                        }`}
                        title="Click to switch role for demo"
                     >
                         <UserCog size={14} />
                         {currentUserRole === 'Admin' ? 'View as: Admin' : 'View as: Member'}
                     </button>

                     <div className="flex items-center gap-2 text-xs font-bold bg-red-500/10 text-red-400 px-3 py-1.5 rounded-full border border-red-500/20">
                         <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                         REC 00:42:15
                     </div>
                 </div>
            </div>

            {/* Middle Section: Main Content + Sidebar */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* Left Area: Content + Footer */}
                <div className="flex-1 flex flex-col relative overflow-hidden bg-gradient-to-br from-[#1a1c23] to-[#0f1116]">
                    
                    {/* Main Viewport */}
                    <div className="flex-1 overflow-hidden relative">
                        <div className="h-full w-full p-4 md:p-6 overflow-y-auto custom-scrollbar flex flex-col justify-center">
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full max-w-[1400px] mx-auto">
                                {/* Self View */}
                                <div className={`relative bg-slate-800 rounded-2xl overflow-hidden flex items-center justify-center aspect-video border-2 transition-all ${micOn ? 'border-teal-500/50' : 'border-transparent'}`}>
                                    {cameraOn ? (
                                        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800 flex flex-col items-center justify-center">
                                            <Video size={48} className="text-slate-600 mb-4" />
                                            <span className="text-sm font-medium text-slate-500">Camera Preview</span>
                                        </div>
                                    ) : (
                                        <div className="h-24 w-24 rounded-full flex items-center justify-center text-3xl font-bold text-white bg-teal-600 shadow-lg shadow-teal-900/20">
                                            T
                                        </div>
                                    )}
                                    <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm text-white font-medium flex items-center gap-2">
                                        {!micOn ? <MicOff size={14} className="text-red-400" /> : <div className="h-2 w-2 rounded-full bg-green-500"></div>}
                                        Bạn ({currentUserRole})
                                    </div>
                                </div>
                                
                                {participants.map(p => (
                                    <Participant 
                                        key={p.id}
                                        name={p.name} 
                                        initial={p.initial} 
                                        color={p.color} 
                                        isMuted={p.isMuted}
                                        isSpeaking={p.isSpeaking}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer Controls */}
                    <div className="h-20 shrink-0 bg-black/40 backdrop-blur-md border-t border-white/5 flex items-center justify-center gap-4 z-10">
                        <div className="flex items-center gap-3 bg-slate-800/80 p-1.5 rounded-2xl border border-white/10 shadow-lg">
                            <button 
                                onClick={() => setMicOn(!micOn)}
                                className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${micOn ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-red-500 text-white hover:bg-red-600'}`}
                                title={micOn ? "Tắt mic" : "Bật mic"}
                            >
                                {micOn ? <Mic size={20} /> : <MicOff size={20} />}
                            </button>
                            <button 
                                onClick={() => setCameraOn(!cameraOn)}
                                className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${cameraOn ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-red-500 text-white hover:bg-red-600'}`}
                                title={cameraOn ? "Tắt camera" : "Bật camera"}
                            >
                                {cameraOn ? <Video size={20} /> : <VideoOff size={20} />}
                            </button>
                        </div>

                        <button 
                            onClick={onLeave}
                            className="h-12 px-6 rounded-xl bg-red-600 text-white font-bold flex items-center gap-2 hover:bg-red-500 transition-all shadow-lg shadow-red-900/30"
                        >
                            <PhoneOff size={20} />
                            <span className="hidden sm:inline">Kết thúc</span>
                        </button>
                    </div>

                    {/* Document Viewer Overlay (Inside Main Column) */}
                    {viewingDoc && (
                        <div className="absolute inset-0 z-50 bg-slate-900 flex flex-col">
                            <DocumentViewer doc={viewingDoc} onClose={() => setViewingDoc(null)} />
                        </div>
                    )}
                </div>

                {/* Right Sidebar */}
                <div className="w-80 bg-[#16181d] border-l border-white/5 flex flex-col shrink-0 z-20 shadow-2xl">
                     
                     {/* Documents Section */}
                     <div className="flex-1 flex flex-col min-h-0 border-b border-white/5">
                        <div className="h-12 flex items-center px-4 shrink-0 bg-[#1a1c23] border-b border-white/5 gap-2 text-sm font-bold uppercase tracking-wider text-teal-500">
                            <FileText size={16} /> Tài liệu ({docs.filter(d => d.allowedRoles.includes(currentUserRole)).length})
                        </div>

                        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 custom-scrollbar">
                            {/* Add Document Section (Admin Only) */}
                            {currentUserRole === 'Admin' && (
                                <div className="mb-2">
                                    {!isAddingDoc ? (
                                        <button
                                            onClick={() => setIsAddingDoc(true)}
                                            className="w-full py-2 bg-teal-600/10 hover:bg-teal-600/20 text-teal-400 hover:text-teal-300 border border-teal-500/30 border-dashed rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all group"
                                        >
                                            <Plus size={14} className="group-hover:scale-110 transition-transform" /> Thêm tài liệu
                                        </button>
                                    ) : (
                                        <div className="p-3 bg-slate-800/50 rounded-xl border border-white/10 animate-in fade-in slide-in-from-top-2">
                                                <div className="flex items-center justify-between mb-3">
                                                <span className="text-xs font-bold text-slate-300">Thêm tài liệu</span>
                                                <button onClick={() => setIsAddingDoc(false)} className="text-slate-500 hover:text-white"><X size={14}/></button>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-2 mb-3">
                                                    <button 
                                                    onClick={() => setShowRepoModal(true)}
                                                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg bg-slate-700/50 hover:bg-blue-600/20 border border-white/5 hover:border-blue-500/50 transition-all group/repo"
                                                    >
                                                        <Database size={20} className="text-blue-400 group-hover/repo:text-blue-300"/>
                                                        <span className="text-[10px] font-bold text-slate-400 group-hover/repo:text-blue-300">Kho tài liệu</span>
                                                    </button>
                                                    <button 
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg bg-slate-700/50 hover:bg-teal-600/20 border border-white/5 hover:border-teal-500/50 transition-all group/upload"
                                                    >
                                                        <Upload size={20} className="text-teal-400 group-hover/upload:text-teal-300"/>
                                                        <span className="text-[10px] font-bold text-slate-400 group-hover/upload:text-teal-300">Tải lên</span>
                                                    </button>
                                                </div>

                                                <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                onChange={handleFileChange}
                                                />
                                                {isUploading && (
                                                    <div className="flex items-center justify-center gap-2 text-teal-400 text-xs font-bold py-2">
                                                        <Loader2 size={14} className="animate-spin" /> Đang tải lên...
                                                    </div>
                                                )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Documents List */}
                            {docs.map((doc, index) => {
                                const hasAccess = doc.allowedRoles.includes(currentUserRole);
                                const isRestricted = !doc.allowedRoles.includes('Member');
                                
                                return (
                                <div 
                                    key={doc.id} 
                                    onClick={() => handleDocClick(doc)}
                                    className={`group relative rounded-xl border p-2 flex gap-3 transition-all ${
                                        hasAccess 
                                            ? 'cursor-pointer hover:bg-[#2b2f3a] border-white/5 hover:border-teal-500/30' 
                                            : 'cursor-not-allowed opacity-50 bg-[#1a1c23] border-transparent'
                                    } ${viewingDoc?.id === doc.id ? 'border-teal-500/50 bg-[#2b2f3a]' : ''}`}
                                >
                                    {/* Sort Controls (Inside - Only if Access) */}
                                    {hasAccess && (
                                        <div className="flex flex-col gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity absolute left-1 top-1/2 -translate-y-1/2 z-30">
                                            <button 
                                                onClick={(e) => {e.stopPropagation(); moveUp(index)}} 
                                                disabled={index===0} 
                                                className="p-0.5 hover:bg-black/60 rounded text-slate-400 hover:text-white disabled:opacity-20 transition-colors bg-black/20"
                                            >
                                                <ChevronUp size={10}/>
                                            </button>
                                            <button 
                                                onClick={(e) => {e.stopPropagation(); moveDown(index)}} 
                                                disabled={index===docs.length-1} 
                                                className="p-0.5 hover:bg-black/60 rounded text-slate-400 hover:text-white disabled:opacity-20 transition-colors bg-black/20"
                                            >
                                                <ChevronDown size={10}/>
                                            </button>
                                        </div>
                                    )}

                                    {/* Icon */}
                                    <div className={`h-9 w-9 rounded-lg bg-slate-900/50 flex items-center justify-center shadow-inner shrink-0 relative ${hasAccess ? 'ml-4' : ''}`}>
                                        {hasAccess ? getFileIcon(doc.type) : <Lock className="text-slate-500" size={16} />}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <div className={`text-xs font-bold leading-tight line-clamp-2 mb-0.5 transition-colors ${viewingDoc?.id === doc.id ? 'text-teal-400' : 'text-slate-300 group-hover:text-white'}`} title={doc.name}>{doc.name}</div>
                                        <div className="flex items-center gap-2 text-[9px] text-slate-500 font-mono">
                                            <span>{doc.size}</span>
                                            {isRestricted && <span className="flex items-center gap-1 text-red-400"><ShieldAlert size={8} /> Admin</span>}
                                        </div>
                                    </div>

                                    {/* Document Actions */}
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-[#2b2f3a] pl-2 shadow-[-10px_0_10px_#2b2f3a]">
                                        {/* Admin Actions */}
                                        {currentUserRole === 'Admin' && (
                                            <>
                                                <button 
                                                    onClick={(e) => {e.stopPropagation(); toggleDocPermission(doc.id)}}
                                                    className={`p-1.5 rounded-lg shadow-lg transition-all ${isRestricted ? 'bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white' : 'bg-slate-700 text-slate-400 hover:bg-teal-500 hover:text-white'}`}
                                                    title={isRestricted ? "Mở khóa cho thành viên" : "Khóa cho thành viên"}
                                                >
                                                    {isRestricted ? <Lock size={12} /> : <Unlock size={12} />}
                                                </button>
                                                
                                                <button 
                                                    onClick={(e) => {e.stopPropagation(); handleRenameDoc(doc.id, doc.name)}}
                                                    className="p-1.5 bg-slate-700 hover:bg-blue-500 rounded-lg text-slate-300 hover:text-white shadow-lg transition-all" 
                                                    title="Đổi tên"
                                                >
                                                    <Pencil size={12} />
                                                </button>

                                                <button 
                                                    onClick={(e) => {e.stopPropagation(); handleDeleteDoc(doc.id, doc.name)}}
                                                    className="p-1.5 bg-slate-700 hover:bg-red-500 rounded-lg text-slate-300 hover:text-white shadow-lg transition-all" 
                                                    title="Xóa tài liệu"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </>
                                        )}

                                        {/* Download Action (For everyone with access) */}
                                        {hasAccess && (
                                            <a 
                                                href={doc.url} 
                                                download={doc.name}
                                                onClick={(e) => e.stopPropagation()}
                                                className="p-1.5 bg-slate-700 hover:bg-teal-500 rounded-lg text-slate-300 hover:text-white shadow-lg transition-all flex items-center justify-center" 
                                                title="Tải về"
                                            >
                                                <Download size={12} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                     </div>

                     {/* Participants Section */}
                     <div className="h-1/3 flex flex-col min-h-[180px] bg-[#1a1c23]/50 border-t border-white/5">
                        <div className="h-10 flex items-center justify-between px-4 shrink-0 bg-[#1a1c23] border-b border-white/5 gap-2">
                            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                                <Users size={16} /> Thành viên ({participants.length + 1})
                            </div>
                            {currentUserRole === 'Admin' && (
                                <button 
                                    onClick={() => setShowAddParticipantModal(true)}
                                    className="p-1 rounded hover:bg-white/10 text-teal-500 hover:text-teal-400 transition-colors"
                                    title="Thêm thành viên"
                                >
                                    <Plus size={16} />
                                </button>
                            )}
                        </div>
                        
                        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 custom-scrollbar">
                            {/* Current User */}
                            <div className="flex items-center gap-3 p-2 rounded-xl bg-[#2b2f3a] border border-teal-500/30">
                                <div className="h-8 w-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold shadow-lg text-xs">
                                    T
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-bold text-white flex items-center gap-2">
                                        Bạn
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">{currentUserRole}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {micOn ? <div className="flex items-center gap-1 text-[9px] text-green-400"><div className="h-1.5 w-1.5 rounded-full bg-green-500"></div> Đang nói</div> : <div className="flex items-center gap-1 text-[9px] text-red-400"><MicOff size={10} /> Đã tắt mic</div>}
                                    </div>
                                </div>
                            </div>

                            {/* Other Participants */}
                            {participants.map(p => (
                                <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl border border-white/5 hover:bg-[#2b2f3a] transition-colors group">
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-bold shadow-lg text-xs ${p.color}`}>
                                        {p.initial}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-bold text-slate-200 group-hover:text-white flex items-center gap-2">
                                            {p.name}
                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{p.role}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {p.isMuted ? (
                                                <div className="flex items-center gap-1 text-[9px] text-red-400"><MicOff size={10} /> Đã tắt mic</div>
                                            ) : p.isSpeaking ? (
                                                <div className="flex items-center gap-1 text-[9px] text-green-400"><div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div> Đang nói</div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-[9px] text-slate-500">Đang im lặng</div>
                                            )}
                                        </div>
                                    </div>
                                    <button className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-all">
                                        <MoreVertical size={16} />
                                    </button>
                                    {currentUserRole === 'Admin' && (
                                        <button 
                                            onClick={() => handleRemoveParticipant(p.id, p.name)}
                                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-all absolute right-2"
                                            title="Mời ra khỏi phòng"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                     </div>
                </div>

            </div>



            {/* Add Participant Modal */}
            {showAddParticipantModal && (
                <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-800">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Users size={18} className="text-teal-400" /> Thêm thành viên
                            </h3>
                            <button onClick={() => setShowAddParticipantModal(false)} className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto custom-scrollbar space-y-2 flex-1">
                            {availableUsers.length === 0 ? (
                                <div className="text-center text-slate-500 py-8">
                                    Không còn thành viên nào để thêm.
                                </div>
                            ) : (
                                availableUsers.map(user => {
                                    const isSelected = selectedUserIds.includes(user.id);
                                    return (
                                        <div 
                                            key={user.id}
                                            onClick={() => handleUserSelect(user.id)}
                                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                                isSelected 
                                                ? 'bg-teal-500/20 border-teal-500/50' 
                                                : 'bg-slate-800 border-white/5 hover:border-white/20'
                                            }`}
                                        >
                                            <div className={isSelected ? 'text-teal-400' : 'text-slate-500'}>
                                                {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                                            </div>
                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${user.avatarColor}`}>
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>{user.name}</div>
                                                <div className="text-[10px] text-slate-500">{user.role} • {user.dept}</div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                        <div className="p-4 border-t border-white/10 bg-slate-800 flex justify-end gap-3">
                             <button onClick={() => setShowAddParticipantModal(false)} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5">Hủy</button>
                             <button 
                                onClick={handleAddSelectedUsers}
                                disabled={selectedUserIds.length === 0}
                                className="px-4 py-2 rounded-lg text-sm font-bold bg-teal-600 text-white hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                                Thêm ({selectedUserIds.length})
                             </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Repo Modal */}
            {showRepoModal && (
                <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-800">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Database size={18} className="text-blue-400" /> Chọn từ Kho tài liệu
                            </h3>
                            <button onClick={() => setShowRepoModal(false)} className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto custom-scrollbar space-y-2 flex-1">
                            {repoDocs.map(doc => {
                                const isSelected = selectedRepoDocIds.includes(doc.id);
                                return (
                                    <div 
                                        key={doc.id}
                                        onClick={() => handleRepoDocSelect(doc.id)}
                                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                            isSelected 
                                            ? 'bg-blue-500/20 border-blue-500/50' 
                                            : 'bg-slate-800 border-white/5 hover:border-white/20'
                                        }`}
                                    >
                                        <div className={isSelected ? 'text-blue-400' : 'text-slate-500'}>
                                            {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>{doc.name}</div>
                                            <div className="text-[10px] text-slate-500 uppercase">{doc.type} • {doc.size}</div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="p-4 border-t border-white/10 bg-slate-800 flex justify-end gap-3">
                             <button onClick={() => setShowRepoModal(false)} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5">Hủy</button>
                             <button 
                                onClick={handleAddSelectedRepoDocs}
                                disabled={selectedRepoDocIds.length === 0}
                                className="px-4 py-2 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                                Thêm ({selectedRepoDocIds.length})
                             </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MeetingRoom;