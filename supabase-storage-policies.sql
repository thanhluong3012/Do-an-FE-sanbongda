-- ============================================
-- SUPABASE STORAGE POLICIES CHO BUCKET 'image'
-- Copy và chạy đoạn này trong SQL Editor
-- ============================================

-- Xóa policies cũ nếu có (tránh lỗi trùng)
DROP POLICY IF EXISTS "Allow upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow read" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete" ON storage.objects;

-- Policy 1: Cho phép mọi người upload ảnh
CREATE POLICY "Allow upload" 
ON storage.objects 
FOR INSERT 
TO public
WITH CHECK (bucket_id = 'image');

-- Policy 2: Cho phép mọi người xem ảnh
CREATE POLICY "Allow read" 
ON storage.objects 
FOR SELECT 
TO public
USING (bucket_id = 'image');

-- Policy 3: Cho phép mọi người xóa ảnh (optional)
CREATE POLICY "Allow delete" 
ON storage.objects 
FOR DELETE 
TO public
USING (bucket_id = 'image');

-- ============================================
-- Kiểm tra policies đã tạo thành công
-- ============================================
SELECT * FROM pg_policies WHERE tablename = 'objects';
