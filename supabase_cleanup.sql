-- ==============================================================================
-- SQL Script để tự động dọn dẹp dữ liệu cũ (Cache & Storage) sau 7 ngày
-- ==============================================================================

-- 1. Hàm dọn dẹp dữ liệu cũ
-- Hàm này sẽ xóa các bản ghi trong bảng documents, bookings và file trong storage
-- nếu chúng được tạo cách đây hơn 7 ngày.
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- A. Xóa file trong Storage (Bucket 'documents')
    -- Lưu ý: Cần quyền truy cập vào schema storage.
    -- Xóa các object trong bucket 'documents' cũ hơn 7 ngày
    DELETE FROM storage.objects
    WHERE bucket_id = 'documents'
    AND created_at < now() - interval '7 days';
    
    -- B. Xóa bản ghi trong bảng documents (Metadata)
    -- Xóa các tài liệu cũ hơn 7 ngày
    DELETE FROM public.documents
    WHERE created_at < now() - interval '7 days';
    
    -- C. Xóa bản ghi trong bảng bookings (Lịch họp)
    -- Xóa các cuộc họp đã diễn ra quá 7 ngày
    DELETE FROM public.bookings
    WHERE created_at < now() - interval '7 days';

    -- D. Xóa bản ghi trong bảng booking_documents (Liên kết)
    -- (Thường sẽ tự động xóa nếu có ON DELETE CASCADE, nhưng xóa thủ công cho chắc)
    DELETE FROM public.booking_documents
    WHERE created_at < now() - interval '7 days';

END;
$$;

-- 2. Hướng dẫn lập lịch tự động (Cron Job)
-- Để hàm này tự động chạy mỗi ngày, bạn cần cài đặt extension pg_cron trên Supabase.
-- Chạy lệnh sau trong SQL Editor của Supabase:

/*
-- Bật extension pg_cron (nếu chưa bật)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Lên lịch chạy hàm cleanup_old_data vào lúc 00:00 mỗi ngày
SELECT cron.schedule(
    'cleanup_daily_7days', -- Tên job
    '0 0 * * *',           -- Cron expression (00:00 hàng ngày)
    'SELECT cleanup_old_data()'
);

-- Để xem các job đang chạy:
-- SELECT * FROM cron.job;

-- Để xóa job:
-- SELECT cron.unschedule('cleanup_daily_7days');
*/
