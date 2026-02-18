import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/ui/image-upload';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, Building2, FileText, IdCard } from 'lucide-react';
import { z } from 'zod';
import api from '@/lib/axios';

const emailSchema = z.string().email('Email không hợp lệ');
const passwordSchema = z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự');
const nameSchema = z.string().min(2, 'Tên phải có ít nhất 2 ký tự');
const phoneSchema = z.string().regex(/^[0-9]{10}$/, 'Số điện thoại phải có 10 chữ số');
const idCardSchema = z.string().regex(/^[0-9]{9,12}$/, 'CMND/CCCD phải có 9-12 chữ số');

const FieldOwnerRegistration = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessLicenseImage, setBusinessLicenseImage] = useState<string | null>(null);
  const [idCardNumber, setIdCardNumber] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const validateForm = (): boolean => {
    try {
      nameSchema.parse(fullName);
      emailSchema.parse(email);
      phoneSchema.parse(phone);
      passwordSchema.parse(password);
      idCardSchema.parse(idCardNumber);
      
      if (password !== confirmPassword) {
        toast({
          title: 'Lỗi',
          description: 'Mật khẩu xác nhận không khớp',
          variant: 'destructive',
        });
        return false;
      }

      if (!businessName.trim()) {
        toast({
          title: 'Lỗi',
          description: 'Vui lòng nhập tên doanh nghiệp',
          variant: 'destructive',
        });
        return false;
      }

      if (!address.trim()) {
        toast({
          title: 'Lỗi',
          description: 'Vui lòng nhập địa chỉ',
          variant: 'destructive',
        });
        return false;
      }

      if (!businessLicenseImage) {
        toast({
          title: 'Lỗi',
          description: 'Vui lòng tải lên hình ảnh giấy phép kinh doanh',
          variant: 'destructive',
        });
        return false;
      }
      
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: 'Lỗi',
          description: err.errors[0].message,
          variant: 'destructive',
        });
        return false;
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Gọi API đăng ký chủ sân bóng
      await api.post('/owner-registrations', {
        name: fullName,
        email,
        password,
        phone,
        businessLicenseImage,
        idCardNumber,
        businessName,
        address,
      });

      toast({
        title: 'Thành công',
        description: 'Đăng ký thành công! Vui lòng chờ quản trị viên phê duyệt tài khoản.',
      });
      
      // Chuyển về trang đăng nhập sau 2 giây
      setTimeout(() => {
        navigate('/auth');
      }, 2000);
    } catch (error: any) {
      let message = 'Đăng ký thất bại';
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }
      
      toast({
        title: 'Lỗi',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 py-12">
      <div className="w-full max-w-3xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 group">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
              <span className="text-primary-foreground font-bold text-2xl">⚽</span>
            </div>
            <span className="font-display font-bold text-2xl text-foreground">
              SânBóng<span className="text-primary">Pro</span>
            </span>
          </a>
          <p className="text-muted-foreground mt-2">Đăng ký trở thành chủ sân bóng</p>
        </div>

        <Card variant="elevated" className="border-0 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl">Đăng ký chủ sân bóng</CardTitle>
            <CardDescription>Vui lòng điền đầy đủ thông tin để đăng ký</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Thông tin cá nhân */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Thông tin cá nhân</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Họ và tên <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Nguyễn Văn A"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-destructive">*</span>
                      <span className="text-xs text-muted-foreground ml-2">(Tên đăng nhập của bạn)</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Số điện thoại <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="0912345678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10"
                        maxLength={10}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="idCardNumber">Số CMND/CCCD <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="idCardNumber"
                        type="text"
                        placeholder="123456789"
                        value={idCardNumber}
                        onChange={(e) => setIdCardNumber(e.target.value)}
                        className="pl-10"
                        maxLength={12}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Mật khẩu <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Xác nhận mật khẩu <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Thông tin doanh nghiệp */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Thông tin doanh nghiệp</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="businessName">Tên doanh nghiệp <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="businessName"
                      type="text"
                      placeholder="Công ty TNHH Sân Bóng ABC"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Địa chỉ <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      id="address"
                      placeholder="123 Đường ABC, Phường XYZ, Quận 1, TP.HCM"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="pl-10 min-h-[80px]"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessLicenseImage">
                    Hình ảnh giấy phép kinh doanh <span className="text-destructive">*</span>
                  </Label>
                  <ImageUpload
                    value={businessLicenseImage || undefined}
                    onChange={(url) => setBusinessLicenseImage(url)}
                    bucket="business-licenses"
                    folder="field-owners"
                    maxSize={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tải lên ảnh giấy phép kinh doanh (PNG, JPG - tối đa 5MB)
                  </p>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg border border-muted">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Lưu ý:</strong> Sau khi đăng ký, tài khoản của bạn sẽ cần được quản trị viên phê duyệt trước khi có thể sử dụng.
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang đăng ký...' : 'Hoàn thành đăng ký'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mt-6">
          <a href="/" className="hover:text-primary transition-colors">
            ← Quay về trang chủ
          </a>
          <span>•</span>
          <a href="/auth" className="hover:text-primary transition-colors">
            Đã có tài khoản? Đăng nhập
          </a>
        </div>
      </div>
    </div>
  );
};

export default FieldOwnerRegistration;
