import { useEffect, useState } from 'react';
import { useAuth, ROLES } from '@/hooks/useAuth';
import RoleBasedLayout from '@/components/layout/RoleBasedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Mail, Phone, Lock, Upload, Image as ImageIcon } from 'lucide-react';
import { getCurrentUser, updateProfile, type UpdateProfileData } from '@/services/userService';
import { updateOwnerProfile, uploadQRCode, getQRCode, type UpdateOwnerProfileData } from '@/services/ownerService';

export default function Profile() {
  const { user: authUser, isOwner } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingQR, setUploadingQR] = useState(false);

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
  });

  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

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

  const handleQRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn file ảnh',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploadingQR(true);

      // Preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload
      const response = await uploadQRCode(file);
      setQrCodeUrl(response.data.qr_code_url);

      toast({
        title: 'Thành công',
        description: 'Đã upload QR code',
      });
    } catch (error: any) {
      console.error('Error uploading QR:', error);
      toast({
        title: 'Lỗi',
        description: error?.response?.data?.message || 'Không thể upload QR code',
        variant: 'destructive',
      });
    } finally {
      setUploadingQR(false);
    }
  };

  if (loading) {
    return (
      <RoleBasedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </RoleBasedLayout>
    );
  }

  return (
    <RoleBasedLayout>
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
                  <div className="space-y-4">
                    {(qrCodeUrl || qrPreview) && (
                      <div className="flex justify-center">
                        <div className="border-2 border-dashed rounded-lg p-4">
                          <img
                            src={qrPreview || qrCodeUrl || ''}
                            alt="QR Code"
                            className="w-64 h-64 object-contain"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      <Label
                        htmlFor="qr_upload"
                        className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                      >
                        {uploadingQR ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Đang upload...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            {qrCodeUrl ? 'Thay đổi QR Code' : 'Upload QR Code'}
                          </>
                        )}
                      </Label>
                      <Input
                        id="qr_upload"
                        type="file"
                        accept="image/*"
                        onChange={handleQRUpload}
                        className="hidden"
                        disabled={uploadingQR}
                      />
                      <p className="text-sm text-gray-500">
                        Chọn ảnh QR code (PNG, JPG)
                      </p>
                    </div>
                  </div>
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
    </RoleBasedLayout>
  );
}
