import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  type OwnerRegistration,
  getOwnerRegistrations,
  getOwnerRegistration,
  approveOwnerRegistration,
  rejectOwnerRegistration,
  deleteOwnerRegistration,
} from '@/services/ownerRegistrationService';
import { supabase } from '@/integrations/supabase/client';
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
  user_id?: number;
  image_code?: string;
  code_id?: string;
  business_name?: string;
  business_license?: string;
  business_license_url?: string;
  businessLicenseImage?: string;
  business_license_image?: string;
  id_card_number?: string;
  phone?: string;
  email: string;
  address?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  rejected_reason?: string;
  rejection_reason?: string;
  full_name?: string;
  name?: string;
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
  const [actionLoading, setActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const normalizeResponseData = <T,>(response: any): T => {
    return (response?.data ?? response) as T;
  };

  const resolveBusinessLicenseUrl = (request: OwnerRequest): string => {
    const raw =
      request.image_code ||
      request.business_license_url ||
      request.business_license ||
      request.businessLicenseImage ||
      request.business_license_image ||
      '';

    if (!raw) {
      return 'https://via.placeholder.com/400x300?text=Business+License';
    }

    if (/^(https?:|data:|blob:)/i.test(raw)) {
      return raw;
    }

    if (raw.startsWith('/storage/v1/object/public/')) {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      return `${supabaseUrl}${raw}`;
    }

    const normalizedPath = raw.replace(/^\/+/, '');

    const { data: imageBucket } = supabase.storage
      .from('image')
      .getPublicUrl(normalizedPath);

    return imageBucket.publicUrl;
  };

  const mapRegistrationToRequest = (item: OwnerRegistration): OwnerRequest => {
    const runtimeItem = item as OwnerRegistration & {
      businessLicenseImage?: string;
      business_license_image?: string;
      license_image?: string;
      license_url?: string;
    };

    return {
      ...item,
      id: item.id,
      email: item.email,
      status: item.status,
      created_at: item.created_at,
      phone: item.phone,
      address: item.address,
      business_name: item.business_name,
      image_code: item.image_code,
      code_id: item.code_id,
      business_license: item.business_license,
      business_license_url: item.business_license_url,
      businessLicenseImage: runtimeItem.businessLicenseImage,
      business_license_image: runtimeItem.business_license_image || runtimeItem.license_image || runtimeItem.license_url,
      id_card_number: item.id_card_number,
      full_name: item.full_name,
      name: item.name,
      rejected_reason: item.rejected_reason,
      rejection_reason: item.rejection_reason,
    };
  };

  useEffect(() => {
    fetchRequests(statusFilter === 'all' ? undefined : statusFilter);
  }, [statusFilter]);

  const fetchRequests = async (status?: 'pending' | 'approved' | 'rejected') => {
    try {
      setLoading(true);
      const response = await getOwnerRegistrations(status);
      const data = normalizeResponseData<OwnerRegistration[]>(response);
      const list = Array.isArray(data) ? data : [];
      setRequests(list.map(mapRegistrationToRequest));
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
      setActionLoading(true);
      const response = await approveOwnerRegistration(id);
      const responseData = normalizeResponseData<{ message?: string }>(response);
      toast({
        title: 'Thành công',
        description: responseData?.message || 'Đã duyệt yêu cầu đăng ký chủ sân',
      });
      await fetchRequests(statusFilter === 'all' ? undefined : statusFilter);
      setDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error?.response?.data?.message || 'Không thể duyệt yêu cầu. Vui lòng kiểm tra token admin.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: number) => {
    try {
      const reason = window.prompt('Nhập lý do từ chối:', 'Thiếu hồ sơ xác thực')?.trim();
      if (!reason) {
        return;
      }

      setActionLoading(true);
      const response = await rejectOwnerRegistration(id, reason);
      const responseData = normalizeResponseData<{ message?: string }>(response);
      toast({
        title: 'Thành công',
        description: responseData?.message || 'Đã từ chối yêu cầu đăng ký chủ sân',
      });
      await fetchRequests(statusFilter === 'all' ? undefined : statusFilter);
      setDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error?.response?.data?.message || 'Không thể từ chối yêu cầu',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm('Bạn có chắc muốn xóa yêu cầu đăng ký này?');
    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await deleteOwnerRegistration(id);
      const responseData = normalizeResponseData<{ message?: string }>(response);
      toast({
        title: 'Thành công',
        description: responseData?.message || 'Đã xóa yêu cầu đăng ký',
      });
      await fetchRequests(statusFilter === 'all' ? undefined : statusFilter);
      setDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error?.response?.data?.message || 'Không thể xóa yêu cầu',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const viewDetails = async (request: OwnerRequest) => {
    try {
      setActionLoading(true);
      const response = await getOwnerRegistration(request.id);
      const data = normalizeResponseData<OwnerRegistration>(response);
      setSelectedRequest(mapRegistrationToRequest(data));
      setDialogOpen(true);
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải chi tiết yêu cầu',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
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
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle>Danh sách yêu cầu</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={statusFilter === 'pending' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('pending')}
                >
                  Chờ duyệt
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'approved' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('approved')}
                >
                  Đã duyệt
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('rejected')}
                >
                  Đã từ chối
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                >
                  Tất cả
                </Button>
              </div>
            </div>
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
                            <span>{request.user?.name || request.full_name || request.name || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span>{request.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <span>{request.phone || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(request.created_at).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-500 mt-2">{request.address || 'N/A'}</p>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewDetails(request)}
                          disabled={actionLoading}
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
                              disabled={actionLoading}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Duyệt
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleReject(request.id)}
                              disabled={actionLoading}
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
          <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
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
                    <p className="text-gray-700">{selectedRequest.business_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Người đại diện</label>
                    <p className="text-gray-700">{selectedRequest.user?.name || selectedRequest.full_name || selectedRequest.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-gray-700">{selectedRequest.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Số điện thoại</label>
                    <p className="text-gray-700">{selectedRequest.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">CMND/CCCD</label>
                    <p className="text-gray-700">{selectedRequest.id_card_number || selectedRequest.code_id || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Trạng thái</label>
                    <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium">Địa chỉ</label>
                    <p className="text-gray-700">{selectedRequest.address || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium">Lý do từ chối</label>
                    <p className="text-gray-700">{selectedRequest.rejected_reason || selectedRequest.rejection_reason || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium">Giấy phép kinh doanh</label>
                    <div className="mt-2 rounded-lg border bg-muted/30 p-3 space-y-3">
                      <div className="w-full max-h-[240px] overflow-hidden rounded-md border bg-background flex items-center justify-center">
                        <img 
                          src={resolveBusinessLicenseUrl(selectedRequest)} 
                          alt="Business License"
                          loading="lazy"
                          decoding="async"
                          className="w-full max-h-[240px] object-contain"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Business+License';
                          }}
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(resolveBusinessLicenseUrl(selectedRequest), '_blank', 'noopener,noreferrer')}
                        >
                          Mở ảnh đầy đủ
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {selectedRequest.status === 'pending' && (
                  <div className="flex gap-3 justify-end pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      disabled={actionLoading}
                    >
                      Đóng
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDelete(selectedRequest.id)}
                      disabled={actionLoading}
                    >
                      Xóa
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleReject(selectedRequest.id)}
                      disabled={actionLoading}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Từ chối
                    </Button>
                    <Button
                      variant="default"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(selectedRequest.id)}
                      disabled={actionLoading}
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
