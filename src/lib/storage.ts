import { supabase } from '@/integrations/supabase/client';

/**
 * Upload ảnh lên Supabase Storage
 * @param file - File ảnh cần upload
 * @param bucket - Tên bucket (mặc định: 'image')
 * @param folder - Thư mục con trong bucket (optional)
 * @returns URL public của ảnh hoặc throw error
 */
export async function uploadImage(
  file: File,
  bucket: string = 'image',
  folder?: string
): Promise<string> {
  try {
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
      throw new Error('Thiếu cấu hình Supabase trong file .env (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY)');
    }

    // Validate file
    if (!file.type.startsWith('image/')) {
      throw new Error('File phải là ảnh');
    }

    // Giới hạn 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('Kích thước ảnh không được vượt quá 5MB');
    }

    // Tạo tên file unique
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 9);
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomStr}.${fileExt}`;
    
    // Tạo path với folder nếu có
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Lỗi upload: ${error.message}`);
    }

    // Lấy URL public
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Upload image error:', error);
    if (error instanceof Error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Không thể kết nối Supabase Storage. Kiểm tra internet, VITE_SUPABASE_URL, bucket và Storage Policies.');
      }

      throw error;
    }

    throw new Error('Lỗi upload ảnh không xác định');
  }
}

/**
 * Xóa ảnh từ Supabase Storage
 * @param url - URL của ảnh cần xóa
 * @param bucket - Tên bucket
 */
export async function deleteImage(
  url: string,
  bucket: string = 'image'
): Promise<void> {
  try {
    // Extract path từ URL
    // URL format: https://xxx.supabase.co/storage/v1/object/public/bucket-name/path
    const urlParts = url.split(`/storage/v1/object/public/${bucket}/`);
    if (urlParts.length < 2) {
      throw new Error('URL không hợp lệ');
    }
    
    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      throw new Error(`Lỗi xóa ảnh: ${error.message}`);
    }
  } catch (error) {
    console.error('Delete image error:', error);
    throw error;
  }
}

/**
 * Upload nhiều ảnh cùng lúc
 * @param files - Danh sách file ảnh
 * @param bucket - Tên bucket
 * @param folder - Thư mục con
 * @returns Mảng URL của các ảnh đã upload
 */
export async function uploadMultipleImages(
  files: File[],
  bucket: string = 'image',
  folder?: string
): Promise<string[]> {
  const uploadPromises = files.map(file => uploadImage(file, bucket, folder));
  return Promise.all(uploadPromises);
}
