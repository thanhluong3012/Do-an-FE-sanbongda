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
  Phone, Calendar as CalendarIcon, Star, Zap, Users, Shield, LogIn
} from 'lucide-react';
import { vi } from 'date-fns/locale';
import { format, isWeekend } from 'date-fns';
import { fieldComplexService, FieldComplex, SubField, FieldHourlyPrice } from '@/services/fieldComplexService';
import { bookingService, Booking } from '@/services/bookingService';
import { useBookingSync, BookingUpdateMessage } from '@/hooks/useBookingSync';
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

  // Handler for date selection - reset time when date changes
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    
    // Reset time selections khi đổi ngày để tránh giữ giờ không hợp lệ
    // Ví dụ: chọn 14:00 cho ngày mai, nhưng đổi sang hôm nay mà giờ đã qua 14:00
    setStartTime('');
    setEndTime('');
  };

  // Real-time sync between tabs
  const handleBookingUpdate = useCallback((message: BookingUpdateMessage) => {
    // Reload bookings nếu update liên quan đến field và date hiện tại
    if (selectedField && selectedDate) {
      const currentDate = format(selectedDate, 'yyyy-MM-dd');
      if (message.fieldId === selectedField.id && message.bookingDate === currentDate) {
        console.log('Booking updated from another tab, reloading...');
        loadBookingsForSelectedField();
        
        // Show notification
        if (toast) {
          toast({
            title: 'Thông báo',
            description: 'Khung giờ đã được cập nhật từ tab khác',
            variant: 'default',
          });
        }
      }
    }
  }, [selectedField, selectedDate]);

  const { broadcastBookingUpdate } = useBookingSync(handleBookingUpdate);

  useEffect(() => {
    if (id) {
      loadFieldComplex();
      loadSubFields();
      loadFieldPrices(); // Load prices for the cluster
    }
  }, [id]);

  // Load bookings khi chọn field hoặc date
  useEffect(() => {
    if (selectedField && selectedDate) {
      loadBookingsForSelectedField();
    }
  }, [selectedField, selectedDate]);

  const loadFieldComplex = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await fieldComplexService.getById(Number(id));
      if (data) {
        setFieldComplex(data);
      }
    } catch (error: any) {
      console.error('Error loading field complex:', error);
      setFieldComplex(null);
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

  const loadSubFields = async () => {
    if (!id) return;
    
    try {
      const data = await fieldComplexService.getFieldsByClusterId(Number(id));
      if (data && data.length > 0) {
        setSubFields(data);
      }
    } catch (error: any) {
      console.error('Error loading sub fields:', error);
      setSubFields([]);
      if (toast) {
        toast({
          title: 'Lỗi',
          description: 'Không thể tải danh sách sân. Vui lòng thử lại sau.',
          variant: 'destructive',
        });
      }
    }
  };

  const loadFieldPrices = async () => {
    if (!id) return;
    
    try {
      const data = await fieldComplexService.getFieldClusterPrices(Number(id));
      if (data && data.length > 0) {
        setFieldPrices(data);
      }
    } catch (error: any) {
      console.error('Error loading field prices:', error);
      setFieldPrices([]);
      if (toast) {
        toast({
          title: 'Lỗi',
          description: 'Không thể tải bảng giá. Vui lòng thử lại sau.',
          variant: 'destructive',
        });
      }
    }
  };

  // Load bookings cho field và date đã chọn
  const loadBookingsForSelectedField = async () => {
    if (!selectedField || !selectedDate) return;

    try {
      const bookingDate = format(selectedDate, 'yyyy-MM-dd');
      console.log('Loading bookings for field:', selectedField.id, 'date:', bookingDate);
      
      const data = await bookingService.getBookingsByFieldAndDate(
        selectedField.id,
        bookingDate
      );
      
      console.log('Loaded bookings data:', data);
      setBookings(data);
      
      // Tạo Set các khung giờ đã được đặt
      const bookedSlots = new Set<string>();
      data.forEach(booking => {
        try {
          const start = booking.start_time?.substring(0, 5) || '';
          const end = booking.end_time?.substring(0, 5) || '';
          if (start && end) {
            // Đánh dấu tất cả các time slots trong khoảng này
            const timeSlots = generateTimeSlotsInRange(start, end);
            timeSlots.forEach(slot => bookedSlots.add(slot));
          }
        } catch (err) {
          console.error('Error processing booking:', booking, err);
        }
      });
      setBookedTimeSlots(bookedSlots);
      
      console.log('Loaded bookings:', data);
      console.log('Booked time slots:', Array.from(bookedSlots));
    } catch (error: any) {
      console.error('Error loading bookings:', error);
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
      const bookingData = {
        field_id: selectedField.id,
        booking_date: bookingDate,
        start_time: startTime,
        end_time: endTime,
        total_price: calculateTotalPrice(),
      };

      // Sử dụng bookingService với availability check và optimistic locking
      const result = await bookingService.createBooking(bookingData);
      
      console.log('✅ Booking result:', result);
      
      if (result.success) {
        try {
          console.log('Processing successful booking...');
          
          // Reset form trước để tránh re-submit
          setStartTime('');
          setEndTime('');
          
          // Show success toast WITHOUT navigation action
          if (toast) {
            toast({
              title: 'Đặt sân thành công! ✅',
              description: `Đã đặt sân từ ${startTime} đến ${endTime} vào ${format(selectedDate, 'dd/MM/yyyy')}`,
              duration: 5000,
            });
          }

          // Broadcast update tới các tab khác
          console.log('Broadcasting update...');
          broadcastBookingUpdate({
            type: 'booking_created',
            fieldId: selectedField.id,
            bookingDate: bookingDate,
            startTime: startTime,
            endTime: endTime,
            bookingId: result.data?.id,
            timestamp: Date.now()
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
        // Booking failed - show error
        if (toast) {
          toast({
            title: 'Không thể đặt sân',
            description: result.error || 'Khung giờ này không còn trống hoặc đã được đặt bởi người khác.',
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
                  <CardDescription>Giá theo loại ngày (VNĐ/giờ)</CardDescription>
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
                                    {weekdayPrice ? Number(weekdayPrice.price_hour).toLocaleString('vi-VN') : '-'}
                                  </span>
                                </div>
                              </td>
                              <td className="text-right py-4 px-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 dark:bg-orange-950 rounded-lg">
                                  <DollarSign className="w-4 h-4 text-orange-600" />
                                  <span className="font-semibold text-orange-700 dark:text-orange-400">
                                    {weekendPrice ? Number(weekendPrice.price_hour).toLocaleString('vi-VN') : '-'}
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
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary flex items-center gap-1">
                                <DollarSign className="w-5 h-5" />
                                {totalPrice.toLocaleString('vi-VN')}
                              </div>
                              <span className="text-xs text-muted-foreground">VNĐ</span>
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
                      Đặt sân - {totalPrice.toLocaleString('vi-VN')} VNĐ
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
    </div>
  );
};

export default FieldComplexDetail;
