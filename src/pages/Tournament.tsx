import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { Trophy, CalendarIcon, MapPin, Users, DollarSign, FileText, Phone, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const Tournament = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [tournamentName, setTournamentName] = useState('');
  const [tournamentType, setTournamentType] = useState('');
  const [fieldName, setFieldName] = useState('');
  const [location, setLocation] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [maxTeams, setMaxTeams] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [startTime, setStartTime] = useState('');
  const [entryFee, setEntryFee] = useState('');
  const [prize, setPrize] = useState('');
  const [rules, setRules] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!tournamentName || !tournamentType || !fieldName || !location || !teamSize || !maxTeams || !startDate) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng điền đầy đủ các thông tin bắt buộc',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    // TODO: Gọi API để tạo giải đấu
    // const response = await api.post('/tournaments', { ... });

    // Giả lập API call
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: 'Thành công',
        description: 'Giải đấu đã được tạo thành công!',
      });
      // Chuyển đến trang danh sách giải đấu
      navigate('/tournaments');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 mt-20">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Tổ Chức Giải Đấu</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Tạo giải đấu bóng đá của riêng bạn và kết nối với cộng đồng yêu thích thể thao
          </p>
        </div>

        {/* Form */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Thông tin giải đấu</CardTitle>
            <CardDescription>
              Điền đầy đủ thông tin để tạo giải đấu mới. Các trường có dấu * là bắt buộc.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Thông tin cơ bản */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Thông tin cơ bản
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tournamentName">
                      Tên giải đấu <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="tournamentName"
                      placeholder="VD: Giải bóng đá TM Arena Cup 2026"
                      value={tournamentName}
                      onChange={(e) => setTournamentName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tournamentType">
                      Loại giải <span className="text-destructive">*</span>
                    </Label>
                    <Select value={tournamentType} onValueChange={setTournamentType}>
                      <SelectTrigger id="tournamentType">
                        <SelectValue placeholder="Chọn loại giải" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="round-robin">Vòng tròn (Round Robin)</SelectItem>
                        <SelectItem value="knockout">Loại trực tiếp (Knockout)</SelectItem>
                        <SelectItem value="group-knockout">Bảng đấu + Loại trực tiếp</SelectItem>
                        <SelectItem value="league">Giải đấu dài hạn (League)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Địa điểm & Sân */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Địa điểm & Sân
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fieldName">
                      Tên sân <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="fieldName"
                      placeholder="VD: Sân TM Arena 1"
                      value={fieldName}
                      onChange={(e) => setFieldName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">
                      Địa chỉ <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="location"
                      placeholder="VD: 123 Đường ABC, Quận 1, TP.HCM"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Quy mô giải đấu */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Quy mô giải đấu
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="teamSize">
                      Số người mỗi đội <span className="text-destructive">*</span>
                    </Label>
                    <Select value={teamSize} onValueChange={setTeamSize}>
                      <SelectTrigger id="teamSize">
                        <SelectValue placeholder="Chọn quy mô đội" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5v5">5 người (Sân 5)</SelectItem>
                        <SelectItem value="7v7">7 người (Sân 7)</SelectItem>
                        <SelectItem value="11v11">11 người (Sân 11)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxTeams">
                      Số đội tối đa <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="maxTeams"
                      type="number"
                      placeholder="VD: 8, 16, 32"
                      min="4"
                      max="64"
                      value={maxTeams}
                      onChange={(e) => setMaxTeams(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Thời gian */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Thời gian tổ chức
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Ngày bắt đầu <span className="text-destructive">*</span>
                    </Label>
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
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Ngày kết thúc</Label>
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
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startTime">Giờ thi đấu</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Chi phí & Giải thưởng */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Chi phí & Giải thưởng
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="entryFee">Phí tham gia (VNĐ)</Label>
                    <Input
                      id="entryFee"
                      type="number"
                      placeholder="VD: 500000"
                      min="0"
                      value={entryFee}
                      onChange={(e) => setEntryFee(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prize">Giải thưởng</Label>
                    <Input
                      id="prize"
                      placeholder="VD: 10,000,000 VNĐ + Cúp vô địch"
                      value={prize}
                      onChange={(e) => setPrize(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Thể lệ thi đấu */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Thể lệ thi đấu
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="rules">Mô tả chi tiết thể lệ</Label>
                  <Textarea
                    id="rules"
                    placeholder="VD: 
- Thời gian: 2 hiệp x 25 phút
- Nghỉ giữa hiệp: 10 phút
- Luật việt vị: Có áp dụng
- Số cầu thủ dự bị: Tối đa 5 người
- Thẻ phạt: Theo luật FIFA
- Đá penalty khi hòa ở vòng loại trực tiếp
..."
                    rows={8}
                    value={rules}
                    onChange={(e) => setRules(e.target.value)}
                  />
                </div>
              </div>

              {/* Thông tin liên hệ */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Thông tin liên hệ
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Người liên hệ</Label>
                    <Input
                      id="contactName"
                      placeholder="VD: Nguyễn Văn A"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Số điện thoại</Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      placeholder="VD: 0123456789"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email
                    </Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="VD: contact@tmarena.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Submit buttons */}
              <div className="flex gap-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/')}
                  disabled={isSubmitting}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Đang tạo...' : 'Tạo giải đấu'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Tournament;
