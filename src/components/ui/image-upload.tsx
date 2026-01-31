import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { uploadImage, deleteImage } from '@/lib/storage';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  bucket?: string;
  folder?: string;
  maxSize?: number; // MB
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  bucket = 'image',
  folder,
  maxSize = 5,
  className,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | undefined>(value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh');
      return;
    }

    if (file.size > maxSize * 1024 * 1024) {
      setError(`Kích thước ảnh không được vượt quá ${maxSize}MB`);
      return;
    }

    try {
      setIsUploading(true);

      // Hiển thị preview ngay
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload lên Supabase
      const url = await uploadImage(file, bucket, folder);
      onChange(url);
      setPreview(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi upload ảnh');
      setPreview(value);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!value) return;

    try {
      setIsUploading(true);
      await deleteImage(value, bucket);
      onChange(null);
      setPreview(undefined);
      setError(null);
      
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi xóa ảnh');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('space-y-2', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
        disabled={isUploading}
      />

      {preview ? (
        <div className="relative group rounded-lg overflow-hidden border-2 border-gray-200">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-64 object-cover"
          />
          
          {/* Overlay khi hover */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleClick}
              disabled={isUploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              Thay đổi
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <X className="w-4 h-4 mr-2" />
              Xóa
            </Button>
          </div>

          {isUploading && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={handleClick}
          className={cn(
            'border-2 border-dashed border-gray-300 rounded-lg p-8',
            'hover:border-primary hover:bg-gray-50 transition-colors cursor-pointer',
            'flex flex-col items-center justify-center gap-3',
            isUploading && 'pointer-events-none opacity-50'
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-sm text-gray-500">Đang upload...</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">
                  Nhấn để chọn ảnh
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, GIF tối đa {maxSize}MB
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
