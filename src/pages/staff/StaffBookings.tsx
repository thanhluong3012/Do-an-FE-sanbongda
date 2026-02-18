import RoleBasedLayout from '@/components/layout/RoleBasedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

const StaffBookings = () => {
  return (
    <RoleBasedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản Lý Booking</h1>
          <p className="text-gray-500 mt-1">Xem và xử lý đặt sân</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Danh Sách Booking</CardTitle>
            <CardDescription>Quản lý đặt sân của khách hàng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có dữ liệu</h3>
              <p className="text-gray-500">Hiện tại chưa có API quản lý booking</p>
              <p className="text-sm text-gray-400 mt-1">API endpoint: GET /api/bookings</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleBasedLayout>
  );
};

export default StaffBookings;
