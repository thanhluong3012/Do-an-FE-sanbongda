import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { fieldComplexService, SubField } from '@/services/fieldComplexService';
import { tournamentService, TournamentRequest } from '@/services/tournamentService';
import { tournamentSessionPriceService, TournamentSessionPrice } from '@/services/tournamentSessionPriceService';
import { getOwner } from '@/services/ownerService';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CalendarIcon, CheckCircle2, MapPin, Clock, Info, ArrowLeft, ArrowRight, DollarSign, CreditCard, Wallet, Upload as UploadIcon, FileText, X } from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface FieldCluster {
  id: number;
  name: string;
  address: string;
  open_time: string;
  close_time: string;
}

interface TimeSlot {
  id: string;
  label: string;
  start_time: string;
  end_time: string;
  display: string;
}

interface SelectedBooking {
  field_id: number;
  field_name: string;
  time_slot_id: string;
  time_slot_label: string;
  booking_date: string;
}

interface FieldAvailability {
  field_id: number;
  field_name: string;
  field_type: string;
  availability: {
    [key: string]: { // date: YYYY-MM-DD
      morning: boolean;
      afternoon: boolean;
      evening: boolean;
      full_day: boolean;
    };
  };
}

const TIME_SLOTS: TimeSlot[] = [
  { id: 'morning', label: 'Buổi sáng', start_time: '06:00', end_time: '12:00', display: '🌅 Sáng (6:00 - 12:00)' },
  { id: 'afternoon', label: 'Buổi chiều', start_time: '12:00', end_time: '18:00', display: '☀️ Chiều (12:00 - 18:00)' },
  { id: 'evening', label: 'Buổi tối', start_time: '18:00', end_time: '22:00', display: '🌙 Tối (18:00 - 22:00)' },
  { id: 'full_day', label: 'Cả ngày', start_time: '06:00', end_time: '22:00', display: '🌞 Cả ngày (6:00 - 22:00)' },
];

export default function CreateTournament() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5; // Tăng lên 5 steps (thêm payment step)

  // Form data
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
    bookings: [],
  });

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [totalPrice, setTotalPrice] = useState(0);
  const [sessionPrices, setSessionPrices] = useState<TournamentSessionPrice[]>([]);
  const [ownerQRCode, setOwnerQRCode] = useState<string | null>(null);
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null);
  const [createdTournamentId, setCreatedTournamentId] = useState<number | null>(null);

  // Rules file states
  const [rulesFile, setRulesFile] = useState<File | null>(null);
  const rulesFileInputRef = useRef<HTMLInputElement>(null);

  // Date states
  const [regStartDate, setRegStartDate] = useState<Date>();
  const [regEndDate, setRegEndDate] = useState<Date>();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [bookingDates, setBookingDates] = useState<Date[]>([]);

  // Data states
  const [fieldClusters, setFieldClusters] = useState<FieldCluster[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<FieldCluster | null>(null);
  const [subFields, setSubFields] = useState<SubField[]>([]);
  const [selectedBookings, setSelectedBookings] = useState<SelectedBooking[]>([]);
  const [fieldAvailability, setFieldAvailability] = useState<FieldAvailability[]>([]);
  const [isLoadingClusters, setIsLoadingClusters] = useState(false);
  const [isLoadingFields, setIsLoadingFields] = useState(false);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load field clusters on mount
  useEffect(() => {
    loadFieldClusters();
  }, []);

  // Load session prices when cluster is selected
  useEffect(() => {
    if (formData.field_cluster_id) {
      loadSessionPrices(formData.field_cluster_id);
      loadOwnerQRCode(formData.field_cluster_id);
    }
  }, [formData.field_cluster_id]);

  // Calculate total price when bookings change
  useEffect(() => {
    calculateTotalPrice();
  }, [selectedBookings, sessionPrices]);

  // Helper function to format VND currency
  const formatVND = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' ₫';
  };

  const loadSessionPrices = async (clusterId: number) => {
    try {
      const prices = await tournamentSessionPriceService.getByClusterId(clusterId);
      setSessionPrices(prices);
    } catch (error) {
      console.error('Error loading session prices:', error);
      setSessionPrices([]);
    }
  };

  const loadOwnerQRCode = async (clusterId: number) => {
    try {
      // Load field cluster detail để lấy owner info
      const cluster = await fieldComplexService.getById(clusterId);
      console.log('🔍 Field Cluster Data:', cluster);
      console.log('🔍 Owner Data:', cluster?.owner);
      console.log('🔍 Owner ID:', cluster?.owner_id);
      
      // Check nếu cluster có owner relationship
      if (cluster?.owner) {
        // Trường hợp 1: Backend đã include owner (RECOMMENDED)
        const qrCode = cluster.owner.qr_code_image 
                    || cluster.owner.qr_code_url 
                    || cluster.owner.qr_image;
        
        if (qrCode) {
          console.log('✅ QR Code found from owner relationship:', qrCode);
          setOwnerQRCode(qrCode);
        } else {
          console.log('❌ Owner chưa upload QR code');
          setOwnerQRCode(null);
        }
      } else if (cluster?.owner_id) {
        // Trường hợp 2: Backend chưa include owner, workaround bằng gọi API riêng
        console.log('⚠️ Backend không trả owner relationship, đang gọi API riêng...');
        try {
          const ownerResponse = await getOwner(cluster.owner_id);
          console.log('🔍 Owner fetched separately:', ownerResponse);
          const owner = ownerResponse?.data || ownerResponse;
          
          const qrCode = owner?.qr_code_image 
                      || owner?.qr_code_url 
                      || owner?.qr_image;
          
          if (qrCode) {
            console.log('✅ QR Code found from separate API:', qrCode);
            setOwnerQRCode(qrCode);
          } else {
            console.log('❌ Owner chưa upload QR code');
            setOwnerQRCode(null);
          }
        } catch (ownerError) {
          console.error('Error fetching owner separately:', ownerError);
          setOwnerQRCode(null);
        }
      } else {
        console.log('❌ Không có owner_id trong cluster data');
        setOwnerQRCode(null);
      }
    } catch (error) {
      console.error('Error loading owner QR code:', error);
      setOwnerQRCode(null);
    }
  };

  const calculateTotalPrice = () => {
    if (selectedBookings.length === 0 || sessionPrices.length === 0) {
      setTotalPrice(0);
      return;
    }

    let total = 0;
    selectedBookings.forEach(booking => {
      // Find price for this booking
      const date = new Date(booking.booking_date);
      const dayOfWeek = date.getDay(); // 0=Sunday, 6=Saturday
      const dayType = (dayOfWeek === 0 || dayOfWeek === 6) ? 'weekend' : 'weekday';
      
      const price = sessionPrices.find(p =>
        p.field_type === formData.field_type &&
        p.day_type === dayType &&
        p.session_type === booking.time_slot_id
      );

      if (price) {
        total += price.price_per_session;
      }
    });

    setTotalPrice(total);
  };

  const loadFieldClusters = async () => {
    setIsLoadingClusters(true);
    try {
      const data = await fieldComplexService.getAll();
      setFieldClusters(data);
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể tải danh sách cụm sân',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingClusters(false);
    }
  };

  // Load sub-fields when cluster is selected
  const handleClusterSelect = async (clusterId: number) => {
    const cluster = fieldClusters.find(c => c.id === clusterId);
    if (!cluster) return;

    setSelectedCluster(cluster);
    setFormData({ ...formData, field_cluster_id: clusterId });
    setSelectedBookings([]); // Reset bookings when changing cluster

    setIsLoadingFields(true);
    try {
      const fields = await fieldComplexService.getFieldsByClusterId(clusterId);
      // Filter by selected field type
      const filteredFields = fields.filter((f: SubField) => f.field_type === formData.field_type);
      setSubFields(filteredFields);
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể tải danh sách sân',
        variant: 'destructive',
      });
      setSubFields([]);
    } finally {
      setIsLoadingFields(false);
    }
  };

  // Handle field type change
  const handleFieldTypeChange = async (fieldType: string) => {
    setFormData({ ...formData, field_type: fieldType });
    setSelectedBookings([]);
    
    if (selectedCluster) {
      setIsLoadingFields(true);
      try {
        const fields = await fieldComplexService.getFieldsByClusterId(selectedCluster.id);
        const filteredFields = fields.filter((f: SubField) => f.field_type === fieldType);
        setSubFields(filteredFields);
      } catch (error: any) {
        toast({
          title: 'Lỗi',
          description: 'Không thể tải danh sách sân',
          variant: 'destructive',
        });
        setSubFields([]);
      } finally {
        setIsLoadingFields(false);
      }
    }
  };

  // Check availability for selected dates
  const checkAvailability = async (dates: Date[]) => {
    if (!selectedCluster || dates.length === 0) return;

    setIsLoadingAvailability(true);
    try {
      const availabilityPromises = dates.map(date => 
        fieldComplexService.checkAvailability(
          selectedCluster.id,
          format(date, 'yyyy-MM-dd'),
          formData.field_type || '5v5'
        )
      );

      const results = await Promise.all(availabilityPromises);
      
      // Merge results by field_id
      const mergedAvailability: FieldAvailability[] = [];
      
      subFields.forEach(field => {
        const fieldData: FieldAvailability = {
          field_id: field.id,
          field_name: field.name || `Sân ${field.field_type} #${field.id}`,
          field_type: field.field_type,
          availability: {}
        };

        dates.forEach((date, idx) => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const dateResult = results[idx];
          const fieldResult = dateResult.find((f: any) => f.field_id === field.id);
          
          if (fieldResult) {
            fieldData.availability[dateStr] = {
              morning: fieldResult.availability?.morning ?? true,
              afternoon: fieldResult.availability?.afternoon ?? true,
              evening: fieldResult.availability?.evening ?? true,
              full_day: fieldResult.availability?.full_day ?? true,
            };
          } else {
            // Default to all available if no data
            fieldData.availability[dateStr] = {
              morning: true,
              afternoon: true,
              evening: true,
              full_day: true,
            };
          }
        });

        mergedAvailability.push(fieldData);
      });

      setFieldAvailability(mergedAvailability);
    } catch (error: any) {
      console.warn('⚠️ Availability check failed - backend API not implemented yet:', error.response?.status);
      
      // If API not found (404), set all slots as available (no restrictions)
      if (error.response?.status === 404) {
        // Create default availability (all slots available) for all fields
        const defaultAvailability: FieldAvailability[] = subFields.map(field => {
          const fieldData: FieldAvailability = {
            field_id: field.id,
            field_name: field.name || `Sân ${field.field_type} #${field.id}`,
            field_type: field.field_type,
            availability: {}
          };

          dates.forEach(date => {
            const dateStr = format(date, 'yyyy-MM-dd');
            fieldData.availability[dateStr] = {
              morning: true,
              afternoon: true,
              evening: true,
              full_day: true,
            };
          });

          return fieldData;
        });

        setFieldAvailability(defaultAvailability);
        
        // Silent fail - just log to console, don't show toast
        // User can book freely, backend will validate on submit
      } else {
        // Other errors - show error toast
        toast({
          title: 'Lỗi',
          description: error.response?.data?.message || 'Không thể kiểm tra lịch đặt sân',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoadingAvailability(false);
    }
  };

  // Check availability when dates change
  useEffect(() => {
    if (bookingDates.length > 0 && subFields.length > 0) {
      checkAvailability(bookingDates);
    } else {
      setFieldAvailability([]);
    }
  }, [bookingDates, subFields]);

  // Check if a time slot is available
  const isTimeSlotAvailable = (fieldId: number, timeSlotId: string, date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const fieldData = fieldAvailability.find(f => f.field_id === fieldId);
    
    if (!fieldData || !fieldData.availability[dateStr]) {
      return false; // If no data, assume not available during loading
    }

    const dateAvailability = fieldData.availability[dateStr];
    return dateAvailability[timeSlotId as keyof typeof dateAvailability] ?? false;
  };

  // Toggle booking selection
  // Toggle booking selection
  const toggleBooking = (field: SubField, timeSlot: TimeSlot, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Check if available
    if (!isTimeSlotAvailable(field.id, timeSlot.id, date)) {
      toast({
        title: 'Không thể đặt',
        description: `${timeSlot.label} ngày ${format(date, 'dd/MM/yyyy', { locale: vi })} đã có người đặt rồi`,
        variant: 'destructive',
      });
      return;
    }
    
    const exists = selectedBookings.find(
      b => b.field_id === field.id && b.time_slot_id === timeSlot.id && b.booking_date === dateStr
    );

    if (exists) {
      // Remove booking
      setSelectedBookings(selectedBookings.filter(
        b => !(b.field_id === field.id && b.time_slot_id === timeSlot.id && b.booking_date === dateStr)
      ));
    } else {
      // Add booking
      setSelectedBookings([
        ...selectedBookings,
        {
          field_id: field.id,
          field_name: field.name || `Sân ${field.field_type} #${field.id}`,
          time_slot_id: timeSlot.id,
          time_slot_label: timeSlot.display,
          booking_date: dateStr,
        }
      ]);
    }
  };

  const isBookingSelected = (fieldId: number, timeSlotId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return selectedBookings.some(
      b => b.field_id === fieldId && b.time_slot_id === timeSlotId && b.booking_date === dateStr
    );
  };

  const handleDateChange = (type: 'regStart' | 'regEnd' | 'start' | 'end', date: Date | undefined) => {
    if (!date) return;

    const dateString = format(date, 'yyyy-MM-dd');
    const dateTimeString = format(date, 'yyyy-MM-dd') + ' 00:00:00';

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

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.name || !formData.format) {
          toast({
            title: 'Thiếu thông tin',
            description: 'Vui lòng điền tên giải và chọn thể thức',
            variant: 'destructive',
          });
          return false;
        }
        if (!regStartDate || !regEndDate || !startDate || !endDate) {
          toast({
            title: 'Thiếu thông tin',
            description: 'Vui lòng chọn đầy đủ các ngày tháng',
            variant: 'destructive',
          });
          return false;
        }
        
        // Validate dates logic
        if (regEndDate <= regStartDate) {
          toast({
            title: 'Lỗi ngày tháng',
            description: 'Ngày kết thúc đăng ký phải sau ngày bắt đầu đăng ký',
            variant: 'destructive',
          });
          return false;
        }
        
        if (endDate <= startDate) {
          toast({
            title: 'Lỗi ngày tháng',
            description: 'Ngày kết thúc giải đấu phải sau ngày bắt đầu giải đấu',
            variant: 'destructive',
          });
          return false;
        }
        
        if (startDate < regEndDate) {
          toast({
            title: 'Lỗi ngày tháng',
            description: 'Ngày bắt đầu giải đấu phải sau ngày kết thúc đăng ký',
            variant: 'destructive',
          });
          return false;
        }
        
        return true;
      
      case 2:
        if (!formData.field_cluster_id || !formData.field_type) {
          toast({
            title: 'Thiếu thông tin',
            description: 'Vui lòng chọn cụm sân và loại sân',
            variant: 'destructive',
          });
          return false;
        }
        return true;
      
      case 3:
        if (bookingDates.length === 0) {
          toast({
            title: 'Thiếu thông tin',
            description: 'Vui lòng chọn ít nhất 1 ngày để đặt sân',
            variant: 'destructive',
          });
          return false;
        }
        if (selectedBookings.length === 0) {
          toast({
            title: 'Thiếu thông tin',
            description: 'Vui lòng chọn ít nhất 1 sân và buổi',
            variant: 'destructive',
          });
          return false;
        }
        return true;
      
      case 4:
        // Step 4 is just confirmation, always valid
        return true;
      
      case 5:
        // Validate payment method
        if (paymentMethod === 'transfer' && !paymentProofUrl) {
          toast({
            title: 'Thiếu thông tin',
            description: 'Vui lòng upload bill chuyển khoản',
            variant: 'destructive',
          });
          return false;
        }
        return true;
      
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(currentStep + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 1));
  };

  const handleSubmit = async () => {
    // Validate all steps before submitting
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) return;

    // Validate payment
    if (paymentMethod === 'transfer' && !paymentProofUrl) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng upload bill chuyển khoản',
        variant: 'destructive',
      });
      return;
    }

    // Build bookings data - Backend expects 'date' and 'session_type' (not 'time_slot')
    const bookingsData = selectedBookings.map(b => ({
      field_id: b.field_id,
      date: b.booking_date,
      session_type: b.time_slot_id as 'morning' | 'afternoon' | 'evening' | 'full_day',
    }));

    // Build payload
    const payload = {
      ...formData,
      bookings: bookingsData,
      payment_method: paymentMethod,
      payment_proof_url: paymentMethod === 'transfer' ? paymentProofUrl : undefined,
    };

    console.log('📤 Payload gửi lên backend:', JSON.stringify(payload, null, 2));

    setIsSubmitting(true);
    try {
      const createdTournament = await tournamentService.create(payload);
      console.log('✅ Tournament created successfully:', createdTournament);
      const tournamentId = createdTournament?.id;
      console.log('Tournament ID:', tournamentId);
      
      if (!tournamentId) {
        console.error('❌ Response không có tournament ID:', createdTournament);
        toast({
          title: 'Cảnh báo',
          description: 'Giải đấu có thể đã được tạo nhưng không nhận được ID từ server. Vui lòng kiểm tra trang "Giải đấu của tôi".',
          variant: 'destructive',
        });
        navigate('/my-tournaments');
        return;
      }
      
      // Success message based on payment method
      if (paymentMethod === 'transfer') {
        toast({
          title: '🎉 Tạo giải đấu thành công!',
          description: `Giải đấu "${payload.name}" đã được tạo và bill chuyển khoản đã được gửi. Đang chờ chủ sân xác nhận thanh toán. Bạn sẽ nhận được thông báo khi thanh toán được xác nhận.`,
        });
      } else {
        // Thanh toán tiền mặt
        toast({
          title: '🎉 Tạo giải đấu thành công!',
          description: `Giải đấu "${payload.name}" đã được tạo. Vui lòng liên hệ chủ sân để thanh toán tiền mặt. Sau khi chủ sân xác nhận thanh toán, bạn có thể mở đăng ký giải.`,
        });
      }

      // Upload rules file if provided
      if (rulesFile && tournamentId) {
        try {
          await tournamentService.uploadRulesFile(tournamentId, rulesFile);
          console.log('✅ Rules file uploaded successfully');
        } catch (uploadError) {
          console.error('Error uploading rules file:', uploadError);
          toast({
            title: 'Cảnh báo',
            description: 'Không thể upload file thể lệ. Bạn có thể upload lại trong trang chi tiết giải.',
            variant: 'default',
          });
        }
      }
      
      // Navigate đến tournament detail thay vì my-tournaments
      navigate(`/tournament/${tournamentId}`);
    } catch (error: any) {
      // Log chi tiết lỗi để debug
      console.error('❌ LỖI TẠO GIẢI ĐẤU:');
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
      console.error('Message:', error.response?.data?.message);
      console.error('Errors:', error.response?.data?.errors);
      console.error('Full Error:', error);
      
      // Hiển thị lỗi chi tiết
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi tạo giải đấu';
      const errorDetails = error.response?.data?.errors 
        ? Object.entries(error.response.data.errors)
            .map(([field, messages]: [string, any]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n')
        : '';
      
      toast({
        title: 'Lỗi',
        description: errorDetails ? `${errorMessage}\n${errorDetails}` : errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
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

    setRulesFile(file);
    toast({
      title: 'File đã chọn',
      description: `${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
    });
  };

  const handleRemoveRulesFile = () => {
    setRulesFile(null);
    if (rulesFileInputRef.current) {
      rulesFileInputRef.current.value = '';
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-4 mb-8">
      {[1, 2, 3, 4, 5].map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors',
              currentStep >= step
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {currentStep > step ? <CheckCircle2 className="w-5 h-5" /> : step}
          </div>
          {step < 5 && (
            <div
              className={cn(
                'w-16 h-1 mx-2 transition-colors',
                currentStep > step ? 'bg-primary' : 'bg-muted'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Bước 1: Thông tin giải đấu</CardTitle>
        <CardDescription>Điền các thông tin cơ bản về giải đấu</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
            rows={3}
          />
        </div>

        {/* Rules File Upload */}
        <div className="space-y-2 border-2 border-dashed border-blue-300 bg-blue-50 p-4 rounded-lg">
          <Label className="text-base font-semibold text-blue-900 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            File thể lệ giải đấu (tùy chọn)
          </Label>
          <div className="space-y-3">
            <input
              ref={rulesFileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleRulesFileChange}
              className="hidden"
            />
            
            {!rulesFile ? (
              <div className="border-2 border-dashed border-blue-300 bg-white rounded-lg p-6 text-center space-y-3">
                <FileText className="mx-auto h-10 w-10 text-blue-400" />
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRulesFileSelect}
                    className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    <UploadIcon className="h-4 w-4" />
                    Chọn file thể lệ
                  </Button>
                </div>
                <p className="text-xs text-blue-600">
                  Hỗ trợ PDF, DOC, DOCX • Tối đa 10MB
                </p>
                <Alert className="bg-blue-100 border-blue-300 text-left">
                  <Info className="h-4 w-4 text-blue-700" />
                  <AlertDescription className="text-xs text-blue-800">
                    File thể lệ sẽ được tự động upload sau khi tạo giải thành công
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="border border-blue-300 rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate text-blue-900">{rulesFile.name}</p>
                      <p className="text-xs text-blue-600">
                        {(rulesFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveRulesFile}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Bước 2: Chọn cụm sân</CardTitle>
        <CardDescription>Chọn cụm sân và loại sân cho giải đấu</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>
              Loại sân <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.field_type}
              onValueChange={handleFieldTypeChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5v5">⚽ Sân 5 người</SelectItem>
                <SelectItem value="7v7">⚽ Sân 7 người</SelectItem>
                <SelectItem value="11v11">⚽ Sân 11 người</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Chọn cụm sân</Label>
          {isLoadingClusters ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {fieldClusters.map((cluster) => (
                <Card
                  key={cluster.id}
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-md',
                    selectedCluster?.id === cluster.id && 'border-primary bg-primary/5'
                  )}
                  onClick={() => handleClusterSelect(cluster.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{cluster.name}</h4>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <MapPin className="w-4 h-4 mr-1" />
                          {cluster.address}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Clock className="w-4 h-4 mr-1" />
                          {cluster.open_time} - {cluster.close_time}
                        </div>
                      </div>
                      {selectedCluster?.id === cluster.id && (
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bước 3: Chọn ngày và sân</CardTitle>
          <CardDescription>
            Chọn các ngày cần đặt sân và các sân cụ thể với buổi thi đấu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Chọn các ngày đặt sân</Label>
            <Calendar
              mode="multiple"
              selected={bookingDates}
              onSelect={(dates) => setBookingDates(dates || [])}
              disabled={(date) => date < new Date()}
              className="rounded-md border"
            />
            {bookingDates.length > 0 && (
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Đã chọn {bookingDates.length} ngày: {bookingDates.map(d => format(d, 'dd/MM', { locale: vi })).join(', ')}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {selectedCluster && bookingDates.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Các sân {formData.field_type} tại {selectedCluster.name}</h4>
                <Badge variant="secondary">{selectedBookings.length} lượt đã chọn</Badge>
              </div>

              {isLoadingFields || isLoadingAvailability ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <p className="text-sm text-muted-foreground">
                    {isLoadingFields ? 'Đang tải danh sách sân...' : 'Đang kiểm tra lịch đặt...'}
                  </p>
                </div>
              ) : subFields.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Không có sân {formData.field_type} tại cụm sân này
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-sm text-blue-800">
                      <div className="flex items-center gap-4">
                        <span>✅ = Sân trống, có thể đặt</span>
                        <span>🔒 = Đã có người đặt</span>
                      </div>
                    </AlertDescription>
                  </Alert>

                  {subFields.map((field) => (
                    <Card key={field.id}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          {field.name || `Sân ${field.field_type} #${field.id}`}
                          <Badge variant="outline" className="ml-2">{field.field_type}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {bookingDates.map((date, dateIdx) => (
                            <div key={dateIdx} className="border rounded-lg p-3">
                              <div className="font-medium text-sm mb-2">
                                📅 {format(date, 'EEEE, dd/MM/yyyy', { locale: vi })}
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {TIME_SLOTS.map((slot) => {
                                  const selected = isBookingSelected(field.id, slot.id, date);
                                  const available = isTimeSlotAvailable(field.id, slot.id, date);
                                  
                                  return (
                                    <Button
                                      key={slot.id}
                                      type="button"
                                      variant={selected ? 'default' : available ? 'outline' : 'secondary'}
                                      size="sm"
                                      disabled={!available && !selected}
                                      onClick={() => toggleBooking(field, slot, date)}
                                      className={cn(
                                        "justify-start text-xs h-auto py-2",
                                        !available && !selected && "opacity-60 cursor-not-allowed"
                                      )}
                                    >
                                      {!available && !selected ? (
                                        <span className="mr-2">🔒</span>
                                      ) : selected ? (
                                        <CheckCircle2 className="w-3 h-3 mr-2" />
                                      ) : (
                                        <div className="w-3 h-3 mr-2 rounded-full border-2" />
                                      )}
                                      <div className="text-left">
                                        <div className="font-medium">{slot.label}</div>
                                        <div className="text-[10px] opacity-80">
                                          {slot.start_time} - {slot.end_time}
                                        </div>
                                        {!available && !selected && (
                                          <div className="text-[10px] text-destructive font-medium">
                                            Đã có người đặt
                                          </div>
                                        )}
                                      </div>
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderStep4 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Bước 4: Xác nhận thông tin</CardTitle>
        <CardDescription>Kiểm tra lại thông tin trước khi tạo giải</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Thông tin giải đấu</h4>
            <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
              <div><span className="font-medium">Tên giải:</span> {formData.name}</div>
              <div><span className="font-medium">Thể thức:</span> {formData.format === 'round_robin' ? 'Vòng tròn' : formData.format === 'knockout' ? 'Loại trực tiếp' : 'Bảng + Loại trực tiếp'}</div>
              <div><span className="font-medium">Số đội:</span> {formData.min_teams} - {formData.max_teams}</div>
              <div><span className="font-medium">Đăng ký:</span> {regStartDate && format(regStartDate, 'dd/MM/yyyy', { locale: vi })} - {regEndDate && format(regEndDate, 'dd/MM/yyyy', { locale: vi })}</div>
              <div><span className="font-medium">Thi đấu:</span> {startDate && format(startDate, 'dd/MM/yyyy', { locale: vi })} - {endDate && format(endDate, 'dd/MM/yyyy', { locale: vi })}</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Địa điểm</h4>
            <div className="bg-muted rounded-lg p-4 text-sm">
              <div className="font-medium">{selectedCluster?.name}</div>
              <div className="text-muted-foreground">{selectedCluster?.address}</div>
              <div className="mt-2">Loại sân: <Badge>{formData.field_type}</Badge></div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Đặt sân ({selectedBookings.length} lượt)</h4>
            <div className="bg-muted rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto">
              {selectedBookings.map((booking, idx) => {
                // Calculate price for this booking
                const date = new Date(booking.booking_date);
                const dayOfWeek = date.getDay();
                const dayType = (dayOfWeek === 0 || dayOfWeek === 6) ? 'weekend' : 'weekday';
                const price = sessionPrices.find(p =>
                  p.field_type === formData.field_type &&
                  p.day_type === dayType &&
                  p.session_type === booking.time_slot_id
                );

                return (
                  <div key={idx} className="text-sm flex items-start justify-between">
                    <div className="flex items-start">
                      <CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 text-green-600" />
                      <div>
                        <span className="font-medium">{booking.field_name}</span>
                        <span className="text-muted-foreground"> - {format(new Date(booking.booking_date), 'dd/MM/yyyy', { locale: vi })} - {booking.time_slot_label}</span>
                      </div>
                    </div>
                    {price && (
                      <span className="font-semibold text-green-600 ml-4">
                        {formatVND(price.price_per_session)}
                      </span>
                    )}
                  </div>
                );
              })}
              
              {/* Total Price */}
              <div className="border-t pt-3 mt-3 flex justify-between items-center font-bold text-lg">
                <span>Tổng cộng:</span>
                <span className="text-primary">
                  {formatVND(totalPrice)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep5 = () => {

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-6 h-6" />
            Bước 5: Thanh toán
          </CardTitle>
          <CardDescription>
            Chọn phương thức thanh toán cho đặt sân
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Total Price Display */}
          <div className="bg-primary/10 border-2 border-primary/20 rounded-lg p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tổng chi phí đặt sân</p>
                <p className="text-3xl font-bold text-primary">
                  {formatVND(totalPrice)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedBookings.length} lượt đặt sân
                </p>
              </div>
              <Wallet className="w-16 h-16 text-primary/30" />
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Phương thức thanh toán</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cash Payment */}
              <div
                onClick={() => setPaymentMethod('cash')}
                className={cn(
                  "border-2 rounded-lg p-4 cursor-pointer transition-all",
                  paymentMethod === 'cash'
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-primary/50"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                      paymentMethod === 'cash' ? "border-primary" : "border-gray-300"
                    )}>
                      {paymentMethod === 'cash' && (
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet className="w-5 h-5 text-primary" />
                      <span className="font-semibold">Tiền mặt</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Thanh toán trực tiếp tại sân khi sử dụng
                    </p>
                  </div>
                </div>
              </div>

              {/* Transfer Payment */}
              <div
                onClick={() => setPaymentMethod('transfer')}
                className={cn(
                  "border-2 rounded-lg p-4 cursor-pointer transition-all",
                  paymentMethod === 'transfer'
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-primary/50"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                      paymentMethod === 'transfer' ? "border-primary" : "border-gray-300"
                    )}>
                      {paymentMethod === 'transfer' && (
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="w-5 h-5 text-primary" />
                      <span className="font-semibold">Chuyển khoản</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Chuyển khoản qua ngân hàng và upload bill
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transfer Payment Details */}
          {paymentMethod === 'transfer' && (
            <div className="space-y-4 animate-fade-in">
              <Alert className="bg-blue-50 border-blue-300">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                  <div className="space-y-2">
                    <p className="font-semibold">📋 Hướng dẫn thanh toán chuyển khoản:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm ml-2">
                      <li>Quét mã QR hoặc chuyển khoản với số tiền <span className="font-bold text-blue-700">{formatVND(totalPrice)}</span></li>
                      <li>Chụp lại bill/screenshot giao dịch thành công</li>
                      <li>Upload bill vào ô bên dưới</li>
                      <li>Chờ chủ sân xác nhận thanh toán (thường trong vài phút)</li>
                      <li>Sau khi xác nhận, bạn có thể mở đăng ký giải</li>
                    </ol>
                    <p className="text-xs text-blue-700 mt-2"><strong>Lưu ý:</strong> Giải đấu sẽ ở trạng thái bản nháp cho đến khi thanh toán được xác nhận.</p>
                  </div>
                </AlertDescription>
              </Alert>

              {/* QR Code Display */}
              {ownerQRCode ? (
                <div className="flex flex-col items-center space-y-3 p-6 bg-white border-2 border-dashed rounded-lg">
                  <p className="font-semibold text-lg">Quét mã QR để chuyển khoản</p>
                  <img
                    src={ownerQRCode}
                    alt="QR Code thanh toán"
                    className="w-64 h-64 object-contain border rounded-lg"
                  />
                  <p className="text-sm text-muted-foreground text-center">
                    Số tiền: <span className="font-bold text-primary">{formatVND(totalPrice)}</span>
                  </p>
                </div>
              ) : (
                <Alert variant="destructive">
                  <AlertDescription>
                    Chủ sân chưa cập nhật QR code. Vui lòng liên hệ chủ sân hoặc chọn thanh toán tiền mặt.
                  </AlertDescription>
                </Alert>
              )}

              {/* Upload Payment Proof */}
              <div className="space-y-2">
                <Label>Upload bill chuyển khoản *</Label>
                <ImageUpload
                  value={paymentProofUrl || undefined}
                  onChange={(url) => setPaymentProofUrl(url)}
                  bucket="image"
                  folder="payment-proofs"
                  maxSize={5}
                />
                <p className="text-xs text-muted-foreground">
                  Upload ảnh bill/screenshot giao dịch chuyển khoản thành công (PNG, JPG - tối đa 5MB)
                </p>
              </div>
            </div>
          )}

          {/* Cash Payment Info */}
          {paymentMethod === 'cash' && (
            <div className="space-y-3 animate-fade-in">
              <Alert className="bg-amber-50 border-amber-300">
                <Info className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-900">
                  <div className="space-y-2">
                    <p className="font-semibold">📋 Hướng dẫn thanh toán tiền mặt:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm ml-2">
                      <li>Liên hệ chủ sân để hẹn lịch thanh toán</li>
                      <li>Mang theo <span className="font-bold text-amber-700">{formatVND(totalPrice)}</span> tiền mặt</li>
                      <li>Thanh toán trực tiếp tại sân</li>
                      <li>Chủ sân sẽ xác nhận thanh toán trên hệ thống</li>
                      <li>Sau khi xác nhận, bạn có thể mở đăng ký giải</li>
                    </ol>
                  </div>
                </AlertDescription>
              </Alert>
              
              <Alert className="bg-blue-50 border-blue-300">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900 text-sm">
                  <strong>Lưu ý:</strong> Giải đấu sẽ ở trạng thái <span className="font-semibold">Bản nháp</span> và <span className="font-semibold">chưa thể mở đăng ký</span> cho đến khi chủ sân xác nhận đã nhận thanh toán.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container max-w-5xl mx-auto py-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/tournaments')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
        <h1 className="text-3xl font-bold">Tạo giải đấu mới</h1>
        <p className="text-muted-foreground mt-2">
          Điền thông tin và chọn sân để tạo giải đấu
        </p>
      </div>

      {renderStepIndicator()}

      <div className="mb-8">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>

        {currentStep < totalSteps ? (
          <Button onClick={nextStep}>
            Tiếp theo
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Tạo giải đấu
          </Button>
        )}
      </div>
    </div>
  );
}
