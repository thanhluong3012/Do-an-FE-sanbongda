import { useEffect, useState } from 'react';
import RoleBasedLayout from '@/components/layout/RoleBasedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Plus } from 'lucide-react';

const OwnerFields = () => {
  return (
    <RoleBasedLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản Lý Sân</h1>
            <p className="text-gray-500 mt-1">Danh sách sân bóng của bạn</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Thêm Sân
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Danh Sách Sân</CardTitle>
            <CardDescription>Quản lý thông tin sân bóng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có dữ liệu</h3>
              <p className="text-gray-500">Hiện tại chưa có API quản lý sân</p>
              <p className="text-sm text-gray-400 mt-1">API endpoint: GET /api/fields</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleBasedLayout>
  );
};

export default OwnerFields;
