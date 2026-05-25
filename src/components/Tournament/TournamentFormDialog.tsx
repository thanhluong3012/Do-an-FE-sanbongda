import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tournament, TournamentRequest, tournamentService } from '@/services/tournamentService';
import { fieldComplexService } from '@/services/fieldComplexService';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CalendarIcon, Info, CheckCircle2, Circle, FileText, Upload, X } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface TournamentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TournamentRequest) => Promise<Tournament | void>;
  tournament?: Tournament | null;
  fieldClusters?: Array<{ id: number; name: string }>;
}

interface FieldAvailability {
  field_id: number;
  field_name: string;
  field_type: string;
  availability: {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
  };
}

interface SelectedBooking {
  field_id: number;
  field_name: string;
  time_slot: 'morning' | 'afternoon' | 'evening';
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
    field_type: '5v5',
    payment_method: 'cash',
    bookings: [],
  });

  // Date states
  const [regStartDate, setRegStartDate] = useState<Date>();
  const [regEndDate, setRegEndDate] = useState<Date>();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [bookingDate, setBookingDate] = useState<Date>();

  // Booking flow states
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [fieldAvailability, setFieldAvailability] = useState<FieldAvailability[]>([]);
  const [selectedBookings, setSelectedBookings] = useState<SelectedBooking[]>([]);

  // Rules file state
  const [selectedRulesFile, setSelectedRulesFile] = useState<File | null>(null);
  const rulesFileInputRef = useRef<HTMLInputElement>(null);

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
        field_type: '5v5',
        bookings: [],
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
        field_type: '5v5',
        payment_method: 'cash',
        bookings: [],
      });
      setRegStartDate(undefined);
      setRegEndDate(undefined);
      setStartDate(undefined);
      setEndDate(undefined);
      setBookingDate(undefined);
      setFieldAvailability([]);
      setSelectedBookings([]);
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

  // Check availability khi user chọn đủ: cluster + field_type + booking_date
  const handleCheckAvailability = async () => {
    if (!formData.field_cluster_id || !formData.field_type || !bookingDate) {
      toast({
        title: 'Thiếu thông tin',
        description: 'Vui lòng chọn cụm sân, loại sân và ngày đặt trước',
        variant: 'destructive',
      });
      return;
    }

    setIsLoadingAvailability(true);
    try {
      const dateStr = format(bookingDate, 'yyyy-MM-dd');
      const data = await fieldComplexService.checkAvailability(
        formData.field_cluster_id,
        dateStr,
        formData.field_type
      );
      
      setFieldAvailability(data);
      toast({
        title: 'Thành công',
        description: `Tìm thấy ${data.length} sân có thể đặt`,
      });
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể kiểm tra sân trống',
        variant: 'destructive',
      });
      setFieldAvailability([]);
    } finally {
      setIsLoadingAvailability(false);
    }
  };

  // Toggle booking selection
  const toggleBooking = (fieldId: number, fieldName: string, timeSlot: 'morning' | 'afternoon' | 'evening') => {
    const exists = selectedBookings.find(
      b => b.field_id === fieldId && b.time_slot === timeSlot
    );

    if (exists) {
      // Remove
      setSelectedBookings(selectedBookings.filter(
        b => !(b.field_id === fieldId && b.time_slot === timeSlot)
      ));
    } else {
      // Add
      setSelectedBookings([...selectedBookings, { field_id: fieldId, field_name: fieldName, time_slot: timeSlot }]);
    }
  };

  const isBookingSelected = (fieldId: number, timeSlot: string) => {
    return selectedBookings.some(b => b.field_id === fieldId && b.time_slot === timeSlot);
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
    const startDateVal = new Date(formData.start_date);
    const endDateVal = new Date(formData.end_date);

    if (regEnd <= regStart) {
      toast({
        title: 'Lỗi',
        description: 'Ngày kết thúc đăng ký phải sau ngày bắt đầu đăng ký',
        variant: 'destructive',
      });
      return;
    }

    if (startDateVal <= regEnd) {
      toast({
        title: 'Lỗi',
        description: 'Ngày bắt đầu giải phải sau ngày kết thúc đăng ký',
        variant: 'destructive',
      });
      return;
    }

    if (endDateVal <= startDateVal) {
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

    // Validate bookings
    if (selectedBookings.length === 0) {
      toast({
        title: 'Cảnh báo',
        description: 'Bạn chưa chọn sân để đặt. Có chắc muốn tạo giải không có đặt sân?',
        variant: 'destructive',
      });
      return;
    }

    if (!bookingDate) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn ngày đặt sân',
        variant: 'destructive',
      });
      return;
    }

    // Build bookings array
    const bookingsData = selectedBookings.map(b => ({
      field_id: b.field_id,
      date: format(bookingDate, 'yyyy-MM-dd'),
      session_type: b.time_slot as 'morning' | 'afternoon' | 'evening',
    }));

    setIsSubmitting(true);
    try {
      const result = await onSubmit({
        ...formData,
        bookings: bookingsData,
      });

      // Upload rules file if provided and tournament was created (not updated)
      if (selectedRulesFile && result && result.id) {
        try {
          await tournamentService.uploadRulesFile(result.id, selectedRulesFile);
          toast({
            title: 'Thành công',
            description: `Tạo giải đấu và upload file thể lệ thành công với ${bookingsData.length} đặt sân`,
          });
        } catch (uploadError: any) {
          toast({
            title: 'Cảnh báo',
            description: 'Giải đấu đã tạo nhưng không thể upload file thể lệ. Bạn có thể upload lại trong trang chi tiết giải.',
            variant: 'default',
          });
        }
      } else {
        toast({
          title: 'Thành công',
          description: tournament ? 'Cập nhật giải đấu thành công' : `Tạo giải đấu thành công với ${bookingsData.length} đặt sân`,
        });
      }

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

  const getTimeSlotLabel = (slot: string) => {
    switch (slot) {
      case 'morning':
        return '🌅 Sáng (6h-12h)';
      case 'afternoon':
        return '☀️ Chiều (12h-18h)';
      case 'evening':
        return '🌙 Tối (18h-22h)';
      default:
        return slot;
    }
  };

  // Rules file handlers
  const handleRulesFileSelect = () => {
    rulesFileInputRef.current?.click();
  };

  const handleRulesFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      toast({
        title: 'Lỗi',
        description: 'Chỉ hỗ trợ file PDF, DOC, DOCX',
        variant: 'destructive',
      });
      e.target.value = '';
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'Lỗi',
        description: 'File không được vượt quá 10MB',
        variant: 'destructive',
      });
      e.target.value = '';
      return;
    }

    setSelectedRulesFile(file);
    toast({
      title: 'File đã chọn',
      description: `${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
    });
  };

  const handleRemoveRulesFile = () => {
    setSelectedRulesFile(null);
    if (rulesFileInputRef.current) {
      rulesFileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tournament ? 'Cập nhật giải đấu' : 'Tạo giải đấu mới'}</DialogTitle>
          <DialogDescription>
            Điền thông tin giải đấu và chọn sân cần đặt. Các trường có dấu * là bắt buộc.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Thông tin cơ bản */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold border-b pb-2">📋 Thông tin cơ bản</h3>
              
              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="format">
                    Thể thức <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.format}
                    onValueChange={(value: any) => setFormData({ ...formData, format: value })}
                  >
                    <SelectTrigger id="format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="round_robin">Vòng tròn</SelectItem>
                      <SelectItem value="knockout">Loại trực tiếp</SelectItem>
                      <SelectItem value="group_knockout">Bảng + Loại trực tiếp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  placeholder="Mô tả về giải đấu..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              {/* Rules File Upload */}
              <div className="space-y-2 border-2 border-amber-300 bg-amber-50 p-4 rounded-lg">
                <Label className="text-lg font-bold text-amber-900">📄 File thể lệ giải đấu (tùy chọn)</Label>
                <div className="space-y-3">
                  <input
                    ref={rulesFileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleRulesFileChange}
                    className="hidden"
                  />
                  
                  {!selectedRulesFile ? (
                    <div className="border-2 border-dashed rounded-lg p-6 text-center space-y-3">
                      <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
                      <div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleRulesFileSelect}
                          className="gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          Chọn file thể lệ
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Hỗ trợ PDF, DOC, DOCX • Tối đa 10MB
                      </p>
                      <Alert className="bg-blue-50 border-blue-200 text-left">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-xs text-blue-700">
                          File sẽ được tự động upload sau khi tạo giải thành công
                        </AlertDescription>
                      </Alert>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{selectedRulesFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(selectedRulesFile.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveRulesFile}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_teams">Số đội tối thiểu</Label>
                  <Input
                    id="min_teams"
                    type="number"
                    min="2"
                    value={formData.min_teams}
                    onChange={(e) => setFormData({ ...formData, min_teams: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_teams">Số đội tối đa</Label>
                  <Input
                    id="max_teams"
                    type="number"
                    min="2"
                    value={formData.max_teams}
                    onChange={(e) => setFormData({ ...formData, max_teams: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            {/* Thời gian */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold border-b pb-2">📅 Thời gian</h3>
              
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

            {/* Đặt sân */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold border-b pb-2">⚽ Đặt sân cho giải đấu</h3>
              
              {/* Phương thức thanh toán */}
              <div className="space-y-2">
                <Label htmlFor="payment_method">
                  Phương thức thanh toán <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value: 'cash' | 'vietqr') => 
                    setFormData({ ...formData, payment_method: value })
                  }
                >
                  <SelectTrigger id="payment_method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">💵 Tiền mặt tại sân</SelectItem>
                    <SelectItem value="vietqr">🏦 Chuyển khoản</SelectItem>
                  </SelectContent>
                </Select>
                {formData.payment_method === 'cash' && (
                  <Alert className="mt-2 bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-xs text-blue-700">
                      Bạn sẽ nhận thông tin liên hệ chủ sân để hẹn lịch và thanh toán trực tiếp tại cụm sân.
                    </AlertDescription>
                  </Alert>
                )}
                {formData.payment_method === 'vietqr' && (
                  <Alert className="mt-2 bg-amber-50 border-amber-200">
                    <Info className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-xs text-amber-700">
                      Sau khi tạo giải, bạn cần chuyển khoản và upload bill để chủ sân xác nhận.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="field_cluster_id">
                    Cụm sân <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.field_cluster_id?.toString()}
                    onValueChange={(value) => {
                      setFormData({ ...formData, field_cluster_id: parseInt(value) });
                      setFieldAvailability([]); // Reset availability khi đổi cluster
                      setSelectedBookings([]);
                    }}
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

                <div className="space-y-2">
                  <Label htmlFor="field_type">
                    Loại sân <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.field_type}
                    onValueChange={(value) => {
                      setFormData({ ...formData, field_type: value });
                      setFieldAvailability([]); // Reset availability khi đổi loại sân
                      setSelectedBookings([]);
                    }}
                  >
                    <SelectTrigger id="field_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5v5">Sân 5 người</SelectItem>
                      <SelectItem value="7v7">Sân 7 người</SelectItem>
                      <SelectItem value="11v11">Sân 11 người</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Ngày đặt sân</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !bookingDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {bookingDate ? format(bookingDate, 'dd/MM/yyyy', { locale: vi }) : 'Chọn ngày'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={bookingDate}
                        onSelect={(date) => {
                          setBookingDate(date);
                          setFieldAvailability([]); // Reset availability khi đổi ngày
                          setSelectedBookings([]);
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleCheckAvailability}
                disabled={!formData.field_cluster_id || !formData.field_type || !bookingDate || isLoadingAvailability}
                className="w-full"
              >
                {isLoadingAvailability && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                🔍 Kiểm tra sân trống
              </Button>

              {/* Availability Grid */}
              {fieldAvailability.length > 0 && (
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Chọn sân và buổi</h4>
                    <Badge variant="secondary">{selectedBookings.length} đã chọn</Badge>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      ✅ = Sân trống có thể đặt | 🔒 = Đã có người đặt (không thể chọn)
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    {fieldAvailability.map((field) => (
                      <div key={field.field_id} className="border rounded p-3 space-y-2">
                        <div className="font-medium text-sm">{field.field_name}</div>
                        <div className="grid grid-cols-3 gap-2">
                          {(['morning', 'afternoon', 'evening'] as const).map((slot) => {
                            const available = field.availability[slot];
                            const selected = isBookingSelected(field.field_id, slot);
                            
                            return (
                              <Button
                                key={slot}
                                type="button"
                                variant={selected ? 'default' : 'outline'}
                                size="sm"
                                disabled={!available}
                                onClick={() => toggleBooking(field.field_id, field.field_name, slot)}
                                className={cn(
                                  'text-xs h-auto py-2',
                                  !available && 'opacity-50 cursor-not-allowed'
                                )}
                              >
                                {available ? (
                                  selected ? (
                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                  ) : (
                                    <Circle className="mr-1 h-3 w-3" />
                                  )
                                ) : (
                                  <span className="mr-1">🔒</span>
                                )}
                                {getTimeSlotLabel(slot)}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Bookings Summary */}
              {selectedBookings.length > 0 && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <div className="font-semibold text-green-800 mb-2">
                      Đã chọn {selectedBookings.length} lịch đặt sân:
                    </div>
                    <div className="space-y-1 text-xs text-green-700">
                      {selectedBookings.map((b, idx) => (
                        <div key={idx}>
                          • {b.field_name} - {getTimeSlotLabel(b.time_slot)}
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
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
              {tournament ? 'Cập nhật' : 'Tạo giải đấu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
