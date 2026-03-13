import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tournament, TournamentRequest } from '@/services/tournamentService';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CalendarIcon, Info } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TournamentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TournamentRequest) => Promise<void>;
  tournament?: Tournament | null;
  fieldClusters?: Array<{ id: number; name: string }>;
}

export const TournamentFormDialog = ({
  open,
  onOpenChange,
  onSubmit,
  tournament,
  fieldClusters = []
}: TournamentFormDialogProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<TournamentRequest>({
    name: '',
    description: '',
    format: 'round_robin',
    max_teams: 8,
    min_teams: 4,
    registration_start: '',
    registration_end: '',
    start_date: '',
    end_date: '',
    field_cluster_id: 0,
  });

  // Date states
  const [regStartDate, setRegStartDate] = useState<Date>();
  const [regEndDate, setRegEndDate] = useState<Date>();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  useEffect(() => {
    if (tournament) {
      setFormData({
        name: tournament.name,
        description: tournament.description || '',
        format: tournament.format,
        max_teams: tournament.max_teams,
        min_teams: tournament.min_teams,
        registration_start: tournament.registration_start,
        registration_end: tournament.registration_end,
        start_date: tournament.start_date,
        end_date: tournament.end_date,
        field_cluster_id: tournament.field_cluster_id,
      });
      // Set dates
      setRegStartDate(new Date(tournament.registration_start));
      setRegEndDate(new Date(tournament.registration_end));
      setStartDate(new Date(tournament.start_date));
      setEndDate(new Date(tournament.end_date));
    } else {
      setFormData({
        name: '',
        description: '',
        format: 'round_robin',
        max_teams: 8,
        min_teams: 4,
        registration_start: '',
        registration_end: '',
        start_date: '',
        end_date: '',
        field_cluster_id: 0,
      });
      setRegStartDate(undefined);
      setRegEndDate(undefined);
      setStartDate(undefined);
      setEndDate(undefined);
    }
  }, [tournament, open]);

  const handleDateChange = (type: 'regStart' | 'regEnd' | 'start' | 'end', date: Date | undefined) => {
    if (!date) return;

    const dateString = format(date, 'yyyy-MM-dd');
    const dateTimeString = format(date, 'yyyy-MM-dd HH:mm:ss');

    switch (type) {
      case 'regStart':
        setRegStartDate(date);
        setFormData({ ...formData, registration_start: dateTimeString });
        break;
      case 'regEnd':
        setRegEndDate(date);
        setFormData({ ...formData, registration_end: dateTimeString });
        break;
      case 'start':
        setStartDate(date);
        setFormData({ ...formData, start_date: dateString });
        break;
      case 'end':
        setEndDate(date);
        setFormData({ ...formData, end_date: dateString });
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.field_cluster_id || formData.field_cluster_id === 0) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng điền đầy đủ thông tin bắt buộc (Tên giải và Cụm sân)',
        variant: 'destructive',
      });
      return;
    }

    // Validate dates
    if (!formData.registration_start || !formData.registration_end || !formData.start_date || !formData.end_date) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn đầy đủ các ngày tháng',
        variant: 'destructive',
      });
      return;
    }

    // Validate date logic
    const regStart = new Date(formData.registration_start);
    const regEnd = new Date(formData.registration_end);
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);

    if (regEnd <= regStart) {
      toast({
        title: 'Lỗi',
        description: 'Ngày kết thúc đăng ký phải sau ngày bắt đầu đăng ký',
        variant: 'destructive',
      });
      return;
    }

    if (startDate <= regEnd) {
      toast({
        title: 'Lỗi',
        description: 'Ngày bắt đầu giải phải sau ngày kết thúc đăng ký',
        variant: 'destructive',
      });
      return;
    }

    if (endDate <= startDate) {
      toast({
        title: 'Lỗi',
        description: 'Ngày kết thúc giải phải sau ngày bắt đầu giải',
        variant: 'destructive',
      });
      return;
    }

    if (formData.max_teams <= formData.min_teams) {
      toast({
        title: 'Lỗi',
        description: 'Số đội tối đa phải lớn hơn số đội tối thiểu',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      toast({
        title: 'Thành công',
        description: tournament ? 'Cập nhật giải đấu thành công' : 'Tạo giải đấu thành công',
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'round_robin':
        return 'Tất cả đội đấu với nhau, tính điểm xếp hạng';
      case 'knockout':
        return 'Loại trực tiếp, thua là bị loại';
      case 'group_knockout':
        return 'Chia bảng đấu vòng tròn, sau đó loại trực tiếp (kiểu World Cup)';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tournament ? 'Cập nhật giải đấu' : 'Tạo giải đấu mới'}</DialogTitle>
          <DialogDescription>
            Điền thông tin giải đấu. Các trường có dấu * là bắt buộc.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Thông tin cơ bản */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Thông tin cơ bản</h3>
              
              <div className="space-y-2">
                <Label htmlFor="name">
                  Tên giải đấu <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="VD: Giải Vô Địch Mùa Xuân 2026"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  placeholder="Mô tả về giải đấu..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            {/* Thể thức */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Thể thức</h3>
              
              <div className="space-y-2">
                <Label htmlFor="format">
                  Loại giải <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.format}
                  onValueChange={(value: any) => setFormData({ ...formData, format: value })}
                >
                  <SelectTrigger id="format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="round_robin">Vòng tròn (Round Robin)</SelectItem>
                    <SelectItem value="knockout">Loại trực tiếp (Knockout)</SelectItem>
                    <SelectItem value="group_knockout">Bảng + Loại trực tiếp</SelectItem>
                  </SelectContent>
                </Select>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {getFormatDescription(formData.format)}
                  </AlertDescription>
                </Alert>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_teams">
                    Số đội tối thiểu <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="min_teams"
                    type="number"
                    min="2"
                    value={formData.min_teams}
                    onChange={(e) => setFormData({ ...formData, min_teams: parseInt(e.target.value) })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_teams">
                    Số đội tối đa <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="max_teams"
                    type="number"
                    min="2"
                    value={formData.max_teams}
                    onChange={(e) => setFormData({ ...formData, max_teams: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Thời gian */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Thời gian</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bắt đầu đăng ký</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !regStartDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {regStartDate ? format(regStartDate, 'dd/MM/yyyy', { locale: vi }) : 'Chọn ngày'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={regStartDate}
                        onSelect={(date) => handleDateChange('regStart', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Kết thúc đăng ký</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !regEndDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {regEndDate ? format(regEndDate, 'dd/MM/yyyy', { locale: vi }) : 'Chọn ngày'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={regEndDate}
                        onSelect={(date) => handleDateChange('regEnd', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ngày bắt đầu giải</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !startDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, 'dd/MM/yyyy', { locale: vi }) : 'Chọn ngày'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => handleDateChange('start', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Ngày kết thúc giải</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !endDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, 'dd/MM/yyyy', { locale: vi }) : 'Chọn ngày'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => handleDateChange('end', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Địa điểm */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Địa điểm</h3>
              
              <div className="space-y-2">
                <Label htmlFor="field_cluster_id">
                  Cụm sân <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.field_cluster_id?.toString()}
                  onValueChange={(value) => setFormData({ ...formData, field_cluster_id: parseInt(value) })}
                >
                  <SelectTrigger id="field_cluster_id">
                    <SelectValue placeholder="Chọn cụm sân" />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldClusters.map((cluster) => (
                      <SelectItem key={cluster.id} value={cluster.id.toString()}>
                        {cluster.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
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
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tournament ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
