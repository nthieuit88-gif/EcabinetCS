-- ==============================================================================
-- SQL Schema bổ sung để tạo Storage Bucket và sửa lỗi lưu tài liệu
-- ==============================================================================

-- 1. Tạo Storage Bucket 'documents' nếu chưa có
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Cho phép tất cả mọi người (public) có thể xem, tải lên, sửa, xóa file trong bucket 'documents'
CREATE POLICY "Public Access Storage" ON storage.objects FOR ALL USING (bucket_id = 'documents');

-- 3. Đảm bảo bảng documents có đầy đủ quyền INSERT (sửa lại policy cũ cho chắc chắn)
DROP POLICY IF EXISTS "Public Access Documents" ON public.documents;
CREATE POLICY "Public Access Documents" ON public.documents FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Access Bookings" ON public.bookings;
CREATE POLICY "Public Access Bookings" ON public.bookings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Access Booking Documents" ON public.booking_documents;
CREATE POLICY "Public Access Booking Documents" ON public.booking_documents FOR ALL USING (true) WITH CHECK (true);
