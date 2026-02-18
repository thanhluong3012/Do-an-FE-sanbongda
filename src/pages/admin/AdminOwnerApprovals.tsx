import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle, XCircle, Eye, Phone, Mail, Building2, FileText, Calendar } from 'lucide-react';

interface OwnerRequest {
  id: number;
  user_id: number;
  business_name: string;
  business_license_url: string;
  id_card_number: string;
  phone: string;
  email: string;
  address: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user?: {
    name: string;
    email: string;
  };
}

const AdminOwnerApprovals = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<OwnerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<OwnerRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      // const response = await api.get('/admin/owner-requests');
      // setRequests(response.data);
      
      // Demo data
      setRequests([
        {
          id: 1,
          user_id: 10,
          business_name: 'Sân bóng ABC',
          business_license_url: '/demo/license.jpg',
          id_card_number: '123456789',
          phone: '0901234567',
          email: 'ownerabc@example.com',
          address: '123 Đường ABC, Quận 1, TP.HCM',
          status: 'pending',
          created_at: '2026-02-05T10:00:00Z',
          user: {
            name: 'Nguyễn Văn A',
            email: 'ownerabc@example.com',
          },
        },
        {
          id: 2,
          user_id: 11,
          business_name: 'Sân bóng XYZ',
          business_license_url: '/demo/license2.jpg',
          id_card_number: '987654321',
          phone: '0907654321',
          email: 'ownerxyz@example.com',
          address: '456 Đường XYZ, Quận 3, TP.HCM',
          status: 'pending',
          created_at: '2026-02-06T14:30:00Z',
          user: {
            name: 'Trần Thị B',
            email: 'ownerxyz@example.com',
          },
        },
      ]);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách yêu cầu',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      // await api.post(`/admin/owner-requests/${id}/approve`);
      toast({
        title: 'Thành công',
        description: 'Đã duyệt yêu cầu đăng ký chủ sân',
      });
      fetchRequests();
      setDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể duyệt yêu cầu',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (id: number) => {
    try {
      // await api.post(`/admin/owner-requests/${id}/reject`);
      toast({
        title: 'Thành công',
        description: 'Đã từ chối yêu cầu đăng ký chủ sân',
      });
      fetchRequests();
      setDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể từ chối yêu cầu',
        variant: 'destructive',
      });
    }
  };

  const viewDetails = (request: OwnerRequest) => {
    setSelectedRequest(request);
    setDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Chờ duyệt</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Đã duyệt</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Đã từ chối</Badge>;
      default:
        return <Badge variant="outline">Không xác định</Badge>;
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Duyệt Chủ Sân</h1>
            <p className="text-gray-500 mt-1">
              Quản lý yêu cầu đăng ký từ chủ sân bóng
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-orange-600">{pendingCount}</div>
            <div className="text-sm text-gray-500">Yêu cầu chờ duyệt</div>
          </div>
        </div>

        {/* Requests List */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách yêu cầu</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Đang tải...</div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Không có yêu cầu nào
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{request.business_name}</h3>
                          {getStatusBadge(request.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            <span>{request.user?.name || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span>{request.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <span>{request.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(request.created_at).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-500 mt-2">{request.address}</p>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewDetails(request)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Xem chi tiết
                        </Button>
                        {request.status === 'pending' && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApprove(request.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Duyệt
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleReject(request.id)}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Từ chối
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Chi tiết yêu cầu đăng ký</DialogTitle>
              <DialogDescription>
                Thông tin chi tiết về yêu cầu đăng ký chủ sân
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Tên doanh nghiệp</label>
                    <p className="text-gray-700">{selectedRequest.business_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Người đại diện</label>
                    <p className="text-gray-700">{selectedRequest.user?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-gray-700">{selectedRequest.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Số điện thoại</label>
                    <p className="text-gray-700">{selectedRequest.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">CMND/CCCD</label>
                    <p className="text-gray-700">{selectedRequest.id_card_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Trạng thái</label>
                    <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium">Địa chỉ</label>
                    <p className="text-gray-700">{selectedRequest.address}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium">Giấy phép kinh doanh</label>
                    <div className="mt-2 border rounded-lg p-2">
                      <img 
                        src={selectedRequest.business_license_url} 
                        alt="Business License"
                        className="max-w-full h-auto rounded"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Business+License';
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                {selectedRequest.status === 'pending' && (
                  <div className="flex gap-3 justify-end pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Đóng
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleReject(selectedRequest.id)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Từ chối
                    </Button>
                    <Button
                      variant="default"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(selectedRequest.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Duyệt
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminOwnerApprovals;
