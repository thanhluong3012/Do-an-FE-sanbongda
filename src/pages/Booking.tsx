import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Clock, Users, Star, ChevronLeft, ChevronRight, QrCode, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const fields = [
  {
    id: 1,
    name: 'Sân Thống Nhất A',
    location: 'Quận 10, TP.HCM',
    type: '5 người',
    price: 400000,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=400&h=250&fit=crop',
  },
  {
    id: 2,
    name: 'Sân Phú Thọ B',
    location: 'Quận 11, TP.HCM',
    type: '7 người',
    price: 600000,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=250&fit=crop',
  },
  {
    id: 3,
    name: 'Sân Tân Bình C',
    location: 'Quận Tân Bình, TP.HCM',
    type: '11 người',
    price: 1200000,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=400&h=250&fit=crop',
  },
];

const timeSlots = [
  { time: '06:00 - 07:30', available: true },
  { time: '07:30 - 09:00', available: true },
  { time: '09:00 - 10:30', available: false },
  { time: '10:30 - 12:00', available: true },
  { time: '14:00 - 15:30', available: true },
  { time: '15:30 - 17:00', available: false },
  { time: '17:00 - 18:30', available: true },
  { time: '18:30 - 20:00', available: false },
  { time: '20:00 - 21:30', available: true },
];

const Booking = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [selectedField, setSelectedField] = useState<typeof fields[0] | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'cash'>('qr');

  const handleSelectField = (field: typeof fields[0]) => {
    setSelectedField(field);
    setStep(2);
  };

  const handleSelectSlot = (slot: string) => {
    setSelectedSlot(slot);
    setStep(3);
  };

  const handleConfirmBooking = () => {
    if (!user) {
      toast({
        title: 'Cần đăng nhập',
        description: 'Vui lòng đăng nhập để đặt sân',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    toast({
      title: 'Đặt sân thành công!',
      description: `Bạn đã đặt ${selectedField?.name} vào ${selectedSlot} ngày ${selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: vi }) : ''}`,
    });
    
    // Reset booking
    setStep(1);
    setSelectedField(null);
    setSelectedSlot(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-8 pt-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    step >= s
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {s}
                </div>
                <span className={`hidden sm:block ${step >= s ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {s === 1 ? 'Chọn sân' : s === 2 ? 'Chọn giờ' : 'Xác nhận'}
                </span>
                {s < 3 && <ChevronRight className="text-muted-foreground" />}
              </div>
            ))}
          </div>

          {/* Step 1: Select Field */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-3xl font-display font-bold text-foreground mb-2">
                  Chọn sân bóng
                </h1>
                <p className="text-muted-foreground">Lựa chọn sân phù hợp với nhu cầu của bạn</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {fields.map((field) => (
                  <Card 
                    key={field.id} 
                    variant="interactive"
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-all"
                    onClick={() => handleSelectField(field)}
                  >
                    <div className="relative h-48">
                      <img
                        src={field.image}
                        alt={field.name}
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute top-3 right-3 bg-secondary text-secondary-foreground">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        {field.rating}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg text-foreground mb-2">{field.name}</h3>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          {field.location}
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          Sân {field.type}
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xl font-bold text-primary">
                          {field.price.toLocaleString('vi-VN')}đ
                        </span>
                        <span className="text-sm text-muted-foreground">/90 phút</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Select Date & Time */}
          {step === 2 && selectedField && (
            <div className="space-y-6">
              <Button variant="ghost" onClick={() => setStep(1)} className="gap-2">
                <ChevronLeft className="w-4 h-4" />
                Quay lại
              </Button>

              <div className="text-center">
                <h1 className="text-3xl font-display font-bold text-foreground mb-2">
                  Chọn ngày & giờ
                </h1>
                <p className="text-muted-foreground">
                  Đặt lịch cho <span className="text-primary font-semibold">{selectedField.name}</span>
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Calendar */}
                <Card variant="elevated">
                  <CardHeader>
                    <CardTitle className="text-lg">Chọn ngày</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      locale={vi}
                      disabled={(date) => date < new Date()}
                      className="rounded-md border"
                    />
                  </CardContent>
                </Card>

                {/* Time Slots */}
                <Card variant="elevated">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      Khung giờ - {selectedDate ? format(selectedDate, 'EEEE, dd/MM', { locale: vi }) : ''}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot.time}
                          disabled={!slot.available}
                          onClick={() => handleSelectSlot(slot.time)}
                          className={`p-4 rounded-xl text-center transition-all ${
                            slot.available
                              ? selectedSlot === slot.time
                                ? 'bg-primary text-primary-foreground shadow-md'
                                : 'bg-muted hover:bg-primary/10 hover:border-primary border border-transparent'
                              : 'bg-muted/50 text-muted-foreground cursor-not-allowed'
                          }`}
                        >
                          <div className="font-semibold">{slot.time}</div>
                          <div className="text-xs mt-1">
                            {slot.available ? 'Còn trống' : 'Đã đặt'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && selectedField && selectedSlot && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <Button variant="ghost" onClick={() => setStep(2)} className="gap-2">
                <ChevronLeft className="w-4 h-4" />
                Quay lại
              </Button>

              <div className="text-center">
                <h1 className="text-3xl font-display font-bold text-foreground mb-2">
                  Xác nhận đặt sân
                </h1>
                <p className="text-muted-foreground">Kiểm tra thông tin và hoàn tất đặt sân</p>
              </div>

              <Card variant="elevated">
                <CardContent className="p-6 space-y-6">
                  {/* Field Info */}
                  <div className="flex gap-4">
                    <img
                      src={selectedField.image}
                      alt={selectedField.name}
                      className="w-24 h-24 rounded-xl object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-lg">{selectedField.name}</h3>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {selectedField.location}
                      </p>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        Sân {selectedField.type}
                      </p>
                    </div>
                  </div>

                  <hr className="border-border" />

                  {/* Booking Details */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ngày đặt</span>
                      <span className="font-medium">
                        {selectedDate ? format(selectedDate, 'EEEE, dd/MM/yyyy', { locale: vi }) : ''}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Khung giờ</span>
                      <span className="font-medium">{selectedSlot}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Tổng tiền</span>
                      <span className="text-primary">{selectedField.price.toLocaleString('vi-VN')}đ</span>
                    </div>
                  </div>

                  <hr className="border-border" />

                  {/* Payment Method */}
                  <div className="space-y-3">
                    <h4 className="font-semibold">Phương thức thanh toán</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setPaymentMethod('qr')}
                        className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                          paymentMethod === 'qr'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <QrCode className="w-6 h-6 text-primary" />
                        <div className="text-left">
                          <div className="font-medium">QR Code</div>
                          <div className="text-xs text-muted-foreground">Thanh toán online</div>
                        </div>
                      </button>
                      <button
                        onClick={() => setPaymentMethod('cash')}
                        className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                          paymentMethod === 'cash'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <CreditCard className="w-6 h-6 text-primary" />
                        <div className="text-left">
                          <div className="font-medium">Tiền mặt</div>
                          <div className="text-xs text-muted-foreground">Thanh toán tại sân</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <Button onClick={handleConfirmBooking} className="w-full" size="lg">
                    Xác nhận đặt sân
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Booking;
