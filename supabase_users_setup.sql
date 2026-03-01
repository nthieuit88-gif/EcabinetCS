-- ==============================================================================
-- SQL Schema cập nhật bảng Users để hỗ trợ Single Device Login
-- ==============================================================================

-- 1. Tạo bảng Users nếu chưa có (lưu trữ thông tin người dùng và session)
CREATE TABLE IF NOT EXISTS public.users (
    id bigint PRIMARY KEY, -- ID người dùng (khớp với mock data)
    created_at timestamp with time zone DEFAULT now(),
    name text NOT NULL,
    role text, -- 'Admin', 'Giám đốc', ...
    dept text,
    status text DEFAULT 'active',
    avatar_color text,
    email text,
    unit_id text NOT NULL,
    current_session_id text -- Quan trọng: Lưu session ID hiện tại
);

-- 2. Kích hoạt Realtime cho bảng Users
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;

-- 3. Thiết lập bảo mật (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Policy (Cho phép public truy cập - Tùy chỉnh theo nhu cầu thực tế)
DROP POLICY IF EXISTS "Public Access Users" ON public.users;
CREATE POLICY "Public Access Users" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- 5. Index cho hiệu năng
CREATE INDEX IF NOT EXISTS idx_users_unit_id ON public.users(unit_id);
