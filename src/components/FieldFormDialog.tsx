import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/image-upload';
import { Loader2 } from 'lucide-react';

interface FieldFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FieldFormData) => Promise<void>;
  initialData?: Partial<FieldFormData>;
  mode?: 'create' | 'edit';
}

export interface FieldFormData {
  name: string;
  type: string;
  location: string;
  district: string;
  price: string;
  status: 'available' | 'occupied' | 'maintenance';
  rating?: number;
  openTime: string;
  closeTime: string;
  image: string | null;
  rule?: string;
  features?: string[];
}

export function FieldFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode = 'create',
}: FieldFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FieldFormData>({
    name: initialData?.name || '',
    type: initialData?.type || '5 người',
    location: initialData?.location || '',
    district: initialData?.district || '',
    price: initialData?.price || '',
    status: initialData?.status || 'available',
    rating: initialData?.rating || 0,
    openTime: initialData?.openTime || '06:00',
    closeTime: initialData?.closeTime || '22:00',
    image: initialData?.image || null,
    rule: initialData?.rule || '',
    features: initialData?.features || [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
      onOpenChange(false);
      // Reset form
      setFormData({
        name: '',
        type: '5 người',
        location: '',
        district: '',
        price: '',
        status: 'available',
        rating: 0,
        openTime: '06:00',
        closeTime: '22:00',
        image: null,
        rule: '',
        features: [],
      });
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Thêm Sân Mới' : 'Chỉnh Sửa Sân'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Ảnh sân */}
          <div className="space-y-2">
            <Label htmlFor="image">Ảnh Sân *</Label>
            <ImageUpload
              value={formData.image || undefined}
              onChange={(url) => setFormData({ ...formData, image: url })}
              bucket="image"
              folder="fields"
            />
          </div>

          {/* Tên sân */}
          <div className="space-y-2">
            <Label htmlFor="name">Tên Sân *</Label>
            <Input
              id="name"
              placeholder="Ví dụ: Sân A1"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* Loại sân & Trạng thái */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Loại Sân *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5 người">5 người</SelectItem>
                  <SelectItem value="7 người">7 người</SelectItem>
                  <SelectItem value="11 người">11 người</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Trạng Thái *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Sẵn sàng</SelectItem>
                  <SelectItem value="occupied">Đang sử dụng</SelectItem>
                  <SelectItem value="maintenance">Bảo trì</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Địa chỉ & Quận */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Địa Chỉ *</Label>
              <Input
                id="location"
                placeholder="Ví dụ: 123 Nguyễn Trãi"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
                maxLength={255}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="district">Quận *</Label>
              <Input
                id="district"
                placeholder="Ví dụ: Quận 1"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                required
                maxLength={255}
              />
            </div>
          </div>

          {/* Giá & Rating */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Giá (VNĐ/giờ) *</Label>
              <Input
                id="price"
                type="number"
                placeholder="Ví dụ: 300000"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating">Đánh Giá (0-5)</Label>
              <Input
                id="rating"
                type="number"
                placeholder="0"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })}
                min="0"
                max="5"
                step="0.1"
              />
            </div>
          </div>

          {/* Giờ mở & đóng cửa */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="openTime">Giờ Mở Cửa *</Label>
              <Input
                id="openTime"
                type="time"
                value={formData.openTime}
                onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="closeTime">Giờ Đóng Cửa *</Label>
              <Input
                id="closeTime"
                type="time"
                value={formData.closeTime}
                onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Quy định */}
          <div className="space-y-2">
            <Label htmlFor="rule">Quy Định</Label>
            <Textarea
              id="rule"
              placeholder="Ví dụ: Không hút thuốc, giữ vệ sinh sạch sẽ..."
              rows={3}
              value={formData.rule}
              onChange={(e) => setFormData({ ...formData, rule: e.target.value })}
            />
          </div>

          {/* Tiện ích */}
          <div className="space-y-2">
            <Label htmlFor="features">Tiện Ích (nhập cách nhau bởi dấu phẩy)</Label>
            <Textarea
              id="features"
              placeholder="Ví dụ: Đèn chiếu sáng, Phòng thay đồ, Bãi đỗ xe"
              rows={2}
              value={formData.features?.join(', ') || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                features: e.target.value.split(',').map(f => f.trim()).filter(f => f) 
              })}
            />
          </div>



          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === 'create' ? 'Thêm Sân' : 'Lưu Thay Đổi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
