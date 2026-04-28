import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MapPin, Clock, ArrowLeft, Image as ImageIcon, 
  Building2, AlertCircle, DollarSign, CheckCircle2,
  Phone, Calendar as CalendarIcon, Star, Zap, Users, Shield, LogIn,
  QrCode, Wallet, Copy, Upload, Loader2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { vi } from 'date-fns/locale';
import { format, isWeekend } from 'date-fns';
import { fieldComplexService, FieldComplex, SubField, FieldHourlyPrice } from '@/services/fieldComplexService';
import { fieldService, BookedSlot } from '@/services/fieldService';
import { bookingService, Booking } from '@/services/bookingService';
import { getOwner } from '@/services/ownerService';
import { useBookingRealtimeSync, SyncMessage } from '@/hooks/useRealtimeSync';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

// No static fallback data — show errors when API fails

// Helper: Generate field name from field_type
const getFieldTypeName = (fieldType: string): string => {
  const typeMap: {[key: string]: string} = {
    '5v5': 'Sân 5 người',
    '7v7': 'Sân 7 người',
    '11v11': 'Sân 11 người',
  };
  return typeMap[fieldType] || `Sân ${fieldType}`;
};

// Helper: Generate unique field name with index
const getFieldName = (field: SubField, index: number): string => {
  if (field.name) return field.name;
  
  const baseName = getFieldTypeName(field.field_type);
  // Count how many fields of the same type appear before this one
  return `${baseName}`;
};

const FieldComplexDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  let toast: any;
  try {
    toast = useToast().toast;
  } catch (e) {
    console.error('Toast error:', e);
    toast = () => {}; // fallback
  }
  
  const [fieldComplex, setFieldComplex] = useState<FieldComplex | null>(null);
  const [subFields, setSubFields] = useState<SubField[]>([]);
  const [selectedField, setSelectedField] = useState<SubField | null>(null);
  const [fieldPrices, setFieldPrices] = useState<FieldHourlyPrice[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookedTimeSlots, setBookedTimeSlots] = useState<Set<string>>(new Set());
  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'cash'>('transfer');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [ownerQRCode, setOwnerQRCode] = useState<string | null>(null);

  // Handler for date selection - reset time when date changes
  const handleDateSelect = (date: Date | undefined) => {
    console.log('📅 User selected date:', {
      newDate: date?.toISOString(),
      newDateFormatted: date ? format(date, 'yyyy-MM-dd') : null,
      previousDate: selectedDate?.toISOString(),
      previousDateFormatted: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null,
      isSameDate: date && selectedDate ? format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') : false
    });
    
    setSelectedDate(date);
    
    // Reset time selections khi đổi ngày để tránh giữ giờ không hợp lệ
    // Ví dụ: chọn 14:00 cho ngày mai, nhưng đổi sang hôm nay mà giờ đã qua 14:00
    setStartTime('');
    setEndTime('');
  };

  // Real-time sync between tabs
  const handleBookingUpdate = useCallback((message: SyncMessage) => {
    // Reload bookings nếu update liên quan đến field và date hiện tại
    if (selectedField && selectedDate) {
      const currentDate = format(selectedDate, 'yyyy-MM-dd');
      if (message.relatedIds?.fieldId === selectedField.id && message.relatedIds?.bookingDate === currentDate) {
        console.log('🔔 Booking updated from another tab, reloading...');
        loadBookingsForSelectedField();
        
        // Show notification
        if (toast) {
          const actionText = message.type === 'booking_created' ? 'có booking mới' : 
                             message.type === 'booking_cancelled' ? 'có booking bị hủy' : 'được cập nhật';
          toast({
            title: '🔄 Cập nhật real-time',
            description: `Khung giờ ${actionText} từ tab khác`,
            duration: 3000,
          });
        }
      }
    }
  }, [selectedField, selectedDate]);

  const { broadcast } = useBookingRealtimeSync(handleBookingUpdate, selectedField?.id);

  // Helper function để format tiền VNĐ
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  useEffect(() => {
    if (id) {
      loadFieldComplex(); // Đã bao gồm fields và hourly_prices trong response
      loadOwnerQRCode(); // Load owner QR code
    }
  }, [id]);

  // Load bookings khi chọn field hoặc date
  useEffect(() => {
    console.log('🔄 useEffect triggered:', {
      selectedField: selectedField?.id,
      selectedFieldName: selectedField?.name,
      selectedDate: selectedDate?.toISOString(),
      selectedDateFormatted: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null
    });
    
    if (selectedField && selectedDate) {
      loadBookingsForSelectedField();
    } else {
      // Clear bookings nếu không có field hoặc date
      console.log('⚠️ Clearing bookings - missing field or date');
      setBookings([]);
      setBookedTimeSlots(new Set());
    }
  }, [selectedField, selectedDate]);

  const loadFieldComplex = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await fieldComplexService.getById(Number(id));
      if (data) {
        setFieldComplex(data);
        
        // Backend đã trả fields và hourly_prices trong response
        // Không cần gọi API riêng nữa!
        if (data.fields && data.fields.length > 0) {
          setSubFields(data.fields);
        }
        if (data.hourly_prices && data.hourly_prices.length > 0) {
          setFieldPrices(data.hourly_prices);
        }
      }
    } catch (error: any) {
      console.error('Error loading field complex:', error);
      setFieldComplex(null);
      setSubFields([]);
      setFieldPrices([]);
      if (toast) {
        toast({
          title: 'Lỗi',
          description: 'Không thể tải thông tin cụm sân. Vui lòng thử lại sau.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadOwnerQRCode = async () => {
    if (!id) return;
    
    try {
      // Load field cluster detail để lấy owner info
      const cluster = await fieldComplexService.getById(Number(id));
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

  // Load bookings cho field và date đã chọn - SỬ DỤNG API MỚI
  const loadBookingsForSelectedField = async () => {
    if (!selectedField || !selectedDate) return;

    try {
      const bookingDate = format(selectedDate, 'yyyy-MM-dd');
      console.log('🔍 Loading booked slots for field:', selectedField.id, 'date:', bookingDate);
      
      // Clear old state BEFORE loading new data
      console.log('🧹 Clearing old bookings state...');
      setBookings([]);
      setBookedTimeSlots(new Set());
      
      // ✅ GỌI API MỚI: /api/fields/{field_id}/booked-slots?date=YYYY-MM-DD
      const bookedSlots = await fieldService.getBookedSlots(selectedField.id, bookingDate);
      
      console.log('📥 Received booked slots from API:', bookedSlots.length);
      
      // Convert bookedSlots thành bookings format (để giữ compatibility)
      const bookingsData: Booking[] = bookedSlots.map((slot: BookedSlot) => ({
        id: slot.id,
        field_id: selectedField.id,
        booking_date: bookingDate,
        start_time: slot.start_time,
        end_time: slot.end_time,
        booking_type: slot.booking_type,
        status: slot.status as any,
        total_price: 0,
      }));
      
      setBookings(bookingsData);
      
      // Tạo Set các khung giờ đã được đặt
      const bookedTimeSlots = new Set<string>();
      console.log(`🔄 Processing ${bookedSlots.length} booked slots to mark time slots:`);
      
      bookedSlots.forEach((slot: BookedSlot, index: number) => {
        try {
          const start = slot.start_time?.substring(0, 5) || '';
          const end = slot.end_time?.substring(0, 5) || '';
          
          console.log(`  Slot ${index + 1}:`, {
            id: slot.id,
            time: `${start} - ${end}`,
            type: slot.booking_type,
            status: slot.status
          });
          
          if (start && end) {
            // Đánh dấu tất cả các time slots trong khoảng này
            const timeSlots = generateTimeSlotsInRange(start, end);
            console.log(`    → Marking ${timeSlots.length} time slots as booked:`, timeSlots);
            timeSlots.forEach(slot => bookedTimeSlots.add(slot));
          }
        } catch (err) {
          console.error('Error processing slot:', slot, err);
        }
      });
      
      console.log('🔒 Total booked time slots:', bookedTimeSlots.size);
      console.log('🔒 Booked slots:', Array.from(bookedTimeSlots).sort());
      setBookedTimeSlots(bookedTimeSlots);
    } catch (error: any) {
      console.error('❌ Error loading booked slots:', error);
      // Set empty arrays on error to prevent crashes
      setBookings([]);
      setBookedTimeSlots(new Set());
    }
  };

  // Generate time slots trong một khoảng thời gian
  const generateTimeSlotsInRange = (startTime: string, endTime: string): string[] => {
    const slots: string[] = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMin = startMin;
    
    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      slots.push(`${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`);
      
      currentMin += 30;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour++;
      }
    }
    
    return slots;
  };

  // Generate time options with 30-minute intervals
  const generateTimeOptions = (openTime: string, closeTime: string) => {
    const times: string[] = [];
    const [openHour, openMin] = openTime.split(':').map(Number);
    const [closeHour, closeMin] = closeTime.split(':').map(Number);
    
    let currentHour = openHour;
    let currentMin = openMin;
    
    while (currentHour < closeHour || (currentHour === closeHour && currentMin < closeMin)) {
      times.push(`${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`);
      
      currentMin += 30;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour++;
      }
    }
    
    // Add closing time
    times.push(`${closeHour.toString().padStart(2, '0')}:${closeMin.toString().padStart(2, '0')}`);
    
    return times;
  };

  // Get minimum bookable time (current time + buffer)
  const getMinimumBookableTime = (): string => {
    const now = new Date();
    const ADVANCE_BOOKING_HOURS = 1; // Phải đặt trước ít nhất 1 giờ
    
    // Thêm advance booking time
    now.setHours(now.getHours() + ADVANCE_BOOKING_HOURS);
    
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    // Round up to next 30-minute slot
    let roundedMinutes = 0;
    if (minutes > 0 && minutes <= 30) {
      roundedMinutes = 30;
    } else if (minutes > 30) {
      roundedMinutes = 0;
      now.setHours(hours + 1);
    }
    
    const finalHours = minutes > 30 ? hours + 1 : hours;
    return `${finalHours.toString().padStart(2, '0')}:${roundedMinutes.toString().padStart(2, '0')}`;
  };

  // Filter time options based on selected date
  const getAvailableTimeOptions = (allTimeOptions: string[]): string[] => {
    if (!selectedDate) return allTimeOptions;
    
    const today = new Date();
    const selected = new Date(selectedDate);
    
    // Chỉ so sánh ngày (bỏ qua giờ)
    today.setHours(0, 0, 0, 0);
    selected.setHours(0, 0, 0, 0);
    
    // Nếu chọn ngày hôm nay
    if (selected.getTime() === today.getTime()) {
      const minTime = getMinimumBookableTime();
      const [minHour, minMin] = minTime.split(':').map(Number);
      const minTotalMinutes = minHour * 60 + minMin;
      
      // Lọc chỉ giữ các time slots sau minTime
      return allTimeOptions.filter(time => {
        const [hour, min] = time.split(':').map(Number);
        const totalMinutes = hour * 60 + min;
        return totalMinutes >= minTotalMinutes;
      });
    }
    
    // Nếu chọn ngày trong tương lai, hiển thị tất cả
    return allTimeOptions;
  };

  // Calculate total hours between start and end time
  const calculateHours = (start: string, end: string): number => {
    if (!start || !end) return 0;
    
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;
    
    const diffMin = endTotalMin - startTotalMin;
    return diffMin / 60; // Return hours as decimal (e.g., 1.5 for 1.5 hours)
  };

  // Calculate total price
  const calculateTotalPrice = (): number => {
    if (!selectedField || !selectedDate || !startTime || !endTime || fieldPrices.length === 0) {
      return 0;
    }

    const hours = calculateHours(startTime, endTime);
    if (hours <= 0) return 0;

    const isWeekendDay = isWeekend(selectedDate);
    const hourlyPrice = fieldComplexService.getPriceForFieldType(
      fieldPrices, 
      selectedField.field_type, 
      isWeekendDay
    );
    
    return hourlyPrice * hours;
  };

  const handleBooking = async () => {
    // Check authentication first
    if (!user) {
      toast({
        title: 'Yêu cầu đăng nhập',
        description: 'Bạn cần đăng nhập để đặt sân.',
        variant: 'destructive',
      });
      // Redirect to login page after 1 second
      setTimeout(() => {
        navigate('/auth');
      }, 1000);
      return;
    }

    if (!selectedField || !selectedDate || !startTime || !endTime) {
      toast({
        title: 'Thiếu thông tin',
        description: 'Vui lòng chọn đầy đủ sân, ngày và giờ.',
        variant: 'destructive',
      });
      return;
    }

    const hours = calculateHours(startTime, endTime);
    if (hours <= 0) {
      toast({
        title: 'Giờ không hợp lệ',
        description: 'Giờ kết thúc phải sau giờ bắt đầu.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    setCheckingAvailability(true);

    try {
      const bookingDate = format(selectedDate, 'yyyy-MM-dd');
      
      // ✅ BƯỚC 1: CHECK AVAILABILITY TRƯỚC (API MỚI)
      const SKIP_AVAILABILITY_CHECK = false; // ✅ Backend đã fix, enable check
      
      if (!SKIP_AVAILABILITY_CHECK) {
        console.log('🔍 Checking availability with params:', {
          fieldId: selectedField.id,
          date: bookingDate,
          start_time: startTime + ':00',
          end_time: endTime + ':00',
        });
        
        const availabilityCheck = await fieldService.checkAvailability(selectedField.id, {
          date: bookingDate,
          start_time: startTime + ':00', // Backend expects HH:mm:ss
          end_time: endTime + ':00',
        });
        
        console.log('📦 Availability check result:', availabilityCheck);
        
        if (!availabilityCheck.is_available) {
          toast({
            title: 'Khung giờ không khả dụng',
            description: availabilityCheck.message || 'Khung giờ này đã có người đặt. Vui lòng chọn khung giờ khác.',
            variant: 'destructive',
          });
          setCheckingAvailability(false);
          setIsSubmitting(false);
          return;
        }
        
        console.log('✅ Availability check passed, proceeding with booking...');
      } else {
        console.log('⚠️ Skipping availability check (SKIP_AVAILABILITY_CHECK = true)');
      }
      
      setCheckingAvailability(false);
      
      // ✅ BƯỚC 2: TẠO BOOKING
      const bookingData = {
        field_id: selectedField.id,
        booking_date: bookingDate,
        start_time: startTime,
        end_time: endTime,
        total_price: calculateTotalPrice(),
        payment_method: paymentMethod,
      };

      const result = await bookingService.createBooking(bookingData);
      
      console.log('✅ Booking result:', result);
      
      if (result.success) {
        try {
          console.log('Processing successful booking...');
          
          // Lưu thông tin booking và payment_info
          setBookingResult(result.booking || result.data);
          setPaymentInfo(result.payment_info);
          
          // Reset form trước để tránh re-submit
          setStartTime('');
          setEndTime('');
          
          // Show payment dialog
          setShowPaymentDialog(true);
          
          // Show success toast WITH message from API
          if (toast) {
            toast({
              title: 'Đặt sân thành công! ✅',
              description: result.message || `Đã đặt sân từ ${startTime} đến ${endTime} vào ${format(selectedDate, 'dd/MM/yyyy')}`,
              duration: 5000,
            });
          }

          // Broadcast update tới các tab khác
          console.log('📡 Broadcasting booking update...');
          broadcast({
            type: 'booking_created',
            entityId: result.data?.id || result.booking?.id || 0,
            entityType: 'booking',
            relatedIds: {
              fieldId: selectedField.id,
              bookingDate: bookingDate,
            },
            data: {
              startTime: startTime,
              endTime: endTime,
              totalPrice: result.booking?.total_price || result.data?.total_price,
            },
          });

          // Reload bookings để cập nhật UI
          console.log('Reloading bookings...');
          await loadBookingsForSelectedField();
          
          console.log('✅ Booking process completed successfully');
        } catch (postBookingError) {
          console.error('❌ Error in post-booking processing:', postBookingError);
          // Don't throw, just log - booking was successful
        }

        // Không tự động navigate, để user click button trong toast
        // setTimeout(() => {
        //   navigate('/my-bookings');
        // }, 2000);
      } else {
        // Booking failed - show error WITH message from API
        if (toast) {
          toast({
            title: 'Không thể đặt sân',
            description: result.error || result.message || 'Khung giờ này không còn trống hoặc đã được đặt bởi người khác.',
            variant: 'destructive',
          });
        }

        // Reload bookings để cập nhật UI với dữ liệu mới nhất
        await loadBookingsForSelectedField();
      }
    } catch (error: any) {
      console.error('Error creating booking:', error);
      if (toast) {
        toast({
          title: 'Lỗi',
          description: error.response?.data?.message || 'Không thể đặt sân. Vui lòng thử lại sau.',
          variant: 'destructive',
        });
      }

      // Reload bookings trong trường hợp lỗi
      await loadBookingsForSelectedField();
    } finally {
      setIsSubmitting(false);
      setCheckingAvailability(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 mt-20">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Đang tải thông tin sân...</h3>
              <p className="text-muted-foreground">Vui lòng chờ trong giây lát</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!fieldComplex) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 mt-20">
          <Card className="p-12 border-none shadow-lg">
            <div className="text-center">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Không tìm thấy cụm sân</h3>
              <p className="text-muted-foreground mb-6">
                Cụm sân bạn đang tìm không tồn tại hoặc đã bị xóa
              </p>
              <Button onClick={() => navigate('/fields')} size="lg" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Quay lại danh sách
              </Button>
            </div>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const timeOptions = fieldComplex ? generateTimeOptions(
    (fieldComplex.open_time || fieldComplex.opening_time)?.substring(0, 5) || '06:00',
    (fieldComplex.close_time || fieldComplex.closing_time)?.substring(0, 5) || '23:00'
  ) : [];

  // Filter time options based on selected date and current time
  const availableTimeOptions = getAvailableTimeOptions(timeOptions);

  const totalHours = calculateHours(startTime, endTime);
  const totalPrice = calculateTotalPrice();
  const isWeekendDay = selectedDate ? isWeekend(selectedDate) : false;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 mt-20">
        {/* Back button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/fields')} 
          className="mb-6 hover:bg-primary/10 hover:text-primary transition-all group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Quay lại danh sách sân
        </Button>

        {/* Header Image */}
        <div className="relative h-[400px] bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl overflow-hidden mb-8 shadow-xl">
          {fieldComplex.image ? (
            <>
              <img
                src={fieldComplex.image}
                alt={fieldComplex.name}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    const placeholder = parent.querySelector('.placeholder-icon');
                    if (placeholder) {
                      (placeholder as HTMLElement).style.display = 'flex';
                    }
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            </>
          ) : null}
          <div 
            className="placeholder-icon absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted/50"
            style={{ display: fieldComplex.image ? 'none' : 'flex' }}
          >
            <ImageIcon className="w-32 h-32 text-muted-foreground/20" />
          </div>
          
          {/* Floating Badge */}
          <div className="absolute top-6 right-6">
            <Badge className="bg-green-500 text-white border-none shadow-lg px-4 py-2 text-sm">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Đang hoạt động
            </Badge>
          </div>
        </div>

        {/* Info Section */}
        <Card className="mb-8 border-none shadow-lg">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">{fieldComplex.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm text-muted-foreground ml-1">(5.0)</span>
                </div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Địa chỉ</p>
                  <p className="font-medium">{fieldComplex.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <Clock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Giờ mở cửa</p>
                  <p className="font-medium">
                    {(fieldComplex.open_time || fieldComplex.opening_time)?.substring(0, 5)} - {(fieldComplex.close_time || fieldComplex.closing_time)?.substring(0, 5)}
                  </p>
                </div>
              </div>

              {fieldComplex.phone && (
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <Phone className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Liên hệ</p>
                    <p className="font-medium">{fieldComplex.phone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <Users className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Số sân khả dụng</p>
                  <p className="font-medium text-primary">{subFields.filter(f => f.status === 'available').length} sân</p>
                </div>
              </div>
            </div>

            {fieldComplex.description && (
              <div className="pt-6 border-t">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Mô tả
                </h3>
                <p className="text-muted-foreground leading-relaxed">{fieldComplex.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Fields Selection */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  Chọn sân
                </CardTitle>
                <CardDescription>Chọn loại sân bạn muốn đặt</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subFields.map((field, index) => {
                    const fieldName = getFieldName(field, index);
                    const fieldTypeName = getFieldTypeName(field.field_type);
                    
                    return (
                      <Card 
                        key={field.id} 
                        className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                          selectedField?.id === field.id 
                            ? 'ring-2 ring-primary shadow-lg border-primary bg-gradient-to-br from-primary/5 to-primary/10' 
                            : 'hover:border-primary/50'
                        } ${
                          field.status === 'maintenance' ? 'opacity-60 cursor-not-allowed hover:translate-y-0 hover:shadow-md' : ''
                        }`}
                        onClick={() => field.status === 'available' && setSelectedField(field)}
                      >
                        <div className="relative h-40 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-950 dark:to-emerald-950 flex items-center justify-center overflow-hidden">
                          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjIiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE0YzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
                          <div className="text-6xl">⚽</div>
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-primary text-primary-foreground shadow-md">
                              {fieldTypeName}
                            </Badge>
                          </div>
                          {selectedField?.id === field.id && (
                            <div className="absolute top-3 left-3">
                              <div className="p-2 bg-primary rounded-full shadow-lg">
                                <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
                              </div>
                            </div>
                          )}
                        </div>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-primary" />
                              {fieldName}
                            </span>
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge 
                              variant="outline" 
                              className={
                                field.status === 'available' 
                                  ? 'border-green-500 text-green-700 bg-green-50 dark:bg-green-950' 
                                  : 'border-orange-500 text-orange-700 bg-orange-50 dark:bg-orange-950'
                              }
                            >
                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                field.status === 'available' ? 'bg-green-500 animate-pulse' : 'bg-orange-500'
                              }`}></div>
                              {field.status === 'available' ? 'Sẵn sàng' : 'Bảo trì'}
                            </Badge>
                          </div>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
                
                {subFields.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Building2 className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-medium">Chưa có sân nào trong cụm này</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Price Table */}
            {selectedField && fieldPrices.length > 0 && (
              <Card className="border-none shadow-lg">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5">
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <DollarSign className="w-5 h-5 text-primary" />
                    </div>
                    Bảng giá - {getFieldTypeName(selectedField.field_type)}
                  </CardTitle>
                  <CardDescription>Giá theo loại ngày (₫/giờ)</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-primary/20">
                          <th className="text-left py-4 px-4 font-semibold">Loại sân</th>
                          <th className="text-right py-4 px-4 font-semibold">
                            <div className="flex items-center justify-end gap-2">
                              <CalendarIcon className="w-4 h-4 text-green-600" />
                              Ngày thường
                            </div>
                          </th>
                          <th className="text-right py-4 px-4 font-semibold">
                            <div className="flex items-center justify-end gap-2">
                              <Star className="w-4 h-4 text-orange-600" />
                              Cuối tuần
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {['5v5', '7v7', '11v11'].map((fieldType) => {
                          const weekdayPrice = fieldPrices.find(p => p.field_type === fieldType && p.day_type === 'weekday');
                          const weekendPrice = fieldPrices.find(p => p.field_type === fieldType && p.day_type === 'weekend');
                          
                          if (!weekdayPrice && !weekendPrice) return null;
                          
                          return (
                            <tr 
                              key={fieldType} 
                              className={`border-b transition-colors hover:bg-muted/30 ${
                                selectedField.field_type === fieldType 
                                  ? 'bg-primary/5 border-l-4 border-l-primary' 
                                  : ''
                              }`}
                            >
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg ${
                                    selectedField.field_type === fieldType 
                                      ? 'bg-primary/10' 
                                      : 'bg-muted'
                                  }`}>
                                    <Building2 className={`w-4 h-4 ${
                                      selectedField.field_type === fieldType 
                                        ? 'text-primary' 
                                        : 'text-muted-foreground'
                                    }`} />
                                  </div>
                                  <div>
                                    <span className="font-medium">{getFieldTypeName(fieldType)}</span>
                                    {selectedField.field_type === fieldType && (
                                      <Badge variant="outline" className="ml-2 border-primary text-primary">
                                        Đang chọn
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="text-right py-4 px-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-950 rounded-lg">
                                  <DollarSign className="w-4 h-4 text-green-600" />
                                  <span className="font-semibold text-green-700 dark:text-green-400">
                                    {weekdayPrice ? formatCurrency(Number(weekdayPrice.price_hour)) : '-'}
                                  </span>
                                </div>
                              </td>
                              <td className="text-right py-4 px-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 dark:bg-orange-950 rounded-lg">
                                  <DollarSign className="w-4 h-4 text-orange-600" />
                                  <span className="font-semibold text-orange-700 dark:text-orange-400">
                                    {weekendPrice ? formatCurrency(Number(weekendPrice.price_hour)) : '-'}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-200 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Giá cuối tuần áp dụng cho thứ 7, Chủ nhật và các ngày lễ. Giá đã bao gồm VAT.</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Booking Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-none shadow-xl">
              <CardHeader className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Đặt sân ngay
                </CardTitle>
                <CardDescription className="text-primary-foreground/80">
                  Chọn ngày và giờ đặt sân
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                {/* Authentication Warning */}
                {!user && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950 border-2 border-red-200 dark:border-red-800 rounded-xl">
                    <LogIn className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
                        Yêu cầu đăng nhập
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-300 mb-3">
                        Bạn cần đăng nhập để đặt sân
                      </p>
                      <Button 
                        size="sm" 
                        onClick={() => navigate('/auth')}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <LogIn className="w-4 h-4 mr-2" />
                        Đăng nhập ngay
                      </Button>
                    </div>
                  </div>
                )}

                {!selectedField && (
                  <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-950 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                        Chưa chọn sân
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300">
                        Vui lòng chọn sân ở bên trái để tiếp tục
                      </p>
                    </div>
                  </div>
                )}

                {selectedField && (
                  <div className="p-5 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/30 rounded-xl">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 bg-primary/20 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Sân đã chọn</p>
                        <p className="font-bold text-lg">{getFieldName(selectedField, 0)}</p>
                        <Badge className="mt-2 bg-primary/20 text-primary border-primary">
                          {getFieldTypeName(selectedField.field_type)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold flex items-center gap-2">
                      <div className="p-1.5 bg-primary/10 rounded-lg">
                        <CalendarIcon className="w-4 h-4 text-primary" />
                      </div>
                      Chọn ngày đặt sân
                    </label>
                    {selectedDate && (
                      <Badge variant="secondary" className="text-xs">
                        {format(selectedDate, 'dd/MM/yyyy', { locale: vi })}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-2xl blur-sm"></div>
                    <div className="relative bg-background rounded-xl border-2 border-primary/20 p-3 shadow-lg">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        locale={vi}
                        className="w-full"
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      />
                    </div>
                  </div>
                  
                  {selectedDate && (
                    <div className={`p-4 rounded-xl border-2 ${
                      isWeekendDay 
                        ? 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 border-orange-200 dark:border-orange-800' 
                        : 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800'
                    }`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {isWeekendDay ? (
                            <div className="p-2 bg-orange-200 dark:bg-orange-900 rounded-lg">
                              <Star className="w-4 h-4 text-orange-700 dark:text-orange-300" />
                            </div>
                          ) : (
                            <div className="p-2 bg-green-200 dark:bg-green-900 rounded-lg">
                              <CalendarIcon className="w-4 h-4 text-green-700 dark:text-green-300" />
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Loại ngày</p>
                            <p className={`text-sm font-bold ${
                              isWeekendDay 
                                ? 'text-orange-700 dark:text-orange-300' 
                                : 'text-green-700 dark:text-green-300'
                            }`}>
                              {isWeekendDay ? 'Cuối tuần' : 'Ngày thường'}
                            </p>
                          </div>
                        </div>
                        {isWeekendDay ? (
                          <Badge className="bg-orange-500 text-white border-none">
                            Giá cao hơn
                          </Badge>
                        ) : (
                          <Badge className="bg-green-500 text-white border-none">
                            Giá tiêu chuẩn
                          </Badge>
                        )}
                      </div>
                      
                      <div className={`flex items-center gap-2 text-xs p-2 rounded-lg ${
                        isWeekendDay 
                          ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200' 
                          : 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200'
                      }`}>
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>
                          {isWeekendDay 
                            ? 'Áp dụng giá cuối tuần cho Thứ 7, Chủ nhật và ngày lễ' 
                            : 'Áp dụng giá ưu đãi cho các ngày trong tuần (T2-T6)'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {!selectedDate && (
                    <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-blue-800 dark:text-blue-200">
                        Vui lòng chọn ngày bạn muốn đặt sân
                      </p>
                    </div>
                  )}
                </div>

                {selectedField && selectedDate && (
                  <>
                    {/* Display booked time slots info */}
                    {bookings.length > 0 && (
                      <div className="p-4 bg-red-50 dark:bg-red-950 border-2 border-red-200 dark:border-red-800 rounded-xl">
                        <div className="flex items-start gap-2 mb-2">
                          <Shield className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
                              Khung giờ đã được đặt ({bookings.length})
                            </p>
                            <div className="space-y-1">
                              {bookings.map((booking, idx) => {
                                const startTime = booking.start_time?.substring(0, 5) || '--:--';
                                const endTime = booking.end_time?.substring(0, 5) || '--:--';
                                return (
                                  <p key={idx} className="text-xs text-red-700 dark:text-red-300">
                                    • {startTime} - {endTime}
                                  </p>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Show current time info if booking today */}
                    {selectedDate && new Date(selectedDate).toDateString() === new Date().toDateString() && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-950 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
                        <div className="flex items-start gap-2">
                          <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">
                              Đặt sân trong ngày
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                              Chỉ hiển thị khung giờ từ {getMinimumBookableTime()} trở đi (phải đặt trước ít nhất 1 giờ)
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {availableTimeOptions.length === 0 && (
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                              Không còn khung giờ khả dụng
                            </p>
                            <p className="text-xs text-yellow-700 dark:text-yellow-300">
                              Vui lòng chọn ngày khác hoặc sân khác
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 rounded-lg">
                          <Clock className="w-4 h-4 text-primary" />
                        </div>
                        Giờ bắt đầu
                      </label>
                      <Select value={startTime} onValueChange={setStartTime}>
                        <SelectTrigger className="border-2 h-11">
                          <SelectValue placeholder="Chọn giờ bắt đầu" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTimeOptions.slice(0, -1).map((time) => {
                            const isBooked = bookedTimeSlots.has(time);
                            return (
                              <SelectItem 
                                key={time} 
                                value={time} 
                                disabled={isBooked}
                                className={isBooked ? 'opacity-50 cursor-not-allowed' : ''}
                              >
                                {time} {isBooked ? '(Đã đặt)' : ''}
                              </SelectItem>
                            );
                          })}
                          {availableTimeOptions.length === 0 && (
                            <SelectItem value="no-slots" disabled>
                              Không còn khung giờ
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 rounded-lg">
                          <Clock className="w-4 h-4 text-primary" />
                        </div>
                        Giờ kết thúc
                      </label>
                      <Select value={endTime} onValueChange={setEndTime}>
                        <SelectTrigger className="border-2 h-11">
                          <SelectValue placeholder="Chọn giờ kết thúc" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTimeOptions.map((time) => {
                            const isBeforeStart = startTime && time <= startTime;
                            const isBooked = bookedTimeSlots.has(time);
                            const disabled = isBeforeStart || isBooked;
                            return (
                              <SelectItem 
                                key={time} 
                                value={time} 
                                disabled={disabled}
                                className={disabled ? 'opacity-50 cursor-not-allowed' : ''}
                              >
                                {time} {isBooked ? '(Đã đặt)' : ''}
                              </SelectItem>
                            );
                          })}
                          {availableTimeOptions.length === 0 && (
                            <SelectItem value="no-slots" disabled>
                              Không còn khung giờ
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Payment Method Selection */}
                    {startTime && endTime && totalHours > 0 && (
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                        <h4 className="font-semibold text-sm mb-3 text-blue-900 dark:text-blue-200">
                          Phương thức thanh toán
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('transfer')}
                            className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                              paymentMethod === 'transfer'
                                ? 'border-primary bg-primary/10 shadow-md'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <QrCode className={`w-6 h-6 ${paymentMethod === 'transfer' ? 'text-primary' : 'text-muted-foreground'}`} />
                            <div className="text-center">
                              <div className="font-medium text-sm">Chuyển khoản</div>
                              <div className="text-xs text-muted-foreground">Quét mã QR</div>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('cash')}
                            className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                              paymentMethod === 'cash'
                                ? 'border-primary bg-primary/10 shadow-md'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <Wallet className={`w-6 h-6 ${paymentMethod === 'cash' ? 'text-primary' : 'text-muted-foreground'}`} />
                            <div className="text-center">
                              <div className="font-medium text-sm">Tiền mặt</div>
                              <div className="text-xs text-muted-foreground">Thanh toán tại sân</div>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}

                    {startTime && endTime && totalHours > 0 && (
                      <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-xl border-2 border-green-200 dark:border-green-800 space-y-3">
                        <h4 className="font-semibold text-sm flex items-center gap-2 text-green-800 dark:text-green-200">
                          <CheckCircle2 className="w-4 h-4" />
                          Tóm tắt đặt sân
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center p-2 bg-white/50 dark:bg-black/20 rounded-lg">
                            <span className="text-muted-foreground">Thời gian:</span>
                            <span className="font-bold">{totalHours} giờ</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-white/50 dark:bg-black/20 rounded-lg">
                            <span className="text-muted-foreground">Loại ngày:</span>
                            <span className="font-semibold">
                              {isWeekendDay ? '🌟 Cuối tuần' : '📅 Ngày thường'}
                            </span>
                          </div>
                        </div>
                        <div className="pt-3 border-t-2 border-green-200 dark:border-green-800">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-muted-foreground">Tổng tiền:</span>
                            <div className="text-2xl font-bold text-primary">
                              {formatCurrency(totalPrice)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <Button 
                  className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all" 
                  size="lg"
                  disabled={!user || !selectedField || !selectedDate || !startTime || !endTime || totalHours <= 0 || isSubmitting || checkingAvailability}
                  onClick={handleBooking}
                >
                  {!user ? (
                    <span className="flex items-center gap-2">
                      <LogIn className="w-5 h-5" />
                      Đăng nhập để đặt sân
                    </span>
                  ) : isSubmitting || checkingAvailability ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      {checkingAvailability ? 'Đang kiểm tra...' : 'Đang đặt sân...'}
                    </span>
                  ) : selectedField && selectedDate && startTime && endTime && totalHours > 0 ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Đặt sân - {formatCurrency(totalPrice)}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Vui lòng điền đầy đủ thông tin
                    </span>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Bằng việc đặt sân, bạn đồng ý với điều khoản sử dụng của chúng tôi
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />

      {/* Payment Information Dialog */}
      {bookingResult && paymentInfo && (
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                Đặt sân thành công!
              </DialogTitle>
              <DialogDescription>
                Booking #{bookingResult.id} - Tổng tiền: <span className="font-bold text-primary">{formatCurrency(bookingResult.total_price || 0)}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* API Success Message - Hiển thị nếu có */}
              {(paymentInfo?.instruction || bookingResult?.message) && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-sm text-green-800">
                    {paymentInfo?.instruction || bookingResult?.message || 'Đặt sân thành công!'}
                  </AlertDescription>
                </Alert>
              )}

              {/* Transfer Payment */}
              {paymentMethod === 'transfer' && (
                <div className="space-y-4">{/* QR Code */}
                  {ownerQRCode ? (
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <h3 className="font-semibold mb-4 flex items-center justify-center gap-2">
                          <QrCode className="w-5 h-5 text-primary" />
                          Quét mã QR để chuyển khoản
                        </h3>
                        <img 
                          src={ownerQRCode} 
                          alt="QR Code thanh toán" 
                          className="max-w-xs w-full mx-auto border-2 border-border rounded-lg"
                        />
                        <p className="text-xs text-muted-foreground mt-3">
                          Mã QR chuyển khoản của chủ sân
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Alert className="bg-orange-50 border-orange-200">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800">
                        <strong>Chủ sân chưa cập nhật mã QR.</strong> Vui lòng liên hệ trực tiếp với chủ sân để được hướng dẫn thanh toán.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Transfer Note - Hiển thị nếu backend trả về */}
                  {paymentInfo && paymentInfo.transfer_note && (
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="pt-6">
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Nội dung chuyển khoản:
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-background px-4 py-3 rounded-lg text-lg font-bold text-primary border-2 border-primary">
                            {paymentInfo.transfer_note}
                          </code>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              navigator.clipboard.writeText(paymentInfo.transfer_note);
                              toast({ title: 'Đã sao chép', description: 'Đã sao chép nội dung chuyển khoản' });
                            }}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          * Vui lòng ghi đúng nội dung này khi chuyển khoản
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Thông tin chủ sân */}
                  {fieldComplex && (
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-primary" />
                          Thông tin chủ sân
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                            <span className="text-muted-foreground">Cụm sân:</span>
                            <span className="font-medium">{fieldComplex.name}</span>
                          </div>
                          {fieldComplex.address && (
                            <div className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg">
                              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <span className="text-xs text-muted-foreground block">Địa chỉ:</span>
                                <span className="text-sm">{fieldComplex.address}</span>
                              </div>
                            </div>
                          )}
                          {fieldComplex.phone && (
                            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                              <span className="text-muted-foreground flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                Liên hệ:
                              </span>
                              <a href={`tel:${fieldComplex.phone}`} className="font-medium text-primary hover:underline">
                                {fieldComplex.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertDescription className="text-sm text-blue-800">
                      <strong>📋 Hướng dẫn:</strong>
                      <ol className="list-decimal list-inside mt-2 space-y-1 text-xs">
                        <li>Quét mã QR bằng app ngân hàng của bạn</li>
                        <li>Chuyển khoản đúng số tiền: <strong>{formatCurrency(bookingResult.total_price || 0)}</strong></li>
                        <li>Ghi nội dung chuyển khoản nếu có</li>
                        <li>Sau khi chuyển khoản, vào <strong>Lịch sử đặt sân</strong> để upload ảnh bill</li>
                      </ol>
                    </AlertDescription>
                  </Alert>

                  <Alert className="bg-yellow-50 border-yellow-200">
                    <AlertDescription className="text-yellow-800">
                      Sau khi chuyển khoản, vui lòng vào <strong>Lịch sử đặt sân</strong> để upload ảnh bill chuyển khoản.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Cash Payment */}
              {paymentMethod === 'cash' && paymentInfo.owner_contact && (
                <div className="space-y-4">
                  <Alert className="bg-amber-50 border-amber-200">
                    <Wallet className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-sm text-amber-800">
                      <strong>Thanh toán bằng tiền mặt trực tiếp tại sân.</strong>
                      {paymentInfo.instruction && <span> {paymentInfo.instruction}</span>}
                    </AlertDescription>
                  </Alert>

                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary" />
                        Thông tin liên hệ chủ sân
                      </h3>

                      <div className="space-y-3">
                        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                          <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Tên sân</p>
                            <p className="font-medium">{paymentInfo.owner_contact.name}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                          <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Số điện thoại</p>
                            <p className="font-medium">{paymentInfo.owner_contact.phone}</p>
                          </div>
                        </div>

                        {paymentInfo.owner_contact.address && (
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm text-muted-foreground">Địa chỉ</p>
                              <p className="font-medium">{paymentInfo.owner_contact.address}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Alert className="bg-yellow-50 border-yellow-200">
                    <AlertDescription className="text-yellow-800">
                      Vui lòng liên hệ chủ sân để thanh toán tiền mặt và xác nhận đặt sân.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowPaymentDialog(false);
                    setBookingResult(null);
                    setPaymentInfo(null);
                  }}
                >
                  Đóng
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    setShowPaymentDialog(false);
                    navigate('/my-bookings');
                  }}
                >
                  Xem lịch sử đặt sân
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default FieldComplexDetail;
