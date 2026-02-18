import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { MapPin, Star, Clock, DollarSign, ArrowLeft, Image as ImageIcon, CheckCircle, Phone, Mail } from 'lucide-react';
import { vi } from 'date-fns/locale';

// Mock data
const mockField = {
  id: 1,
  name: 'Sân TM Arena 1',
  location: '123 Đường ABC, Quận 1, TP.HCM',
  district: 'Quận 1',
  type: '5v5',
  price: 300000,
  rating: 4.8,
  reviewCount: 124,
  images: [
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200',
    'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=1200',
    'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=1200',
  ],
  status: 'available',
  features: ['Đèn chiếu sáng', 'Có mái che', 'Nước miễn phí', 'Bãi đỗ xe', 'Phòng thay đồ', 'Wifi miễn phí'],
  openTime: '06:00',
  closeTime: '23:00',
  description: 'Sân bóng đá chất lượng cao với cỏ nhân tạo cao cấp, hệ thống đèn chiếu sáng hiện đại. Phù hợp cho các trận đấu giao hữu và tổ chức giải đấu nhỏ. Không gian thoáng mát, có mái che toàn bộ sân.',
  contactPhone: '0123456789',
  contactEmail: 'contact@tmarena.com',
  rules: [
    'Không mang đồ ăn thức uống từ bên ngoài vào',
    'Giữ gìn vệ sinh sân bãi',
    'Không hút thuốc trong khu vực sân',
    'Tuân thủ giờ đặt sân',
    'Đền bù thiệt hại nếu làm hỏng trang thiết bị',
  ],
  availableSlots: [
    { time: '06:00 - 07:00', available: true },
    { time: '07:00 - 08:00', available: true },
    { time: '08:00 - 09:00', available: false },
    { time: '09:00 - 10:00', available: true },
    { time: '10:00 - 11:00', available: true },
    { time: '11:00 - 12:00', available: false },
    { time: '12:00 - 13:00', available: true },
    { time: '13:00 - 14:00', available: true },
    { time: '14:00 - 15:00', available: true },
    { time: '15:00 - 16:00', available: false },
    { time: '16:00 - 17:00', available: true },
    { time: '17:00 - 18:00', available: true },
    { time: '18:00 - 19:00', available: false },
    { time: '19:00 - 20:00', available: false },
    { time: '20:00 - 21:00', available: true },
    { time: '21:00 - 22:00', available: true },
    { time: '22:00 - 23:00', available: true },
  ],
  reviews: [
    {
      id: 1,
      user: 'Nguyễn Văn A',
      rating: 5,
      date: '2026-01-20',
      comment: 'Sân rất đẹp, cỏ mềm, đèn sáng. Nhân viên nhiệt tình. Sẽ quay lại!',
    },
    {
      id: 2,
      user: 'Trần Văn B',
      rating: 4,
      date: '2026-01-18',
      comment: 'Sân tốt, vị trí thuận tiện. Giá hơi cao một chút nhưng chất lượng xứng đáng.',
    },
    {
      id: 3,
      user: 'Lê Thị C',
      rating: 5,
      date: '2026-01-15',
      comment: 'Sân sạch sẽ, có đủ tiện nghi. Phòng thay đồ thoáng mát. Rất hài lòng!',
    },
  ],
};

const FieldDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 mt-20">
        {/* Back button */}
        <Button variant="ghost" onClick={() => navigate('/fields')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại danh sách
        </Button>

        {/* Images Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="relative h-[400px] bg-muted rounded-lg overflow-hidden">
            <img
              src={mockField.images[currentImageIndex]}
              alt={mockField.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            {mockField.images.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <ImageIcon className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {mockField.images.slice(1).map((image, index) => (
              <div
                key={index + 1}
                className="relative h-[192px] bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition"
                onClick={() => setCurrentImageIndex(index + 1)}
              >
                <img
                  src={image}
                  alt={`${mockField.name} ${index + 2}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold mb-2">{mockField.name}</h1>
                  <div className="flex items-center gap-3">
                    <Badge>{mockField.type}</Badge>
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold">{mockField.rating}</span>
                      <span className="text-muted-foreground">({mockField.reviews.length} đánh giá)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 text-muted-foreground mb-4">
                <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>{mockField.location}</span>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span>
                    {mockField.openTime} - {mockField.closeTime}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-bold text-primary">
                    {mockField.price.toLocaleString('vi-VN')} VNĐ
                  </span>
                  <span className="text-muted-foreground">/giờ</span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="info" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="info">Thông tin</TabsTrigger>
                <TabsTrigger value="features">Tiện ích</TabsTrigger>
                <TabsTrigger value="rules">Quy định</TabsTrigger>
                <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
              </TabsList>

              <TabsContent value="info">
                <Card>
                  <CardHeader>
                    <CardTitle>Mô tả</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {mockField.description}
                    </p>
                    <div className="mt-6 pt-6 border-t space-y-3">
                      <h4 className="font-semibold mb-3">Thông tin liên hệ</h4>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        {mockField.contactPhone}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        {mockField.contactEmail}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="features">
                <Card>
                  <CardHeader>
                    <CardTitle>Tiện ích & Dịch vụ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {mockField.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="rules">
                <Card>
                  <CardHeader>
                    <CardTitle>Quy định sân</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {mockField.rules.map((rule, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-primary font-bold">{index + 1}.</span>
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews">
                <div className="space-y-4">
                  {mockField.reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold">{review.user}</p>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.date).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <p className="text-muted-foreground">{review.comment}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Đặt sân</CardTitle>
                <CardDescription>Chọn ngày và giờ muốn đặt</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Chọn ngày</label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    locale={vi}
                    className="rounded-md border"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Khung giờ trống</label>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {mockField.availableSlots.map((slot, index) => (
                      <Button
                        key={index}
                        variant={slot.available ? 'outline' : 'ghost'}
                        className="w-full justify-between"
                        disabled={!slot.available}
                      >
                        <span>{slot.time}</span>
                        {slot.available ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            Trống
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-red-100 text-red-700">
                            Đã đặt
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button className="w-full" size="lg" asChild>
                  <Link to={`/booking?field=${mockField.id}`}>
                    Đặt sân ngay
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FieldDetail;
