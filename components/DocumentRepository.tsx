import React, { useState, useRef, useEffect } from 'react';
import ScrollReveal from './ui/ScrollReveal';
import { FileText, Folder, Search, Filter, Download, Eye, Cloud, MoreHorizontal, FileSpreadsheet, FileIcon, Upload, X, Trash2, CheckCircle, FileUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { getCurrentUnitData, saveCurrentUnitDocuments, Document } from '../utils/dataManager';

const DocumentRow: React.FC<{ doc: any }> = ({ doc }) => {
    const statusColors: any = {
        approved: 'bg-teal-50 text-teal-700 border-teal-200',
        draft: 'bg-slate-100 text-slate-600 border-slate-200',
        pending: 'bg-amber-50 text-amber-700 border-amber-200'
    };
    const statusText: any = {
        approved: 'Đã duyệt',
        draft: 'Nháp',
        pending: 'Chờ ký'
    };

    const getIcon = (type: string) => {
        if (type === 'pdf') return <FileText size={20} className="text-red-500" />;
        if (type === 'xlsx' || type === 'xls') return <FileSpreadsheet size={20} className="text-green-600" />;
        if (type === 'docx' || type === 'doc') return <FileText size={20} className="text-blue-600" />;
        if (type === 'pptx') return <FileText size={20} className="text-orange-500" />;
        return <FileIcon size={20} className="text-slate-500" />;
    }

    return (
        <div className="group flex items-center gap-4 border-b border-slate-50 p-2.5 hover:bg-slate-50 transition-all cursor-pointer rounded-lg mx-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 shadow-sm">
                {getIcon(doc.type)}
            </div>
            <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{doc.name}</div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span>{doc.date}</span>
                    <span className="h-0.5 w-0.5 rounded-full bg-slate-400"></span>
                    <span>{doc.size}</span>
                </div>
            </div>
            <div className={`hidden sm:flex px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${statusColors[doc.status]}`}>
                {statusText[doc.status]}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button title="Xem" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Eye size={14} /></button>
                <button title="Tải về" className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"><Download size={14} /></button>
                <button title="Khác" className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><MoreHorizontal size={14} /></button>
            </div>
        </div>
    );
};

const DocumentRepository: React.FC = () => {
  const [docs, setDocs] = useState<Document[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      loadDocs();
      const handleDataChange = () => loadDocs();
      window.addEventListener('unit-change', handleDataChange);
      window.addEventListener('data-change', handleDataChange);
      return () => {
          window.removeEventListener('unit-change', handleDataChange);
          window.removeEventListener('data-change', handleDataChange);
      };
  }, []);

  const loadDocs = () => {
      const data = getCurrentUnitData();
      setDocs(data.documents || []);
  };

  // Filter Logic
  const filteredDocs = docs.filter(doc => {
      const matchesCategory = activeCategory === 'all' || doc.category === activeCategory;
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage);
  const currentDocs = filteredDocs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page: number) => {
      if (page >= 1 && page <= totalPages) {
          setCurrentPage(page);
      }
  };

  const categories = [
      { id: 'all', label: 'Tất cả tài liệu', icon: Folder },
      { id: 'res', label: 'Nghị quyết HĐQT', icon: Folder },
      { id: 'meet', label: 'Tài liệu cuộc họp', icon: Folder },
      { id: 'fin', label: 'Báo cáo tài chính', icon: Folder },
      { id: 'hr', label: 'Nhân sự & Lương', icon: Folder },
  ];

  // --- Upload Logic ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          const newFiles = Array.from(e.target.files);
          if (selectedFiles.length + newFiles.length > 10) {
              alert("Bạn chỉ được phép tải lên tối đa 10 tệp một lần.");
              return;
          }
          setSelectedFiles(prev => [...prev, ...newFiles]);
      }
  };

  const removeFile = (index: number) => {
      setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatSize = (bytes: number) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUploadSubmit = () => {
      if (selectedFiles.length === 0) return;
      
      setIsUploading(true);
      setUploadProgress(0);

      // Simulate Upload
      const interval = setInterval(() => {
          setUploadProgress(prev => {
              if (prev >= 100) {
                  clearInterval(interval);
                  return 100;
              }
              return prev + 10;
          });
      }, 200);

      setTimeout(() => {
          // Add new docs to state
          const newDocs: Document[] = selectedFiles.map((file, index) => ({
              id: Date.now() + index,
              name: file.name,
              date: "Vừa xong",
              size: formatSize(file.size),
              type: file.name.split('.').pop()?.toLowerCase() || 'file',
              status: "pending",
              category: "other"
          }));

          const updatedDocs = [...newDocs, ...docs];
          saveCurrentUnitDocuments(updatedDocs);
          
          setIsUploading(false);
          setUploadProgress(0);
          setSelectedFiles([]);
          setShowUploadModal(false);
          clearInterval(interval);
      }, 2500);
  };

  return (
    <section id="documents" className="py-6 bg-slate-50/50 border-y border-slate-900/5 relative">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Interactive UI */}
            <div className="order-2 lg:order-1 lg:col-span-7">
                <ScrollReveal>
                    <div className="relative rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden flex flex-col h-[520px]">
                        {/* Header App */}
                        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-2.5">
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                                <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
                                    <Cloud size={16} />
                                </div>
                                <span>Kho Tài Liệu Số</span>
                            </div>
                            <div className="flex gap-1.5">
                                <div className="h-2.5 w-2.5 rounded-full bg-slate-100 border border-slate-200"></div>
                                <div className="h-2.5 w-2.5 rounded-full bg-slate-100 border border-slate-200"></div>
                            </div>
                        </div>

                        {/* Toolbar */}
                        <div className="flex gap-2 border-b border-slate-100 p-2 bg-white shrink-0">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                                <input 
                                    type="text" 
                                    placeholder="Tìm kiếm..." 
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    className="w-full rounded-lg bg-slate-50 border border-slate-200 py-1.5 pl-9 pr-4 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                                />
                            </div>
                            <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                                <Filter size={14} /> <span className="hidden sm:inline">Lọc</span>
                            </button>
                            <button 
                                onClick={() => {
                                    const storedUser = localStorage.getItem('ECABINET_AUTH_USER');
                                    if (storedUser && JSON.parse(storedUser).role !== 'Admin') {
                                        alert("Bạn không có quyền tải lên tài liệu.");
                                        return;
                                    }
                                    setShowUploadModal(true);
                                }}
                                className={`flex items-center gap-2 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/20 ${
                                    (() => {
                                        const storedUser = localStorage.getItem('ECABINET_AUTH_USER');
                                        return storedUser && JSON.parse(storedUser).role !== 'Admin' ? 'opacity-50 cursor-not-allowed' : '';
                                    })()
                                }`}
                            >
                                <Upload size={14} /> <span className="hidden sm:inline">Tải lên</span>
                            </button>
                        </div>

                        {/* Body content */}
                        <div className="flex flex-1 overflow-hidden">
                            {/* Sidebar Categories */}
                            <div className="hidden sm:flex w-52 border-r border-slate-100 bg-slate-50/30 flex-col justify-between p-2">
                                <div className="space-y-0.5">
                                    {categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => { setActiveCategory(cat.id); setCurrentPage(1); }}
                                            className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                                                activeCategory === cat.id 
                                                ? 'bg-blue-100/80 text-blue-700 shadow-sm' 
                                                : 'text-slate-500 hover:bg-slate-100'
                                            }`}
                                        >
                                            <cat.icon size={14} className={activeCategory === cat.id ? 'text-blue-600' : 'text-slate-400'} />
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                                
                                {/* Storage Widget */}
                                <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1.5">
                                        <span>Dung lượng</span>
                                        <span className="text-slate-800">75%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
                                        <div className="h-full bg-gradient-to-r from-blue-500 to-teal-400 w-[75%]"></div>
                                    </div>
                                    <p className="text-[10px] text-slate-400">Đã dùng 75GB / 100GB</p>
                                </div>
                            </div>

                            {/* Main List */}
                            <div className="flex-1 flex flex-col bg-white">
                                <div className="flex-1 overflow-y-auto py-2 scroll-smooth">
                                    {currentDocs.length > 0 ? (
                                        currentDocs.map(doc => <DocumentRow key={doc.id} doc={doc} />)
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                            <Search size={48} className="mb-2 opacity-20" />
                                            <p className="text-sm font-semibold">Không tìm thấy tài liệu nào</p>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 bg-slate-50/50">
                                        <div className="text-[10px] font-bold text-slate-500">
                                            Trang {currentPage} / {totalPages}
                                        </div>
                                        <div className="flex gap-1">
                                            <button 
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 transition-colors"
                                            >
                                                <ChevronLeft size={16} />
                                            </button>
                                            <div className="flex gap-1">
                                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                    <button
                                                        key={page}
                                                        onClick={() => handlePageChange(page)}
                                                        className={`h-6 w-6 rounded flex items-center justify-center text-[10px] font-bold transition-colors ${
                                                            currentPage === page 
                                                            ? 'bg-blue-600 text-white shadow-sm' 
                                                            : 'text-slate-600 hover:bg-slate-200'
                                                        }`}
                                                    >
                                                        {page}
                                                    </button>
                                                ))}
                                            </div>
                                            <button 
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 transition-colors"
                                            >
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </ScrollReveal>
            </div>

            {/* Right Column: Description */}
            <div className="order-1 lg:order-2 lg:col-span-5">
                <ScrollReveal delay={100}>
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-bold text-blue-600 mb-3">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                        </span>
                        Lưu trữ thông minh
                    </div>
                    <h2 className="mb-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Kho tài liệu tập trung</h2>
                    <p className="text-base text-slate-600/80 mb-6 leading-relaxed">
                        Không còn nỗi lo thất lạc văn bản. EcabinetCS cung cấp kho lưu trữ số hóa với khả năng tìm kiếm toàn văn (OCR) và phân quyền chi tiết đến từng thư mục.
                    </p>
                    
                    <div className="grid gap-4">
                         <div className="flex gap-4">
                             <div className="mt-1 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-blue-600">
                                 <Search size={16} />
                             </div>
                             <div>
                                 <h4 className="text-sm font-bold text-slate-900">Tìm kiếm thông minh (OCR)</h4>
                                 <p className="text-xs text-slate-600 mt-1">Tìm kiếm nội dung bên trong file PDF, hình ảnh scan và văn bản Word trong tích tắc.</p>
                             </div>
                         </div>
                         <div className="flex gap-4">
                             <div className="mt-1 h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0 text-teal-600">
                                 <MoreHorizontal size={16} />
                             </div>
                             <div>
                                 <h4 className="text-sm font-bold text-slate-900">Kiểm soát phiên bản</h4>
                                 <p className="text-xs text-slate-600 mt-1">Tự động lưu trữ lịch sử sửa đổi. Dễ dàng khôi phục phiên bản cũ khi cần thiết.</p>
                             </div>
                         </div>
                    </div>
                </ScrollReveal>
            </div>
        </div>

        {/* UPLOAD MODAL OVERLAY */}
        {showUploadModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <div className="flex items-center gap-2">
                             <div className="bg-teal-100 p-1.5 rounded-lg text-teal-600"><FileUp size={20} /></div>
                             <h3 className="font-bold text-slate-800">Tải lên tài liệu</h3>
                        </div>
                        <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200"><X size={20} /></button>
                    </div>

                    <div className="p-6">
                        {/* Drop Zone */}
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${selectedFiles.length > 0 ? 'border-teal-200 bg-teal-50/30' : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/30'}`}
                        >
                            <input 
                                type="file" 
                                multiple 
                                className="hidden" 
                                ref={fileInputRef} 
                                onChange={handleFileSelect} 
                            />
                            <div className="h-12 w-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 text-blue-500">
                                <Cloud size={24} />
                            </div>
                            <p className="text-sm font-bold text-slate-700">Nhấp để chọn tài liệu</p>
                            <p className="text-xs text-slate-400 mt-1">Hỗ trợ PDF, Word, Excel (Max 10 files)</p>
                        </div>

                        {/* File List */}
                        {selectedFiles.length > 0 && (
                            <div className="mt-4 max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                <p className="text-xs font-bold text-slate-500 uppercase">Đã chọn ({selectedFiles.length})</p>
                                {selectedFiles.map((file, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-100 group">
                                        <FileIcon size={16} className="text-slate-400" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-700 truncate">{file.name}</p>
                                            <p className="text-[10px] text-slate-400">{formatSize(file.size)}</p>
                                        </div>
                                        <button onClick={() => removeFile(idx)} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Progress Bar */}
                        {isUploading && (
                            <div className="mt-4">
                                <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                                    <span>Đang tải lên...</span>
                                    <span>{uploadProgress}%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-teal-500 transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }}></div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                        <button 
                            onClick={() => setShowUploadModal(false)}
                            disabled={isUploading}
                            className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50"
                        >
                            Hủy bỏ
                        </button>
                        <button 
                            onClick={handleUploadSubmit}
                            disabled={selectedFiles.length === 0 || isUploading}
                            className="px-4 py-2 text-xs font-bold text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isUploading ? <><div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Xử lý...</> : <><CheckCircle size={14} /> Xác nhận tải lên</>}
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </section>
  );
};

export default DocumentRepository;