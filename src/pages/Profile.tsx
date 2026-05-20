import { useEffect, useState } from 'react';
import { useAuth, ROLES } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Mail, Phone, Lock, Upload, Image as ImageIcon, CreditCard, AlertCircle } from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';
import { getCurrentUser, updateProfile, type UpdateProfileData } from '@/services/userService';
import { updateOwnerProfile, getQRCode, type UpdateOwnerProfileData } from '@/services/ownerService';
import { vietqrService, type BankInfo } from '@/services/vietqrService';

export default function Profile() {
  const { user: authUser, isOwner } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // User info
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  });

  // Owner info
  const [ownerForm, setOwnerForm] = useState({
    business_name: '',
    code_id: '',
    address: '',
    bank_id: '',
    account_no: '',
    account_name: '',
  });

  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [banks, setBanks] = useState<BankInfo[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);

  useEffect(() => {
    loadUserProfile();
    if (authUser?.role_id === ROLES.OWNER) {
      loadBanks();
    }
  }, [authUser]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const response = await getCurrentUser();
      console.log('getCurrentUser response:', response);
      const userData = response.data || response;
      console.log('userData:', userData);
      console.log('authUser role_id:', authUser?.role_id);

      setUserForm({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        password: '',
        password_confirmation: '',
      });

      // Nếu là owner, load thêm thông tin owner và QR code
      if (authUser?.role_id === ROLES.OWNER) {
        console.log('User is OWNER, loading owner data...');
        if (userData.owner) {
          console.log('Owner data found:', userData.owner);
          setOwnerForm({
            business_name: userData.owner.business_name || '',
            code_id: userData.owner.code_id || '',
            address: userData.owner.address || '',
            bank_id: userData.owner.bank_id || '',
            account_no: userData.owner.account_no || '',
            account_name: userData.owner.account_name || '',
          });
        } else {
          console.log('No owner data found in userData');
        }

        // Load QR code
        try {
          const qrResponse = await getQRCode();
          console.log('QR code response:', qrResponse);
          if (qrResponse.data?.qr_code_url) {
            setQrCodeUrl(qrResponse.data.qr_code_url);
          }
        } catch (error) {
          console.log('No QR code found:', error);
        }
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải thông tin profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBanks = async () => {
    try {
      setLoadingBanks(true);
      console.log('🔍 Fetching banks from API...');
      const response = await vietqrService.getBanks();
      console.log('📦 Full API Response:', response);
      console.log('📊 Response.data:', response.data);
      console.log('✅ Is Array?', Array.isArray(response.data));
      
      if (response.success && response.data && Array.isArray(response.data)) {
        console.log(`✅ Loaded ${response.data.length} banks`);
        setBanks(response.data);
      } else {
        console.warn('⚠️ Banks data is not an array:', response);
        setBanks([]);
      }
    } catch (error) {
      console.error('❌ Error loading banks:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      setBanks([]);
    } finally {
      setLoadingBanks(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);

      // Validate password
      if (userForm.password && userForm.password !== userForm.password_confirmation) {
        toast({
          title: 'Lỗi',
          description: 'Mật khẩu xác nhận không khớp',
          variant: 'destructive',
        });
        return;
      }

      // Chỉ gửi các field có giá trị (không rỗng)
      const profileData: UpdateProfileData = {};
      
      if (userForm.name) profileData.name = userForm.name;
      if (userForm.phone) profileData.phone = userForm.phone;
      if (userForm.password) {
        profileData.password = userForm.password;
        profileData.password_confirmation = userForm.password_confirmation;
      }

      console.log('Sending profile data:', profileData);
      await updateProfile(profileData);

      // Nếu là owner, cập nhật thêm thông tin owner
      if (authUser?.role_id === ROLES.OWNER) {
        const ownerData: UpdateOwnerProfileData = {};
        
        if (ownerForm.business_name) ownerData.business_name = ownerForm.business_name;
        if (ownerForm.code_id) ownerData.code_id = ownerForm.code_id;
        if (ownerForm.address) ownerData.address = ownerForm.address;
        if (ownerForm.bank_id) ownerData.bank_id = ownerForm.bank_id;
        if (ownerForm.account_no) ownerData.account_no = ownerForm.account_no;
        if (ownerForm.account_name) ownerData.account_name = ownerForm.account_name;
        
        console.log('Sending owner data:', ownerData);
        // Chỉ gọi API nếu có ít nhất 1 field
        if (Object.keys(ownerData).length > 0) {
          await updateOwnerProfile(ownerData);
        }
      }

      toast({
        title: 'Thành công',
        description: 'Đã cập nhật thông tin profile',
      });

      // Reset password fields
      setUserForm(prev => ({
        ...prev,
        password: '',
        password_confirmation: '',
      }));
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Lỗi',
        description: error?.response?.data?.message || 'Không thể cập nhật profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleQRUpload = async (url: string | null) => {
    if (!url) {
      setQrCodeUrl(null);
      return;
    }

    try {
      // Lưu URL vào database qua API backend
      await updateOwnerProfile({ qr_code_image: url });
      setQrCodeUrl(url);

      toast({
        title: 'Thành công',
        description: 'Đã cập nhật QR code thanh toán',
      });
    } catch (error: any) {
      console.error('Error saving QR URL:', error);
      toast({
        title: 'Lỗi',
        description: error?.response?.data?.message || 'Không thể lưu QR code',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Thông Tin Cá Nhân</h1>

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          {/* User Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Thông Tin Tài Khoản
              </CardTitle>
              <CardDescription>
                Cập nhật thông tin cá nhân của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Họ và tên *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      className="pl-10"
                      value={userForm.name}
                      onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      className="pl-10 bg-gray-50"
                      value={userForm.email}
                      disabled
                    />
                  </div>
                  <p className="text-xs text-gray-500">Email không thể thay đổi</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      className="pl-10"
                      value={userForm.phone}
                      onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                      placeholder="0912345678"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Đổi Mật Khẩu (Tùy chọn)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Mật khẩu mới</Label>
                    <Input
                      id="password"
                      type="password"
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      placeholder="Để trống nếu không đổi"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password_confirmation">Xác nhận mật khẩu</Label>
                    <Input
                      id="password_confirmation"
                      type="password"
                      value={userForm.password_confirmation}
                      onChange={(e) => setUserForm({ ...userForm, password_confirmation: e.target.value })}
                      placeholder="Nhập lại mật khẩu mới"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Owner Information Card */}
          {authUser?.role_id === ROLES.OWNER && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Thông Tin Doanh Nghiệp</CardTitle>
                  <CardDescription>
                    Thông tin về cụm sân và doanh nghiệp của bạn
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="business_name">Tên doanh nghiệp</Label>
                      <Input
                        id="business_name"
                        value={ownerForm.business_name}
                        onChange={(e) => setOwnerForm({ ...ownerForm, business_name: e.target.value })}
                        placeholder="VD: Sân Bóng ABC"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="code_id">Mã chủ sân</Label>
                      <Input
                        id="code_id"
                        value={ownerForm.code_id}
                        onChange={(e) => setOwnerForm({ ...ownerForm, code_id: e.target.value })}
                        placeholder="VD: OWNER001"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Địa chỉ</Label>
                      <Input
                        id="address"
                        value={ownerForm.address}
                        onChange={(e) => setOwnerForm({ ...ownerForm, address: e.target.value })}
                        placeholder="Địa chỉ kinh doanh"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bank Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Thông Tin Tài Khoản Ngân Hàng
                  </CardTitle>
                  <CardDescription>
                    Cập nhật để nhận thanh toán trực tiếp từ khách hàng qua VietQR
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-sm text-blue-800">
                      <strong>Lợi ích:</strong> Khi cập nhật thông tin ngân hàng, khách hàng sẽ thanh toán trực tiếp vào tài khoản của bạn. 
                      Không cần qua hệ thống trung gian.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Ngân hàng */}
                    <div className="space-y-2">
                      <Label htmlFor="bank_id">Ngân hàng</Label>
                      <Select
                        value={ownerForm.bank_id}
                        onValueChange={(value) => setOwnerForm({ ...ownerForm, bank_id: value })}
                      >
                        <SelectTrigger id="bank_id">
                          <SelectValue placeholder="-- Chọn ngân hàng --" />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingBanks ? (
                            <SelectItem value="loading" disabled>
                              <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                              Đang tải...
                            </SelectItem>
                          ) : banks.length > 0 ? (
                            banks.map((bank) => (
                              <SelectItem key={bank.bin} value={bank.bin}>
                                {bank.code} - {bank.shortName}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-banks" disabled>
                              Không có dữ liệu ngân hàng
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Chọn ngân hàng bạn sử dụng
                      </p>
                    </div>

                    {/* Số tài khoản */}
                    <div className="space-y-2">
                      <Label htmlFor="account_no">Số tài khoản</Label>
                      <Input
                        id="account_no"
                        value={ownerForm.account_no}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ''); // Chỉ giữ số
                          setOwnerForm({ ...ownerForm, account_no: value });
                        }}
                        placeholder="0123456789"
                        maxLength={20}
                      />
                      <p className="text-xs text-muted-foreground">
                        Chỉ nhập số, từ 6-20 ký tự
                      </p>
                    </div>

                    {/* Tên chủ tài khoản */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="account_name">Tên chủ tài khoản</Label>
                      <Input
                        id="account_name"
                        value={ownerForm.account_name}
                        onChange={(e) => {
                          // Auto convert to uppercase and remove diacritics
                          const value = e.target.value
                            .toUpperCase()
                            .normalize('NFD')
                            .replace(/[\u0300-\u036f]/g, '')
                            .replace(/[^A-Z\s]/g, '');
                          setOwnerForm({ ...ownerForm, account_name: value });
                        }}
                        placeholder="NGUYEN VAN A"
                        maxLength={255}
                      />
                      <p className="text-xs text-muted-foreground">
                        ⚠️ Viết HOA không dấu, giống trên thẻ ATM/ngân hàng (VD: NGUYEN VAN A)
                      </p>
                    </div>
                  </div>

                  {/* Hiển thị bank đã chọn */}
                  {ownerForm.bank_id && banks.length > 0 && (() => {
                    const selectedBank = banks.find(b => b.bin === ownerForm.bank_id);
                    if (selectedBank) {
                      return (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                          <img 
                            src={selectedBank.logo} 
                            alt={selectedBank.code}
                            className="w-10 h-10 object-contain"
                          />
                          <div>
                            <p className="font-semibold">{selectedBank.name}</p>
                            <p className="text-sm text-muted-foreground">{selectedBank.shortName}</p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </CardContent>
              </Card>

              {/* QR Code Upload Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    QR Code Thanh Toán
                  </CardTitle>
                  <CardDescription>
                    Upload mã QR để khách hàng chuyển khoản thanh toán giải đấu
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ImageUpload
                    value={qrCodeUrl || undefined}
                    onChange={handleQRUpload}
                    bucket="image"
                    folder="owner-qr-codes"
                    maxSize={5}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Tải lên mã QR thanh toán (PNG, JPG - tối đa 5MB)
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={saving} size="lg">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                'Lưu thay đổi'
              )}
            </Button>
          </div>
        </form>
      </div>
      </main>
      <Footer />
    </div>
  );
}
