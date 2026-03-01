import { supabase } from './supabaseClient';

export interface User {
    id: number;
    name: string;
    role: string;
    dept: string;
    status: 'active' | 'offline';
    avatarColor: string;
    email?: string;
    unitId: string;
    currentSessionId?: string;
}

export interface Room {
    id: string;
    name: string;
    capacity: number;
    location: string;
    amenities: string[];
    status: 'active' | 'maintenance';
    image?: string;
}

export interface Booking {
    id: number;
    day: number;
    title: string;
    startTime: string;
    endTime: string;
    roomId: string;
    type: 'internal' | 'external' | 'training' | 'important';
    attendees: User[];
    documents: any[];
}

export interface Document {
    id: number;
    name: string;
    date: string;
    size: string;
    type: string;
    status: 'approved' | 'draft' | 'pending';
    category: string;
    url?: string;
}

export interface UnitData {
    id: string;
    name: string;
    users: User[];
    rooms: Room[];
    bookings: Booking[];
    documents: Document[];
    lastUpdated?: number; // Timestamp for cache invalidation
}

const UNIT_IDS = ['unit_1', 'unit_2', 'unit_3'];

const UNIT_NAMES: Record<string, string> = {
    'unit_1': 'Đơn vị 1 (UBND phường 1)',
    'unit_2': 'Đơn vị 2 (UBND xã 2)',
    'unit_3': 'Đơn vị 3 (UBND XP 3)'
};

const AVATAR_COLORS = [
    "bg-gradient-to-br from-blue-500 to-indigo-600",
    "bg-gradient-to-br from-emerald-500 to-teal-600",
    "bg-gradient-to-br from-orange-500 to-red-600",
    "bg-gradient-to-br from-pink-500 to-rose-600",
    "bg-gradient-to-br from-indigo-500 to-purple-600",
    "bg-gradient-to-br from-blue-400 to-cyan-500"
];

const DEPARTMENTS = ["Hội đồng quản trị", "Ban Giám đốc", "Phòng Kế toán", "Phòng Nhân sự", "Phòng IT", "Phòng Kinh doanh"];

// Helper to generate mock users
const generateUsers = (unitId: string): User[] => {
    const users: User[] = [];
    
    // 1. Create Admin
    users.push({
        id: Date.now(),
        name: `Quản trị viên ${unitId.split('_')[1]}`,
        role: "Admin",
        dept: "Ban Quản trị",
        status: "active",
        avatarColor: "bg-gradient-to-br from-purple-600 to-indigo-700",
        email: `admin@${unitId}.com`,
        unitId: unitId
    });

    // 2. Create 25 Users
    for (let i = 1; i <= 25; i++) {
        users.push({
            id: Date.now() + i,
            name: `Nhân viên ${i} - ${unitId.split('_')[1]}`,
            role: i <= 2 ? "Giám đốc" : (i <= 5 ? "Thư ký" : "Thành viên"),
            dept: DEPARTMENTS[i % DEPARTMENTS.length],
            status: Math.random() > 0.3 ? "active" : "offline",
            avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
            email: `user${i}@${unitId}.com`,
            unitId: unitId
        });
    }
    
    return users;
};

const generateRooms = (unitId: string): Room[] => {
    return [
        { id: 'r1', name: 'Phòng họp A1', capacity: 20, location: 'Tầng 2', amenities: ['Projector', 'Whiteboard'], status: 'active' },
        { id: 'r2', name: 'Phòng VIP', capacity: 10, location: 'Tầng 3', amenities: ['TV', 'Video Conference', 'Sofa'], status: 'active' },
        { id: 'r3', name: 'Hội trường B', capacity: 100, location: 'Tầng 1', amenities: ['Sound System', 'Stage'], status: 'active' },
    ];
};

const generateDocuments = (unitId: string): Document[] => {
    return [
        { id: 1, name: "Nghị quyết 45/NQ-HĐQT - Phê duyệt kế hoạch Q2", date: "Vừa xong", size: "2.4 MB", type: "pdf", status: "approved", category: "res" },
        { id: 2, name: "Báo cáo tài chính Quý 1/2024 (Kiểm toán)", date: "2 giờ trước", size: "5.1 MB", type: "xlsx", status: "approved", category: "fin" },
        { id: 3, name: "Dự thảo quy chế lương thưởng v2.1", date: "Hôm qua", size: "1.2 MB", type: "docx", status: "pending", category: "hr" },
        { id: 4, name: "Biên bản cuộc họp giao ban tuần 14", date: "12/04/2024", size: "800 KB", type: "pdf", status: "draft", category: "meet" },
        { id: 5, name: "Slide trình bày chiến lược Marketing", date: "10/04/2024", size: "14.5 MB", type: "pptx", status: "approved", category: "res" },
        { id: 6, name: "Hợp đồng đối tác công nghệ (Scan)", date: "05/04/2024", size: "3.2 MB", type: "pdf", status: "approved", category: "other" },
        { id: 7, name: "Danh sách nhân sự đề xuất thăng chức", date: "01/04/2024", size: "1.5 MB", type: "xlsx", status: "pending", category: "hr" },
        { id: 8, name: "Quy trình tuyển dụng nhân sự mới", date: "01/04/2024", size: "1.1 MB", type: "pdf", status: "approved", category: "hr" },
        { id: 9, name: "Báo cáo doanh thu tháng 3", date: "31/03/2024", size: "2.8 MB", type: "xlsx", status: "approved", category: "fin" },
        { id: 10, name: "Biên bản họp cổ đông thường niên", date: "25/03/2024", size: "3.5 MB", type: "pdf", status: "approved", category: "meet" },
        { id: 11, name: "Kế hoạch truyền thông Q2", date: "20/03/2024", size: "5.2 MB", type: "pptx", status: "draft", category: "res" },
        { id: 12, name: "Hợp đồng thuê văn phòng mới", date: "15/03/2024", size: "1.8 MB", type: "pdf", status: "approved", category: "other" },
    ];
};

const generateBookings = (unitId: string, users: User[], rooms: Room[]): Booking[] => {
    // Seed some initial bookings based on MeetingCalendar's INITIAL_EVENTS logic
    return [
        { 
            id: 1, 
            day: 2, 
            title: "Giao ban khối CN", 
            startTime: "08:30", 
            endTime: "10:00", 
            roomId: rooms[0].id, 
            type: 'internal', 
            attendees: [users[5], users[0]], 
            documents: [] 
        },
        { 
            id: 2, 
            day: 4, 
            title: "Họp HĐQT Quý 3", 
            startTime: "14:00", 
            endTime: "17:00", 
            roomId: rooms[1].id, 
            type: 'important', 
            attendees: users.slice(0, 6), 
            documents: [{name: 'Tai_lieu_hop.pdf', size: '2MB', type: 'pdf'}] 
        },
        { 
            id: 3, 
            day: 10, 
            title: "Đào tạo nhân sự mới", 
            startTime: "08:30", 
            endTime: "11:30", 
            roomId: rooms[2].id, 
            type: 'training', 
            attendees: [], 
            documents: [] 
        },
    ];
};

// Initialize Data if not exists
export const initData = () => {
    if (typeof window === 'undefined') return;

    // Check for cache expiration (7 days)
    const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
    const lastCleanup = localStorage.getItem('ECABINET_LAST_CLEANUP');
    
    if (lastCleanup && (Date.now() - parseInt(lastCleanup) > CACHE_EXPIRY_MS)) {
        console.log("Cache expired (7 days). Clearing local storage...");
        UNIT_IDS.forEach(unitId => {
            localStorage.removeItem(`ECABINET_DATA_${unitId}`);
        });
        localStorage.removeItem('ECABINET_CURRENT_UNIT');
        localStorage.setItem('ECABINET_LAST_CLEANUP', Date.now().toString());
        // Force reload to regenerate fresh data
        window.location.reload();
        return;
    }

    // Set initial cleanup timestamp if missing
    if (!lastCleanup) {
        localStorage.setItem('ECABINET_LAST_CLEANUP', Date.now().toString());
    }

    // Ensure current unit is set
    if (!localStorage.getItem('ECABINET_CURRENT_UNIT')) {
        localStorage.setItem('ECABINET_CURRENT_UNIT', 'unit_1');
    }

    // Pre-seed all units if they don't exist
    UNIT_IDS.forEach(unitId => {
        const key = `ECABINET_DATA_${unitId}`;
        if (!localStorage.getItem(key)) {
            const users = generateUsers(unitId);
            const rooms = generateRooms(unitId);
            const documents = generateDocuments(unitId);
            const bookings = generateBookings(unitId, users, rooms);

            const initialData: UnitData = {
                id: unitId,
                name: UNIT_NAMES[unitId],
                users: users,
                rooms: rooms,
                bookings: bookings,
                documents: documents
            };
            localStorage.setItem(key, JSON.stringify(initialData));
        }
    });
};

// Get Current Active Unit ID
export const getCurrentUnitId = (): string => {
    if (typeof window === 'undefined') return 'unit_1';
    return localStorage.getItem('ECABINET_CURRENT_UNIT') || 'unit_1';
};

// Set Current Active Unit ID
export const setCurrentUnitId = (unitId: string) => {
    localStorage.setItem('ECABINET_CURRENT_UNIT', unitId);
    // Dispatch custom event to notify App to re-render
    window.dispatchEvent(new Event('unit-change'));
};

// Get Data for Specific Unit
export const getUnitData = (unitId: string): UnitData => {
    const key = `ECABINET_DATA_${unitId}`;
    const dataStr = localStorage.getItem(key);
    
    if (dataStr) {
        try {
            const parsedData = JSON.parse(dataStr);
            // Force update unit name to match current configuration
            if (parsedData.name !== UNIT_NAMES[unitId]) {
                parsedData.name = UNIT_NAMES[unitId];
                localStorage.setItem(key, JSON.stringify(parsedData));
            }
            return parsedData;
        } catch (e) {
            console.error("Corrupt unit data found, regenerating...", e);
            localStorage.removeItem(key);
        }
    }
    
    // If data is missing or corrupt, generate it immediately
    const name = UNIT_NAMES[unitId] || `Đơn vị ${unitId}`;
    const users = generateUsers(unitId);
    const rooms = generateRooms(unitId);
    const documents = generateDocuments(unitId);
    const bookings = generateBookings(unitId, users, rooms);

    const initialData: UnitData = {
        id: unitId,
        name: name,
        users: users,
        rooms: rooms,
        bookings: bookings,
        documents: documents
    };
    
    // Save generated data
    localStorage.setItem(key, JSON.stringify(initialData));
    
    return initialData;
};

// Get Data for Current Unit (Lazy Loading)
export const getCurrentUnitData = (): UnitData => {
    return getUnitData(getCurrentUnitId());
};

// Get User by ID
export const getUserById = (userId: number, unitId?: string): User | undefined => {
    const targetUnitId = unitId || getCurrentUnitId();
    const data = getUnitData(targetUnitId);
    return data.users.find(u => u.id === userId);
};

// Update User Session
export const updateUserSession = (userId: number, sessionId: string, unitId?: string) => {
    const targetUnitId = unitId || getCurrentUnitId();
    const key = `ECABINET_DATA_${targetUnitId}`;
    const currentData = getUnitData(targetUnitId);
    
    const updatedUsers = currentData.users.map(user => 
        user.id === userId ? { ...user, currentSessionId: sessionId } : user
    );
    
    const newData: UnitData = {
        ...currentData,
        users: updatedUsers
    };
    
    localStorage.setItem(key, JSON.stringify(newData));
};

// Save Users for Current Unit
export const saveCurrentUnitUsers = (users: User[]) => {
    const unitId = getCurrentUnitId();
    const key = `ECABINET_DATA_${unitId}`;
    const currentData = getCurrentUnitData();
    
    const newData: UnitData = {
        ...currentData,
        users: users
    };
    
    localStorage.setItem(key, JSON.stringify(newData));
    window.dispatchEvent(new Event('data-change'));
};

// Save Rooms for Current Unit
export const saveCurrentUnitRooms = (rooms: Room[]) => {
    const unitId = getCurrentUnitId();
    const key = `ECABINET_DATA_${unitId}`;
    const currentData = getCurrentUnitData();
    
    const newData: UnitData = {
        ...currentData,
        rooms: rooms
    };
    
    localStorage.setItem(key, JSON.stringify(newData));
    window.dispatchEvent(new Event('data-change'));
};

// Save Bookings for Current Unit
export const saveCurrentUnitBookings = (bookings: Booking[]) => {
    const unitId = getCurrentUnitId();
    const key = `ECABINET_DATA_${unitId}`;
    const currentData = getCurrentUnitData();
    
    const newData: UnitData = {
        ...currentData,
        bookings: bookings
    };
    
    localStorage.setItem(key, JSON.stringify(newData));
    window.dispatchEvent(new Event('data-change'));
};

export const saveCurrentUnitDocuments = (documents: Document[]) => {
    const unitId = getCurrentUnitId();
    const key = `ECABINET_DATA_${unitId}`;
    const currentData = getCurrentUnitData();
    
    const newData: UnitData = {
        ...currentData,
        documents: documents
    };
    
    localStorage.setItem(key, JSON.stringify(newData));
    window.dispatchEvent(new Event('data-change'));
};

export const syncUsersFromSupabase = async (unitId: string): Promise<User[]> => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('unit_id', unitId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching users from Supabase:', error);
            return getUnitData(unitId).users || [];
        }

        if (data && data.length > 0) {
            const mappedUsers: User[] = data.map(u => ({
                id: u.id,
                name: u.name,
                role: u.role,
                dept: u.dept,
                status: u.status as any,
                avatarColor: u.avatar_color,
                email: u.email,
                unitId: u.unit_id,
                currentSessionId: u.current_session_id
            }));

            const key = `ECABINET_DATA_${unitId}`;
            const currentDataStr = localStorage.getItem(key);
            if (currentDataStr) {
                const currentData = JSON.parse(currentDataStr);
                currentData.users = mappedUsers;
                localStorage.setItem(key, JSON.stringify(currentData));
                window.dispatchEvent(new Event('data-change'));
            }
            return mappedUsers;
        }
    } catch (err) {
        console.error('Failed to sync users:', err);
    }
    return getUnitData(unitId).users || [];
};

export const syncDocumentsFromSupabase = async (unitId: string): Promise<Document[]> => {
    try {
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('unit_id', unitId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching documents from Supabase:', error);
            // Fallback to local storage
            return getUnitData(unitId).documents || [];
        }

        if (data) {
            const mappedDocs: Document[] = data.map(d => ({
                id: d.id,
                name: d.name,
                date: d.date,
                size: d.size,
                type: d.type,
                status: d.status as any,
                category: d.category,
                url: d.file_url
            }));

            const key = `ECABINET_DATA_${unitId}`;
            const currentDataStr = localStorage.getItem(key);
            if (currentDataStr) {
                const currentData = JSON.parse(currentDataStr);
                
                // Preserve pending documents (local only)
                const currentDocs = currentData.documents || [];
                const pendingDocs = currentDocs.filter((d: Document) => d.status === 'pending');
                
                // Combine pending docs with remote docs
                // Deduplicate by ID to avoid "Encountered two children with the same key" error
                const existingIds = new Set(mappedDocs.map(d => d.id));
                const uniquePendingDocs = pendingDocs.filter((d: Document) => !existingIds.has(d.id));
                
                currentData.documents = [...uniquePendingDocs, ...mappedDocs];
                
                localStorage.setItem(key, JSON.stringify(currentData));
                window.dispatchEvent(new Event('data-change'));
            }
            return mappedDocs;
        }
    } catch (err) {
        console.error('Failed to sync documents:', err);
    }
    // Fallback to local storage
    return getUnitData(unitId).documents || [];
};

export const syncBookingsFromSupabase = async (unitId: string): Promise<Booking[]> => {
    // Sync rooms first to avoid foreign key issues
    const unitData = getUnitData(unitId);
    if (unitData.rooms && unitData.rooms.length > 0) {
        try {
            const roomsToSync = unitData.rooms.map(r => ({
                id: r.id,
                name: r.name,
                capacity: r.capacity || 0,
                unit_id: unitId
            }));
            await supabase.from('rooms').upsert(roomsToSync, { onConflict: 'id' });
        } catch (err) {
            console.warn('Room sync failed, but continuing...', err);
        }
    }

    try {
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('unit_id', unitId)
            .order('day', { ascending: true });

        if (error) {
            console.error('Error fetching bookings from Supabase:', error);
            return getUnitData(unitId).bookings || [];
        }

        if (data) {
            const mappedBookings: Booking[] = data.map(b => ({
                id: b.id,
                day: b.day,
                title: b.title,
                startTime: b.start_time,
                endTime: b.end_time,
                roomId: b.room_id,
                type: b.type as any,
                attendees: b.attendees || [],
                documents: b.documents || []
            }));

            const key = `ECABINET_DATA_${unitId}`;
            const currentDataStr = localStorage.getItem(key);
            if (currentDataStr) {
                const currentData = JSON.parse(currentDataStr);
                currentData.bookings = mappedBookings;
                localStorage.setItem(key, JSON.stringify(currentData));
                window.dispatchEvent(new Event('data-change'));
            }
            return mappedBookings;
        }
    } catch (err) {
        console.error('Failed to sync bookings:', err);
    }
    return getUnitData(unitId).bookings || [];
};

export const getAllUnits = () => {
    return UNIT_IDS.map(id => ({ id, name: UNIT_NAMES[id] }));
};