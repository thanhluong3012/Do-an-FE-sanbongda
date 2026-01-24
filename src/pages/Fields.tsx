import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { MapPin, Search, Star, Users, Clock, DollarSign, Image as ImageIcon } from 'lucide-react';

// Mock data - sẽ thay bằng API call
const mockFields = [
  {
    id: 1,
    name: 'Sân TM Arena 1',
    location: '123 Đường ABC, Quận 1, TP.HCM',
    district: 'Quận 1',
    type: '5v5',
    price: 300000,
    rating: 4.8,
    reviews: 124,
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
    status: 'available',
    features: ['Đèn chiếu sáng', 'Có mái che', 'Nước miễn phí', 'Bãi đỗ xe'],
    openTime: '06:00',
    closeTime: '23:00',
  },
  {
    id: 2,
    name: 'Sân TM Arena 2',
    location: '456 Đường XYZ, Quận 3, TP.HCM',
    district: 'Quận 3',
    type: '7v7',
    price: 500000,
    rating: 4.6,
    reviews: 89,
    image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800',
    status: 'available',
    features: ['Đèn chiếu sáng', 'Có mái che', 'Quầy bar', 'Bãi đỗ xe'],
    openTime: '06:00',
    closeTime: '23:00',
  },
  {
    id: 3,
    name: 'Sân TM Arena 3',
    location: '789 Đường DEF, Quận 7, TP.HCM',
    district: 'Quận 7',
    type: '5v5',
    price: 350000,
    rating: 4.9,
    reviews: 201,
    image: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800',
    status: 'busy',
    features: ['Đèn chiếu sáng', 'Cỏ nhân tạo cao cấp', 'Nước miễn phí', 'Phòng thay đồ'],
    openTime: '05:00',
    closeTime: '22:00',
  },
  {
    id: 4,
    name: 'Sân TM Arena 4',
    location: '321 Đường GHI, Quận 5, TP.HCM',
    district: 'Quận 5',
    type: '11v11',
    price: 1200000,
    rating: 4.7,
    reviews: 156,
    image: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=800',
    status: 'available',
    features: ['Đèn chiếu sáng', 'Cỏ tự nhiên', 'Khán đài', 'Phòng thay đồ VIP', 'Bãi đỗ xe rộng'],
    openTime: '06:00',
    closeTime: '22:00',
  },
  {
    id: 5,
    name: 'Sân TM Arena 5',
    location: '654 Đường JKL, Quận 10, TP.HCM',
    district: 'Quận 10',
    type: '7v7',
    price: 450000,
    rating: 4.5,
    reviews: 67,
    image: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800',
    status: 'available',
    features: ['Đèn chiếu sáng', 'Có mái che', 'Nước miễn phí'],
    openTime: '07:00',
    closeTime: '23:00',
  },
  {
    id: 6,
    name: 'Sân TM Arena 6',
    location: '987 Đường MNO, Quận 2, TP.HCM',
    district: 'Quận 2',
    type: '5v5',
    price: 400000,
    rating: 4.8,
    reviews: 143,
    image: 'https://images.unsplash.com/photo-1589487391730-58f20eb2c308?w=800',
    status: 'available',
    features: ['Đèn chiếu sáng', 'Cỏ nhân tạo cao cấp', 'Quầy bar', 'Bãi đỗ xe', 'Wifi miễn phí'],
    openTime: '06:00',
    closeTime: '23:00',
  },
];

const districts = [
  'Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5', 
  'Quận 6', 'Quận 7', 'Quận 8', 'Quận 9', 'Quận 10',
  'Quận 11', 'Quận 12', 'Bình Thạnh', 'Tân Bình', 'Phú Nhuận'
];

const Fields = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 1500000]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-500">Còn trống</Badge>;
      case 'busy':
        return <Badge className="bg-red-500">Đã có người đặt</Badge>;
      default:
        return null;
    }
  };

  const filteredFields = mockFields.filter((field) => {
    const matchesSearch = field.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         field.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDistrict = filterDistrict === 'all' || field.district === filterDistrict;
    const matchesType = filterType === 'all' || field.type === filterType;
    const matchesStatus = filterStatus === 'all' || field.status === filterStatus;
    const matchesPrice = field.price >= priceRange[0] && field.price <= priceRange[1];
    
    return matchesSearch && matchesDistrict && matchesType && matchesStatus && matchesPrice;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 mt-20">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <MapPin className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Tìm Sân Bóng Đá</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Tìm kiếm và đặt sân bóng đá phù hợp với nhu cầu của bạn
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Bộ lọc tìm kiếm</CardTitle>
                <CardDescription>Tìm sân phù hợp với bạn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tìm kiếm</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Tên sân, địa chỉ..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* District */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quận/Huyện</label>
                  <Select value={filterDistrict} onValueChange={setFilterDistrict}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn quận" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      {districts.map((district) => (
                        <SelectItem key={district} value={district}>
                          {district}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Loại sân</label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại sân" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="5v5">Sân 5 (5v5)</SelectItem>
                      <SelectItem value="7v7">Sân 7 (7v7)</SelectItem>
                      <SelectItem value="11v11">Sân 11 (11v11)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tình trạng</label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn tình trạng" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="available">Còn trống</SelectItem>
                      <SelectItem value="busy">Đã có người đặt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Giá (VNĐ/giờ): {priceRange[0].toLocaleString('vi-VN')} - {priceRange[1].toLocaleString('vi-VN')}
                  </label>
                  <Slider
                    min={0}
                    max={1500000}
                    step={50000}
                    value={priceRange}
                    onValueChange={setPriceRange}
                    className="mt-2"
                  />
                </div>

                {/* Reset */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterDistrict('all');
                    setFilterType('all');
                    setFilterStatus('all');
                    setPriceRange([0, 1500000]);
                  }}
                >
                  Đặt lại bộ lọc
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Fields Grid */}
          <div className="lg:col-span-3">
            <div className="mb-4 text-muted-foreground">
              Tìm thấy <strong>{filteredFields.length}</strong> sân
            </div>

            {filteredFields.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredFields.map((field) => (
                  <Card key={field.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                    <div className="relative h-48 bg-muted">
                      <img
                        src={field.image}
                        alt={field.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '';
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      {!field.image && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        {getStatusBadge(field.status)}
                      </div>
                    </div>
                    
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-xl">{field.name}</CardTitle>
                        <Badge variant="outline">{field.type}</Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{field.rating}</span>
                        <span className="text-muted-foreground">({field.reviews} đánh giá)</span>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{field.location}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {field.openTime} - {field.closeTime}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-primary" />
                        <span className="text-lg font-bold text-primary">
                          {field.price.toLocaleString('vi-VN')} VNĐ
                        </span>
                        <span className="text-sm text-muted-foreground">/giờ</span>
                      </div>

                      <div className="flex flex-wrap gap-1 pt-2">
                        {field.features.slice(0, 3).map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {field.features.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{field.features.length - 3}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                    
                    <CardFooter className="flex gap-2">
                      <Button variant="outline" className="flex-1" asChild>
                        <Link to={`/field/${field.id}`}>
                          Xem chi tiết
                        </Link>
                      </Button>
                      <Button className="flex-1" asChild>
                        <Link to={`/booking?field=${field.id}`}>
                          Đặt sân ngay
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12">
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Không tìm thấy sân</h3>
                  <p className="text-muted-foreground mb-4">
                    Thử điều chỉnh bộ lọc hoặc tìm kiếm khác
                  </p>
                  <Button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterDistrict('all');
                      setFilterType('all');
                      setFilterStatus('all');
                      setPriceRange([0, 1500000]);
                    }}
                  >
                    Đặt lại bộ lọc
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Fields;
