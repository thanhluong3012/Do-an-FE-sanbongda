import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Bell, Lock, Mail, Globe, Save } from 'lucide-react';

const AdminSettings = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cài đặt</h1>
          <p className="text-gray-500 mt-1">Quản lý cài đặt hệ thống</p>
        </div>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              <CardTitle>Cài đặt chung</CardTitle>
            </div>
            <CardDescription>Cấu hình thông tin cơ bản của hệ thống</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="siteName">Tên website</Label>
              <Input id="siteName" defaultValue="Hệ thống đặt sân bóng" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="siteDescription">Mô tả</Label>
              <Input id="siteDescription" defaultValue="Nền tảng đặt sân bóng trực tuyến" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactEmail">Email liên hệ</Label>
              <Input id="contactEmail" type="email" defaultValue="contact@example.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phoneNumber">Số điện thoại</Label>
              <Input id="phoneNumber" defaultValue="0123456789" />
            </div>
            <Button className="w-fit">
              <Save className="h-4 w-4 mr-2" />
              Lưu thay đổi
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Thông báo</CardTitle>
            </div>
            <CardDescription>Quản lý các thông báo của hệ thống</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email thông báo booking mới</Label>
                <p className="text-sm text-gray-500">Gửi email khi có booking mới</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email xác nhận thanh toán</Label>
                <p className="text-sm text-gray-500">Gửi email xác nhận sau khi thanh toán</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email nhắc nhở</Label>
                <p className="text-sm text-gray-500">Gửi email nhắc nhở trước giờ đặt sân 24h</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Thông báo user mới</Label>
                <p className="text-sm text-gray-500">Nhận thông báo khi có user đăng ký mới</p>
              </div>
              <Switch />
            </div>
            <Button className="w-fit">
              <Save className="h-4 w-4 mr-2" />
              Lưu thay đổi
            </Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              <CardTitle>Bảo mật</CardTitle>
            </div>
            <CardDescription>Cài đặt bảo mật cho hệ thống</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Xác thực 2 lớp (2FA)</Label>
                <p className="text-sm text-gray-500">Yêu cầu xác thực 2 lớp cho admin</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Đăng nhập nhiều thiết bị</Label>
                <p className="text-sm text-gray-500">Cho phép đăng nhập trên nhiều thiết bị</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="grid gap-2">
              <Label htmlFor="sessionTimeout">Thời gian timeout phiên (phút)</Label>
              <Input id="sessionTimeout" type="number" defaultValue="30" />
            </div>
            <Button className="w-fit">
              <Save className="h-4 w-4 mr-2" />
              Lưu thay đổi
            </Button>
          </CardContent>
        </Card>

        {/* Booking Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Cài đặt Booking</CardTitle>
            <CardDescription>Cấu hình các tùy chọn đặt sân</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="minBookingTime">Thời gian đặt sân tối thiểu (giờ)</Label>
              <Input id="minBookingTime" type="number" defaultValue="2" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="maxAdvanceBooking">Số ngày đặt trước tối đa</Label>
              <Input id="maxAdvanceBooking" type="number" defaultValue="30" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cancellationDeadline">Thời hạn hủy booking (giờ trước giờ đá)</Label>
              <Input id="cancellationDeadline" type="number" defaultValue="24" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Tự động xác nhận booking</Label>
                <p className="text-sm text-gray-500">Booking sẽ được tự động xác nhận sau khi thanh toán</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Button className="w-fit">
              <Save className="h-4 w-4 mr-2" />
              Lưu thay đổi
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
