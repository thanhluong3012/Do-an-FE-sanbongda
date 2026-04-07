import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ui/image-upload';
import { useToast } from '@/hooks/use-toast';
import { teamService, Team, TeamRequest } from '@/services/teamService';
import { Loader2, Shield } from 'lucide-react';

interface TeamFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Nếu truyền `team` thì là chế độ chỉnh sửa, không truyền là tạo mới */
  team?: Team | null;
  onSuccess: (team: Team) => void;
}

const emptyForm: TeamRequest = {
  name: '',
  short_name: '',
  logo: '',
  contact_phone: '',
  contact_email: '',
};

export const TeamFormDialog = ({ open, onOpenChange, team, onSuccess }: TeamFormDialogProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<TeamRequest>(emptyForm);

  const isEdit = !!team;

  // Sync form khi mở dialog chỉnh sửa
  useEffect(() => {
    if (open) {
      setForm(
        team
          ? {
              name: team.name || '',
              short_name: team.short_name || '',
              logo: team.logo || '',
              contact_phone: team.contact_phone || '',
              contact_email: team.contact_email || '',
            }
          : emptyForm,
      );
    }
  }, [open, team]);

  const set = (field: keyof TeamRequest) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: 'Thiếu thông tin', description: 'Tên đội bóng không được để trống', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: TeamRequest = {
        name: form.name.trim(),
        short_name: form.short_name?.trim() || undefined,
        logo: form.logo?.trim() || undefined,
        contact_phone: form.contact_phone?.trim() || undefined,
        contact_email: form.contact_email?.trim() || undefined,
      };

      const result = isEdit
        ? await teamService.update(team!.id, payload)
        : await teamService.create(payload);

      toast({
        title: 'Thành công',
        description: isEdit ? 'Đã cập nhật thông tin đội bóng' : 'Tạo đội bóng thành công!',
      });
      onSuccess(result);
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: 'Lỗi',
        description: err.response?.data?.message || 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md flex flex-col max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{isEdit ? 'Chỉnh sửa đội bóng' : 'Tạo đội bóng mới'}</DialogTitle>
              <DialogDescription>
                {isEdit ? 'Cập nhật thông tin đội bóng của bạn' : 'Điền thông tin để tạo đội bóng mới'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="space-y-4 py-2 overflow-y-auto flex-1 pr-1">
            <div className="space-y-2">
              <Label htmlFor="team-name">
                Tên đội bóng <span className="text-destructive">*</span>
              </Label>
              <Input
                id="team-name"
                placeholder="VD: Câu lạc bộ Phượng Hoàng"
                value={form.name}
                onChange={set('name')}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team-short-name">Tên viết tắt</Label>
              <Input
                id="team-short-name"
                placeholder="VD: PHX"
                maxLength={10}
                value={form.short_name}
                onChange={set('short_name')}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team-phone">Số điện thoại liên hệ</Label>
              <Input
                id="team-phone"
                placeholder="VD: 0987654321"
                type="tel"
                value={form.contact_phone}
                onChange={set('contact_phone')}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team-email">Email liên hệ</Label>
              <Input
                id="team-email"
                placeholder="VD: team@example.com"
                type="email"
                value={form.contact_email}
                onChange={set('contact_email')}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label>Logo đội bóng</Label>
              <ImageUpload
                value={form.logo || undefined}
                onChange={(url) => setForm((prev) => ({ ...prev, logo: url ?? '' }))}
                bucket="image"
                folder="teams"
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Lưu thay đổi' : 'Tạo đội bóng'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
