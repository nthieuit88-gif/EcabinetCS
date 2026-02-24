import React, { useState, useEffect } from 'react';
import { getCurrentUnitData, saveCurrentUnitRooms, Room } from '../../utils/dataManager';
import { Plus, Pencil, Trash2, X, Check, MapPin, Users, Monitor } from 'lucide-react';

const RoomManager: React.FC = () => {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);
    const [formData, setFormData] = useState<Partial<Room>>({
        name: '',
        capacity: 10,
        location: '',
        amenities: [],
        status: 'active'
    });

    useEffect(() => {
        loadRooms();
    }, []);

    const loadRooms = () => {
        const data = getCurrentUnitData();
        setRooms(data.rooms || []);
    };

    const handleOpenModal = (room?: Room) => {
        if (room) {
            setEditingRoom(room);
            setFormData(room);
        } else {
            setEditingRoom(null);
            setFormData({
                name: '',
                capacity: 10,
                location: '',
                amenities: [],
                status: 'active'
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingRoom(null);
    };

    const handleSave = () => {
        if (!formData.name || !formData.location) return;

        let newRooms = [...rooms];
        if (editingRoom) {
            newRooms = newRooms.map(r => r.id === editingRoom.id ? { ...formData, id: editingRoom.id } as Room : r);
        } else {
            const newRoom: Room = {
                ...formData as Room,
                id: `room_${Date.now()}`,
                amenities: formData.amenities || []
            };
            newRooms.push(newRoom);
        }

        saveCurrentUnitRooms(newRooms);
        setRooms(newRooms);
        handleCloseModal();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa phòng này?')) {
            const newRooms = rooms.filter(r => r.id !== id);
            saveCurrentUnitRooms(newRooms);
            setRooms(newRooms);
        }
    };

    const toggleAmenity = (amenity: string) => {
        const current = formData.amenities || [];
        if (current.includes(amenity)) {
            setFormData({ ...formData, amenities: current.filter(a => a !== amenity) });
        } else {
            setFormData({ ...formData, amenities: [...current, amenity] });
        }
    };

    const AVAILABLE_AMENITIES = ['Projector', 'Whiteboard', 'TV', 'Video Conference', 'Sound System', 'Stage', 'Sofa'];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Quản lý phòng họp</h2>
                <button 
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                >
                    <Plus size={18} /> Thêm phòng mới
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map(room => (
                    <div key={room.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                        <div className="h-32 bg-slate-100 relative">
                            {/* Placeholder Image */}
                            <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                                <Monitor size={48} />
                            </div>
                            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenModal(room)} className="p-2 bg-white rounded-lg shadow-sm text-slate-600 hover:text-blue-600">
                                    <Pencil size={14} />
                                </button>
                                <button onClick={() => handleDelete(room.id)} className="p-2 bg-white rounded-lg shadow-sm text-slate-600 hover:text-red-600">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            <div className={`absolute bottom-3 left-3 px-2 py-1 rounded text-[10px] font-bold uppercase ${room.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {room.status === 'active' ? 'Hoạt động' : 'Bảo trì'}
                            </div>
                        </div>
                        <div className="p-5">
                            <h3 className="font-bold text-lg text-slate-800 mb-1">{room.name}</h3>
                            <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                                <span className="flex items-center gap-1"><MapPin size={12} /> {room.location}</span>
                                <span className="flex items-center gap-1"><Users size={12} /> {room.capacity} chỗ</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {room.amenities.map(a => (
                                    <span key={a} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">{a}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">{editingRoom ? 'Sửa thông tin phòng' : 'Thêm phòng mới'}</h3>
                            <button onClick={handleCloseModal} className="p-1 rounded hover:bg-slate-200 text-slate-500">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Tên phòng</label>
                                <input 
                                    type="text" 
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    placeholder="Ví dụ: Phòng họp A1"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Sức chứa</label>
                                    <input 
                                        type="number" 
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        value={formData.capacity}
                                        onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Vị trí</label>
                                    <input 
                                        type="text" 
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        value={formData.location}
                                        onChange={e => setFormData({...formData, location: e.target.value})}
                                        placeholder="Ví dụ: Tầng 2"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Trạng thái</label>
                                <select 
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                                    value={formData.status}
                                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                                >
                                    <option value="active">Hoạt động</option>
                                    <option value="maintenance">Bảo trì</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Tiện nghi</label>
                                <div className="flex flex-wrap gap-2">
                                    {AVAILABLE_AMENITIES.map(amenity => (
                                        <button 
                                            key={amenity}
                                            onClick={() => toggleAmenity(amenity)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                                formData.amenities?.includes(amenity) 
                                                ? 'bg-blue-50 border-blue-200 text-blue-600' 
                                                : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300'
                                            }`}
                                        >
                                            {amenity}
                                        </button>
                                    ))}
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

export default RoomManager;
