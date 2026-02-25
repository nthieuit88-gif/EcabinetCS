import React, { useState, useEffect, useRef } from 'react';
import { FileText, Plus, Search, Trash2, Pencil, X, Check, Upload, FileSpreadsheet, File, FolderOpen, Filter, Loader2 } from 'lucide-react';
import { Document, getCurrentUnitData, getCurrentUnitId, syncDocumentsFromSupabase, saveCurrentUnitDocuments } from '../../utils/dataManager';
import { supabase } from '../../utils/supabaseClient';

const DocumentManager: React.FC = () => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<Document>>({});
    const [selectedFiles, setSelectedFiles] = useState<globalThis.File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const loadDocs = async () => {
            setIsLoading(true);
            const unitId = getCurrentUnitId();
            const docs = await syncDocumentsFromSupabase(unitId);
            setDocuments(docs);
            setIsLoading(false);
        };
        loadDocs();
    }, []);

    const filteredDocs = documents.filter(doc => 
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddNew = () => {
        setFormData({
            name: '',
            date: new Date().toLocaleDateString('vi-VN'),
            size: '0 KB',
            type: 'pdf',
            status: 'draft',
            category: 'other'
        });
        setSelectedFiles([]);
        setIsEditing(false);
        setShowForm(true);
    };

    const handleEdit = (doc: Document) => {
        setFormData(doc);
        setSelectedFiles([]);
        setIsEditing(true);
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) {
            const unitId = getCurrentUnitId();
            
            // Delete from Supabase
            const { error } = await supabase
                .from('documents')
                .delete()
                .eq('id', id);
                
            if (error) {
                console.warn('Supabase delete failed, falling back to local storage:', error);
                setDocuments(prev => prev.filter(d => d.id !== id));
                return;
            }
            
            // Sync and update state
            const updatedDocs = await syncDocumentsFromSupabase(unitId);
            if (updatedDocs && updatedDocs.length > 0) {
                setDocuments(updatedDocs);
            } else {
                setDocuments(prev => prev.filter(d => d.id !== id));
            }
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isEditing && selectedFiles.length === 0 && !formData.name) return;
        if (isEditing && !formData.name) return;

        setIsUploading(true);
        setUploadProgress(0);
        const unitId = getCurrentUnitId();

        if (isEditing) {
            let fileUrl = formData.url;
            if (selectedFiles.length > 0) {
                const file = selectedFiles[0];
                const fileExt = file.name.split('.').pop()?.toLowerCase() || 'file';
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `${unitId}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(filePath, file);

                if (!uploadError) {
                    const { data: publicUrlData } = supabase.storage
                        .from('documents')
                        .getPublicUrl(filePath);
                        
                    fileUrl = publicUrlData.publicUrl;
                } else {
                    console.warn('Supabase upload failed, falling back to local URL:', uploadError);
                    fileUrl = URL.createObjectURL(file);
                }
            }

            // Update in Supabase
            const { error } = await supabase
                .from('documents')
                .update({
                    name: formData.name,
                    date: formData.date,
                    size: formData.size,
                    type: formData.type,
                    status: formData.status,
                    category: formData.category,
                    file_url: fileUrl || null
                })
                .eq('id', formData.id);
                
            if (error) {
                console.warn('Supabase update failed, falling back to local storage:', error);
                // Fallback to local storage
                const currentDocs = [...documents];
                const index = currentDocs.findIndex(d => d.id === formData.id);
                if (index !== -1) {
                    currentDocs[index] = {
                        ...currentDocs[index],
                        name: formData.name || currentDocs[index].name,
                        date: formData.date || currentDocs[index].date,
                        size: formData.size || currentDocs[index].size,
                        type: formData.type || currentDocs[index].type,
                        status: (formData.status as any) || currentDocs[index].status,
                        category: formData.category || currentDocs[index].category,
                        url: fileUrl || currentDocs[index].url
                    };
                    setDocuments(currentDocs);
                    saveCurrentUnitDocuments(currentDocs);
                }
            }
        } else {
            // Insert into Supabase
            if (selectedFiles.length === 0) {
                const { error } = await supabase
                    .from('documents')
                    .insert({
                        name: formData.name,
                        date: new Date().toLocaleDateString('vi-VN'),
                        size: formData.size || '0 KB',
                        type: formData.type || 'file',
                        status: formData.status || 'draft',
                        category: formData.category || 'other',
                        file_url: null,
                        unit_id: unitId
                    });
                    
                if (error) {
                    console.warn('Supabase insert failed, falling back to local storage:', error);
                    const newDoc: Document = {
                        id: Date.now(),
                        name: formData.name || 'Untitled',
                        date: new Date().toLocaleDateString('vi-VN'),
                        size: formData.size || '0 KB',
                        type: formData.type || 'file',
                        status: (formData.status as any) || 'draft',
                        category: formData.category || 'other',
                        url: undefined
                    };
                    const updatedDocs = [newDoc, ...documents];
                    setDocuments(updatedDocs);
                    saveCurrentUnitDocuments(updatedDocs);
                }
            } else {
                let successCount = 0;
                let lastError = '';
                const newLocalDocs: Document[] = [];
                
                for (let i = 0; i < selectedFiles.length; i++) {
                    const file = selectedFiles[i];
                    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'file';
                    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                    const filePath = `${unitId}/${fileName}`;

                    let fileUrl = '';
                    const { error: uploadError } = await supabase.storage
                        .from('documents')
                        .upload(filePath, file);

                    if (!uploadError) {
                        const { data: publicUrlData } = supabase.storage
                            .from('documents')
                            .getPublicUrl(filePath);
                        fileUrl = publicUrlData.publicUrl;
                    } else {
                        console.warn('Supabase upload failed, falling back to local URL:', uploadError);
                        fileUrl = URL.createObjectURL(file);
                        lastError = uploadError.message;
                    }
                            
                    const docName = selectedFiles.length === 1 ? (formData.name || file.name) : file.name;

                    const { error: dbError } = await supabase
                        .from('documents')
                        .insert({
                            name: docName,
                            date: new Date().toLocaleDateString('vi-VN'),
                            size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
                            type: fileExt,
                            status: formData.status || 'draft',
                            category: formData.category || 'other',
                            file_url: fileUrl,
                            unit_id: unitId
                        });
                        
                    if (!dbError) {
                        successCount++;
                    } else {
                        console.warn('Supabase insert failed, falling back to local storage:', dbError);
                        lastError = dbError.message;
                        newLocalDocs.push({
                            id: Date.now() + i,
                            name: docName,
                            date: new Date().toLocaleDateString('vi-VN'),
                            size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
                            type: fileExt,
                            status: (formData.status as any) || 'draft',
                            category: formData.category || 'other',
                            url: fileUrl
                        });
                    }
                    
                    setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
                }
                
                if (newLocalDocs.length > 0) {
                    const updatedDocs = [...newLocalDocs, ...documents];
                    setDocuments(updatedDocs);
                    saveCurrentUnitDocuments(updatedDocs);
                }
                
                // If we had some success but also some errors, we might want to alert, but for fallback we just silently succeed
                if (successCount < selectedFiles.length && lastError && newLocalDocs.length === 0) {
                    alert(`Đã tải lên ${successCount}/${selectedFiles.length} tài liệu. Lỗi: ${lastError}`);
                }
            }
        }

        // After saving to Supabase, sync back to local storage and state
        const updatedDocs = await syncDocumentsFromSupabase(unitId);
        // If sync returns data, use it, otherwise keep the local state we just updated
        if (updatedDocs && updatedDocs.length > 0) {
            setDocuments(updatedDocs);
        }
        
        setIsUploading(false);
        setUploadProgress(0);
        setShowForm(false);
        setSelectedFiles([]);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            if (selectedFiles.length + newFiles.length > 10) {
                alert("Bạn chỉ được phép tải lên tối đa 10 tệp một lần.");
                return;
            }
            setSelectedFiles(prev => [...prev, ...newFiles]);
            
            if (!isEditing && newFiles.length > 0 && !formData.name) {
                const file = newFiles[0];
                const ext = file.name.split('.').pop()?.toLowerCase() || 'file';
                setFormData({
                    ...formData,
                    name: file.name,
                    size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
                    type: ext
                });
            }
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const getFileIcon = (type: string) => {
        switch(type) {
            case 'pdf': return <FileText className="text-red-500" size={20} />;
            case 'xlsx': 
            case 'xls': return <FileSpreadsheet className="text-green-500" size={20} />;
            case 'docx': 
            case 'doc': return <FileText className="text-blue-500" size={20} />;
            case 'pptx': 
            case 'ppt': return <FileText className="text-orange-500" size={20} />;
            default: return <File className="text-slate-500" size={20} />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'approved': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-[10px] font-bold uppercase">Đã duyệt</span>;
            case 'pending': return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-md text-[10px] font-bold uppercase">Chờ duyệt</span>;
            case 'draft': return <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase">Bản nháp</span>;
            default: return null;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <FolderOpen className="text-blue-600" /> Kho tài liệu
                    </h2>
                    <p className="text-sm text-slate-500 font-medium mt-1">Quản lý tài liệu dùng chung cho toàn đơn vị</p>
                </div>
                <button 
                    onClick={handleAddNew}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-blue-600/20"
                >
                    <Plus size={16} /> Thêm tài liệu
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex gap-3 bg-slate-50/50">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm tài liệu..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>
                    <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2">
                        <Filter size={16} /> Lọc
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                <th className="p-4">Tên tài liệu</th>
                                <th className="p-4">Danh mục</th>
                                <th className="p-4">Kích thước</th>
                                <th className="p-4">Ngày tải lên</th>
                                <th className="p-4">Trạng thái</th>
                                <th className="p-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500">
                                        <Loader2 size={48} className="mx-auto text-blue-500 mb-3 animate-spin" />
                                        <p className="text-sm font-medium">Đang tải tài liệu...</p>
                                    </td>
                                </tr>
                            ) : filteredDocs.length > 0 ? (
                                filteredDocs.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                                    {getFileIcon(doc.type)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800 text-sm line-clamp-1">{doc.name}</div>
                                                    <div className="text-[10px] font-mono text-slate-400 uppercase mt-0.5">{doc.type}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                                                {doc.category === 'res' ? 'Nghị quyết' : 
                                                 doc.category === 'fin' ? 'Tài chính' : 
                                                 doc.category === 'hr' ? 'Nhân sự' : 
                                                 doc.category === 'meet' ? 'Cuộc họp' : 'Khác'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 font-mono text-xs">{doc.size}</td>
                                        <td className="p-4 text-sm text-slate-600">{doc.date}</td>
                                        <td className="p-4">{getStatusBadge(doc.status)}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleEdit(doc)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Sửa"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(doc.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Xóa"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500">
                                        <FolderOpen size={48} className="mx-auto text-slate-300 mb-3" />
                                        <p className="text-sm font-medium">Không tìm thấy tài liệu nào</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Form */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
                    <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                {isEditing ? <Pencil size={18} className="text-blue-600" /> : <Upload size={18} className="text-blue-600" />}
                                {isEditing ? "Chỉnh sửa tài liệu" : "Thêm tài liệu mới"}
                            </h3>
                            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            {!isEditing && (
                                <>
                                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                        <Upload size={32} className="mx-auto text-blue-500 mb-2" />
                                        <p className="text-sm font-bold text-slate-700">Nhấn để chọn file tải lên (Tối đa 10 file)</p>
                                        <p className="text-xs text-slate-500 mt-1">Hỗ trợ PDF, DOCX, XLSX, PPTX</p>
                                        <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                                    </div>
                                    
                                    {selectedFiles.length > 0 && (
                                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                            {selectedFiles.map((file, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
                                                            {getFileIcon(file.name.split('.').pop()?.toLowerCase() || '')}
                                                        </div>
                                                        <div className="truncate">
                                                            <div className="text-sm font-bold text-slate-700 truncate">{file.name}</div>
                                                            <div className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        type="button"
                                                        onClick={() => removeFile(idx)}
                                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

                            {(!selectedFiles || selectedFiles.length <= 1) && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase text-slate-500">Tên tài liệu <span className="text-red-500">*</span></label>
                                    <input 
                                        required={selectedFiles.length <= 1}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        value={formData.name || ''}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase text-slate-500">Danh mục</label>
                                    <select 
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all bg-white"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="res">Nghị quyết</option>
                                        <option value="fin">Tài chính</option>
                                        <option value="hr">Nhân sự</option>
                                        <option value="meet">Cuộc họp</option>
                                        <option value="other">Khác</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase text-slate-500">Trạng thái</label>
                                    <select 
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all bg-white"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                    >
                                        <option value="approved">Đã duyệt</option>
                                        <option value="pending">Chờ duyệt</option>
                                        <option value="draft">Bản nháp</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                <button 
                                    type="button" 
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 py-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-sm font-bold transition-colors"
                                >
                                    Hủy
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isUploading}
                                    className="flex-1 py-2.5 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-bold transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                                >
                                    {isUploading ? (
                                        <><Loader2 size={16} className="animate-spin" /> Đang xử lý... {uploadProgress > 0 ? `${uploadProgress}%` : ''}</>
                                    ) : (
                                        <><Check size={16} /> {isEditing ? "Cập nhật" : "Lưu tài liệu"}</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentManager;
