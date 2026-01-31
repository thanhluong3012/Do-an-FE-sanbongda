# Hướng dẫn sử dụng Supabase Storage

## 1. Setup Supabase Storage Bucket

### Bước 1: Tạo Bucket
1. Vào [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project của bạn
3. Vào **Storage** → **Create bucket**
4. Tạo bucket với tên: `field-images`
5. Chọn **Public bucket** (để lấy URL public)

### Bước 2: Setup Storage Policies
Vào tab **Policies** của bucket `field-images` và thêm policies:

#### Policy cho Upload (INSERT):
```sql
-- Cho phép authenticated users upload
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'field-images');
```

#### Policy cho Read (SELECT):
```sql
-- Cho phép public read
CREATE POLICY "Allow public to read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'field-images');
```

#### Policy cho Delete:
```sql
-- Cho phép authenticated users delete
CREATE POLICY "Allow authenticated users to delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'field-images');
```

## 2. Cấu trúc thư mục trong Bucket

```
field-images/
├── fields/          # Ảnh sân bóng
├── avatars/         # Avatar người dùng
└── tournaments/     # Ảnh giải đấu
```

## 3. Sử dụng trong Code

### Upload ảnh đơn:
```tsx
import { uploadImage } from '@/lib/storage';

const handleUpload = async (file: File) => {
  try {
    const url = await uploadImage(file, 'field-images', 'fields');
    console.log('Uploaded:', url);
    // Lưu URL này vào database
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### Sử dụng ImageUpload component:
```tsx
import { ImageUpload } from '@/components/ui/image-upload';

function MyForm() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  return (
    <ImageUpload
      value={imageUrl || undefined}
      onChange={(url) => setImageUrl(url)}
      bucket="field-images"
      folder="fields"
      maxSize={5} // MB
    />
  );
}
```

## 4. Tích hợp với Backend

### Database Schema:
```sql
CREATE TABLE fields (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  location VARCHAR(255),
  price DECIMAL(10, 2),
  image VARCHAR(500),  -- Lưu URL từ Supabase Storage
  description TEXT,
  status VARCHAR(20) DEFAULT 'available',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Backend API (Node.js/Express):
```javascript
// POST /api/fields
app.post('/api/fields', async (req, res) => {
  const { name, type, location, price, image, description, status } = req.body;
  
  // Lưu vào database với image URL từ frontend
  const result = await db.query(
    'INSERT INTO fields (name, type, location, price, image, description, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [name, type, location, price, image, description, status]
  );
  
  res.json(result.rows[0]);
});
```

## 5. Flow hoàn chỉnh

1. **Frontend**: User chọn ảnh
2. **Frontend**: Upload ảnh lên Supabase Storage → nhận URL
3. **Frontend**: Submit form với URL ảnh
4. **Backend**: Nhận request, lưu URL vào database
5. **Frontend**: Hiển thị ảnh từ URL public

## 6. Test ngay

1. Chạy dev server: `npm run dev`
2. Vào trang Admin Fields: `/admin/fields`
3. Click "Thêm Sân Mới"
4. Upload ảnh và xem kết quả!

## 7. Troubleshooting

### Lỗi "Invalid bucket"
- Kiểm tra tên bucket đã đúng chưa
- Bucket phải là **public**

### Lỗi "Storage policy"
- Kiểm tra policies đã tạo đúng chưa
- User phải authenticated để upload

### Lỗi CORS
- Supabase tự động handle CORS
- Nếu vẫn lỗi, check lại project URL trong `.env`

## 8. Giới hạn Free Tier

- **Storage**: 1GB
- **Bandwidth**: 2GB/tháng
- **Request**: 50GB egress

→ Đủ cho đồ án tốt nghiệp!
