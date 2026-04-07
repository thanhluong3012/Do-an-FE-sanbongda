import { useEffect, useState } from 'react';
import RoleBasedLayout from '@/components/layout/RoleBasedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  Plus, 
  Edit, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  MapPin,
  Clock,
  DollarSign,
  Settings,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  fieldComplexService,
  type FieldComplex,
  type SubField,
  type FieldHourlyPrice,
} from '@/services/fieldComplexService';
import {
  tournamentSessionPriceService,
  type TournamentSessionPrice,
} from '@/services/tournamentSessionPriceService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const OwnerFields = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [fieldClusters, setFieldClusters] = useState<FieldComplex[]>([]);
  const [expandedCluster, setExpandedCluster] = useState<number | null>(null);
  const [clusterFields, setClusterFields] = useState<{ [key: number]: SubField[] }>({});
  const [clusterPrices, setClusterPrices] = useState<{ [key: number]: FieldHourlyPrice[] }>({});
  const [clusterTournamentPrices, setClusterTournamentPrices] = useState<{ [key: number]: TournamentSessionPrice[] }>({});
  
  // Dialog states
  const [clusterDialog, setClusterDialog] = useState(false);
  const [fieldDialog, setFieldDialog] = useState(false);
  const [priceDialog, setPriceDialog] = useState(false);
  const [tournamentPriceDialog, setTournamentPriceDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: string; id: number; clusterId?: number }>({ 
    open: false, 
    type: '', 
    id: 0 
  });
  
  // Form states
  const [editingCluster, setEditingCluster] = useState<FieldComplex | null>(null);
  const [editingField, setEditingField] = useState<SubField | null>(null);
  const [editingPrice, setEditingPrice] = useState<FieldHourlyPrice | null>(null);
  const [editingTournamentPrice, setEditingTournamentPrice] = useState<TournamentSessionPrice | null>(null);
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(null);
  
  // Cluster form
  const [clusterForm, setClusterForm] = useState({
    name: '',
    address: '',
    district: '',
    city: 'TP.HCM',
    phone: '',
    email: '',
    description: '',
    open_time: '06:00',
    close_time: '23:00',
    status: 'active',
  });
  
  // Field form
  const [fieldForm, setFieldForm] = useState({
    field_type: '5v5' as '5v5' | '7v7' | '11v11',
    status: 'available' as 'available' | 'maintenance',
  });
  
  // Price form
  const [priceForm, setPriceForm] = useState({
    field_type: '5v5' as '5v5' | '7v7' | '11v11',
    day_type: 'weekday' as 'weekday' | 'weekend',
    price_hour: 0,
  });

  // Tournament price form
  const [tournamentPriceForm, setTournamentPriceForm] = useState({
    field_type: '5v5' as '5v5' | '7v7' | '11v11',
    day_type: 'weekday' as 'weekday' | 'weekend',
    session_type: 'morning' as 'morning' | 'afternoon' | 'evening' | 'full_day',
    price_per_session: 0,
  });

  useEffect(() => {
    loadFieldClusters();
  }, []);

  const loadFieldClusters = async () => {
    try {
      setLoading(true);
      const data = await fieldComplexService.getOwnerFieldClusters();
      const clusters = Array.isArray(data) ? data : [];
      setFieldClusters(clusters);
    } catch (error: any) {
      console.error('Error loading field clusters:', error);
      toast({
        title: 'Lỗi',
        description: error?.response?.data?.message || 'Không thể tải danh sách cụm sân',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadClusterDetails = async (clusterId: number) => {
    try {
      // Load fields
      const fields = await fieldComplexService.getFieldsByClusterId(clusterId);
      setClusterFields(prev => ({ ...prev, [clusterId]: Array.isArray(fields) ? fields : [] }));
      
      // Load hourly prices
      const prices = await fieldComplexService.getFieldClusterPrices(clusterId);
      setClusterPrices(prev => ({ ...prev, [clusterId]: Array.isArray(prices) ? prices : [] }));
      
      // Load tournament session prices
      const tournamentPrices = await tournamentSessionPriceService.getByClusterId(clusterId);
      setClusterTournamentPrices(prev => ({ ...prev, [clusterId]: Array.isArray(tournamentPrices) ? tournamentPrices : [] }));
    } catch (error: any) {
      console.error('Error loading cluster details:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải chi tiết cụm sân',
        variant: 'destructive',
      });
    }
  };

  const toggleCluster = (clusterId: number) => {
    if (expandedCluster === clusterId) {
      setExpandedCluster(null);
    } else {
      setExpandedCluster(clusterId);
      if (!clusterFields[clusterId]) {
        loadClusterDetails(clusterId);
      }
    }
  };

  // Cluster CRUD
  const handleOpenClusterDialog = (cluster?: FieldComplex) => {
    if (cluster) {
      setEditingCluster(cluster);
      setClusterForm({
        name: cluster.name || '',
        address: cluster.address || '',
        district: cluster.district || '',
        city: cluster.city || 'TP.HCM',
        phone: cluster.phone || '',
        email: cluster.email || '',
        description: cluster.description || '',
        open_time: cluster.open_time?.substring(0, 5) || '06:00',
        close_time: cluster.close_time?.substring(0, 5) || '23:00',
        status: cluster.status || 'active',
      });
    } else {
      setEditingCluster(null);
      setClusterForm({
        name: '',
        address: '',
        district: '',
        city: 'TP.HCM',
        phone: '',
        email: '',
        description: '',
        open_time: '06:00',
        close_time: '23:00',
        status: 'active',
      });
    }
    setClusterDialog(true);
  };

  const handleSaveCluster = async () => {
    try {
      if (!clusterForm.name || !clusterForm.address) {
        toast({
          title: 'Lỗi',
          description: 'Vui lòng nhập tên và địa chỉ cụm sân',
          variant: 'destructive',
        });
        return;
      }

      // Validate giờ mở/đóng cửa
      const openMinutes = parseInt(clusterForm.open_time.split(':')[0]) * 60 + parseInt(clusterForm.open_time.split(':')[1]);
      const closeMinutes = parseInt(clusterForm.close_time.split(':')[0]) * 60 + parseInt(clusterForm.close_time.split(':')[1]);
      
      if (openMinutes >= closeMinutes) {
        toast({
          title: 'Lỗi',
          description: 'Giờ đóng cửa phải sau giờ mở cửa',
          variant: 'destructive',
        });
        return;
      }

      const data = {
        ...clusterForm,
        open_time: `${clusterForm.open_time}:00`,
        close_time: `${clusterForm.close_time}:00`,
      };

      if (editingCluster) {
        await fieldComplexService.updateFieldCluster(editingCluster.id, data);
        const timeChanged = editingCluster.open_time !== data.open_time || editingCluster.close_time !== data.close_time;
        toast({ 
          title: 'Thành công', 
          description: timeChanged 
            ? `Đã cập nhật giờ mở cửa: ${clusterForm.open_time} - ${clusterForm.close_time}`
            : 'Đã cập nhật cụm sân' 
        });
      } else {
        await fieldComplexService.createFieldCluster(data);
        toast({ title: 'Thành công', description: 'Đã tạo cụm sân mới' });
      }
      
      setClusterDialog(false);
      loadFieldClusters();
    } catch (error: any) {
      console.error('Error saving cluster:', error);
      toast({
        title: 'Lỗi',
        description: error?.response?.data?.message || 'Không thể lưu cụm sân',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCluster = async (id: number) => {
    try {
      await fieldComplexService.deleteFieldCluster(id);
      toast({ title: 'Thành công', description: 'Đã xóa cụm sân' });
      loadFieldClusters();
      setDeleteDialog({ open: false, type: '', id: 0 });
    } catch (error: any) {
      console.error('Error deleting cluster:', error);
      toast({
        title: 'Lỗi',
        description: error?.response?.data?.message || 'Không thể xóa cụm sân',
        variant: 'destructive',
      });
    }
  };

  // Field CRUD
  const handleOpenFieldDialog = (clusterId: number, field?: SubField) => {
    setSelectedClusterId(clusterId);
    if (field) {
      setEditingField(field);
      setFieldForm({
        field_type: field.field_type,
        status: field.status,
      });
    } else {
      setEditingField(null);
      setFieldForm({
        field_type: '5v5',
        status: 'available',
      });
    }
    setFieldDialog(true);
  };

  const handleSaveField = async () => {
    try {
      if (!selectedClusterId) return;

      // Check nếu loại sân này chưa có giá (khi tạo mới)
      if (!editingField) {
        const prices = clusterPrices[selectedClusterId] || [];
        const hasWeekdayPrice = prices.some(
          p => p.field_type === fieldForm.field_type && p.day_type === 'weekday'
        );
        const hasWeekendPrice = prices.some(
          p => p.field_type === fieldForm.field_type && p.day_type === 'weekend'
        );

        if (!hasWeekdayPrice || !hasWeekendPrice) {
          toast({
            title: '⚠️ Chưa có cấu hình giá',
            description: `Sân ${fieldForm.field_type.toUpperCase()} chưa có giá ${!hasWeekdayPrice ? 'ngày thường' : ''} ${!hasWeekdayPrice && !hasWeekendPrice ? 'và' : ''} ${!hasWeekendPrice ? 'cuối tuần' : ''}. Vui lòng cấu hình giá sau khi tạo sân.`,
            variant: 'default',
          });
        }
      }

      const data = {
        ...fieldForm,
        field_cluster_id: selectedClusterId,
      };

      if (editingField) {
        await fieldComplexService.updateField(editingField.id, data);
        toast({ 
          title: 'Thành công', 
          description: fieldForm.status === 'maintenance' 
            ? 'Đã chuyển sân sang chế độ bảo trì. Sân này sẽ không hiển thị để đặt.' 
            : 'Đã cập nhật sân. Sân đã sẵn sàng để đặt chỗ.'
        });
      } else {
        await fieldComplexService.createField(data);
        toast({ 
          title: 'Thành công', 
          description: fieldForm.status === 'available' 
            ? 'Đã thêm sân mới. Sân đã sẵn sàng để đặt chỗ.' 
            : 'Đã thêm sân mới ở chế độ bảo trì.'
        });
      }
      
      setFieldDialog(false);
      loadClusterDetails(selectedClusterId);
    } catch (error: any) {
      console.error('Error saving field:', error);
      toast({
        title: 'Lỗi',
        description: error?.response?.data?.message || 'Không thể lưu sân',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteField = async (id: number, clusterId: number) => {
    try {
      await fieldComplexService.deleteField(id);
      toast({ title: 'Thành công', description: 'Đã xóa sân' });
      loadClusterDetails(clusterId);
      setDeleteDialog({ open: false, type: '', id: 0 });
    } catch (error: any) {
      console.error('Error deleting field:', error);
      toast({
        title: 'Lỗi',
        description: error?.response?.data?.message || 'Không thể xóa sân',
        variant: 'destructive',
      });
    }
  };

  // Price CRUD
  const handleOpenPriceDialog = (clusterId: number, price?: FieldHourlyPrice) => {
    setSelectedClusterId(clusterId);
    if (price) {
      setEditingPrice(price);
      setPriceForm({
        field_type: price.field_type,
        day_type: price.day_type,
        price_hour: price.price_hour,
      });
    } else {
      setEditingPrice(null);
      setPriceForm({
        field_type: '5v5',
        day_type: 'weekday',
        price_hour: 0,
      });
    }
    setPriceDialog(true);
  };

  const handleSavePrice = async () => {
    try {
      if (!selectedClusterId) return;

      // Validation
      if (priceForm.price_hour <= 0) {
        toast({
          title: 'Lỗi',
          description: 'Giá phải lớn hơn 0 VNĐ',
          variant: 'destructive',
        });
        return;
      }

      // Check duplicate (nếu không phải đang edit)
      if (!editingPrice && clusterPrices[selectedClusterId]) {
        const isDuplicate = clusterPrices[selectedClusterId].some(
          p => p.field_type === priceForm.field_type && p.day_type === priceForm.day_type
        );
        
        if (isDuplicate) {
          toast({
            title: 'Lỗi',
            description: `Đã có giá cho Sân ${priceForm.field_type.toUpperCase()} - ${priceForm.day_type === 'weekday' ? 'Ngày thường' : 'Cuối tuần'}. Vui lòng chỉnh sửa giá hiện tại.`,
            variant: 'destructive',
          });
          return;
        }
      }

      const data = {
        ...priceForm,
        field_cluster_id: selectedClusterId,
      };

      if (editingPrice) {
        await fieldComplexService.updateHourlyPrice(editingPrice.id, data);
        toast({ title: 'Thành công', description: 'Đã cập nhật giá' });
      } else {
        await fieldComplexService.createHourlyPrice(data);
        toast({ title: 'Thành công', description: 'Đã thêm cấu hình giá mới' });
      }
      
      setPriceDialog(false);
      loadClusterDetails(selectedClusterId);
    } catch (error: any) {
      console.error('Error saving price:', error);
      toast({
        title: 'Lỗi',
        description: error?.response?.data?.message || 'Không thể lưu giá',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePrice = async (id: number, clusterId: number) => {
    try {
      await fieldComplexService.deleteHourlyPrice(id);
      toast({ title: 'Thành công', description: 'Đã xóa cấu hình giá' });
      loadClusterDetails(clusterId);
      setDeleteDialog({ open: false, type: '', id: 0 });
    } catch (error: any) {
      console.error('Error deleting price:', error);
      toast({
        title: 'Lỗi',
        description: error?.response?.data?.message || 'Không thể xóa giá',
        variant: 'destructive',
      });
    }
  };

  // Tournament Price CRUD
  const handleOpenTournamentPriceDialog = (clusterId: number, price?: TournamentSessionPrice) => {
    setSelectedClusterId(clusterId);
    if (price) {
      setEditingTournamentPrice(price);
      setTournamentPriceForm({
        field_type: price.field_type,
        day_type: price.day_type,
        session_type: price.session_type,
        price_per_session: price.price_per_session,
      });
    } else {
      setEditingTournamentPrice(null);
      setTournamentPriceForm({
        field_type: '5v5',
        day_type: 'weekday',
        session_type: 'morning',
        price_per_session: 0,
      });
    }
    setTournamentPriceDialog(true);
  };

  const handleSaveTournamentPrice = async () => {
    try {
      if (!selectedClusterId) return;

      if (tournamentPriceForm.price_per_session <= 0) {
        toast({
          title: 'Lỗi',
          description: 'Giá phải lớn hơn 0 VNĐ',
          variant: 'destructive',
        });
        return;
      }

      // Check duplicate
      if (!editingTournamentPrice && clusterTournamentPrices[selectedClusterId]) {
        const isDuplicate = clusterTournamentPrices[selectedClusterId].some(
          p => p.field_type === tournamentPriceForm.field_type && 
               p.day_type === tournamentPriceForm.day_type &&
               p.session_type === tournamentPriceForm.session_type
        );
        
        if (isDuplicate) {
          toast({
            title: 'Lỗi',
            description: 'Giá này đã tồn tại. Vui lòng chỉnh sửa giá hiện có.',
            variant: 'destructive',
          });
          return;
        }
      }

      const data = {
        ...tournamentPriceForm,
        field_cluster_id: selectedClusterId,
      };

      if (editingTournamentPrice) {
        await tournamentSessionPriceService.update(editingTournamentPrice.id, data);
        toast({ title: 'Thành công', description: 'Đã cập nhật giá giải đấu' });
      } else {
        console.log('Creating tournament price with data:', data);
        const response = await tournamentSessionPriceService.create(data);
        console.log('Create response:', response);
        toast({ title: 'Thành công', description: 'Đã thêm giá giải đấu' });
      }

      setTournamentPriceDialog(false);
      loadClusterDetails(selectedClusterId);
    } catch (error: any) {
      console.error('Error saving tournament price:', error);
      console.error('Error response:', error?.response);
      console.error('Error data:', error?.response?.data);
      console.error('Error message:', error?.response?.data?.message);
      console.error('Error errors:', JSON.stringify(error?.response?.data?.errors, null, 2));
      console.error('Full error object:', JSON.stringify(error, null, 2));
      
      // Show detailed validation errors
      let errorMessage = error?.response?.data?.message || 'Không thể lưu giá giải đấu';
      if (error?.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorDetails = Object.keys(errors).map(key => `${key}: ${errors[key]}`).join(', ');
        errorMessage = `${errorMessage} - ${errorDetails}`;
      }
      
      toast({
        title: 'Lỗi',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTournamentPrice = async (id: number, clusterId: number) => {
    try {
      await tournamentSessionPriceService.delete(id);
      toast({ title: 'Thành công', description: 'Đã xóa giá giải đấu' });
      loadClusterDetails(clusterId);
      setDeleteDialog({ open: false, type: '', id: 0 });
    } catch (error: any) {
      console.error('Error deleting tournament price:', error);
      toast({
        title: 'Lỗi',
        description: error?.response?.data?.message || 'Không thể xóa giá giải đấu',
        variant: 'destructive',
      });
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản Lý Cụm Sân</h1>
            <p className="text-gray-500 mt-1">Quản lý cụm sân và các sân con</p>
          </div>
          <Button onClick={() => handleOpenClusterDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm Cụm Sân
          </Button>
        </div>

        {fieldClusters.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có cụm sân</h3>
                <p className="text-gray-500 mb-4">Tạo cụm sân đầu tiên để bắt đầu quản lý</p>
                <Button onClick={() => handleOpenClusterDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm Cụm Sân
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {fieldClusters.map((cluster) => (
              <Card key={cluster.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-xl">{cluster.name}</CardTitle>
                        <Badge variant={cluster.status === 'active' ? 'default' : 'secondary'}>
                          {cluster.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{cluster.address}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{cluster.open_time?.substring(0, 5)} - {cluster.close_time?.substring(0, 5)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenClusterDialog(cluster)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteDialog({ open: true, type: 'cluster', id: cluster.id })}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleCluster(cluster.id)}
                      >
                        {expandedCluster === cluster.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {expandedCluster === cluster.id && (
                  <CardContent className="border-t pt-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Fields Section */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-lg">Danh Sách Sân</h3>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenFieldDialog(cluster.id)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Thêm Sân
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {!clusterFields[cluster.id] || clusterFields[cluster.id].length === 0 ? (
                            <div className="text-center py-6 text-gray-500 text-sm">
                              Chưa có sân nào
                            </div>
                          ) : (
                            clusterFields[cluster.id].map((field, idx) => (
                              <div
                                key={field.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                                    {idx + 1}
                                  </div>
                                  <div>
                                    <div className="font-medium">Sân {field.field_type}</div>
                                    <Badge
                                      variant={field.status === 'available' ? 'default' : 'destructive'}
                                      className="text-xs"
                                    >
                                      {field.status === 'available' ? '✓ Hoạt động' : '🔧 Bảo trì'}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => handleOpenFieldDialog(cluster.id, field)}
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => setDeleteDialog({ 
                                      open: true, 
                                      type: 'field', 
                                      id: field.id,
                                      clusterId: cluster.id 
                                    })}
                                  >
                                    <Trash2 className="w-3 h-3 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Prices Section */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-lg">Bảng Giá</h3>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenPriceDialog(cluster.id)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Thêm Giá
                          </Button>
                        </div>
                        
                        {!clusterPrices[cluster.id] || clusterPrices[cluster.id].length === 0 ? (
                          <div className="text-center py-6 text-gray-500 text-sm">
                            Chưa có cấu hình giá
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left py-2 px-3 font-semibold">Loại Sân</th>
                                  <th className="text-right py-2 px-3 font-semibold">Ngày thường</th>
                                  <th className="text-right py-2 px-3 font-semibold">Cuối tuần</th>
                                  <th className="w-20"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {['5v5', '7v7', '11v11'].map((fieldType) => {
                                  const weekdayPrice = clusterPrices[cluster.id]?.find(
                                    p => p.field_type === fieldType && p.day_type === 'weekday'
                                  );
                                  const weekendPrice = clusterPrices[cluster.id]?.find(
                                    p => p.field_type === fieldType && p.day_type === 'weekend'
                                  );
                                  
                                  // Chỉ hiển thị row nếu có ít nhất 1 giá
                                  if (!weekdayPrice && !weekendPrice) return null;
                                  
                                  return (
                                    <tr key={fieldType} className="border-b hover:bg-gray-50">
                                      <td className="py-3 px-3 font-medium">
                                        Sân {fieldType.toUpperCase()}
                                      </td>
                                      <td className="py-3 px-3 text-right">
                                        {weekdayPrice ? (
                                          <div className="flex items-center justify-end gap-2">
                                            <span className="text-green-600 font-semibold">
                                              {Number(weekdayPrice.price_hour).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} ₫
                                            </span>
                                            <div className="flex gap-1">
                                              <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6"
                                                onClick={() => handleOpenPriceDialog(cluster.id, weekdayPrice)}
                                              >
                                                <Edit className="w-3 h-3" />
                                              </Button>
                                              <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6"
                                                onClick={() => setDeleteDialog({ 
                                                  open: true, 
                                                  type: 'price', 
                                                  id: weekdayPrice.id,
                                                  clusterId: cluster.id 
                                                })}
                                              >
                                                <Trash2 className="w-3 h-3 text-destructive" />
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <span className="text-gray-400">Chưa có</span>
                                        )}
                                      </td>
                                      <td className="py-3 px-3 text-right">
                                        {weekendPrice ? (
                                          <div className="flex items-center justify-end gap-2">
                                            <span className="text-green-600 font-semibold">
                                              {Number(weekendPrice.price_hour).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} ₫
                                            </span>
                                            <div className="flex gap-1">
                                              <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6"
                                                onClick={() => handleOpenPriceDialog(cluster.id, weekendPrice)}
                                              >
                                                <Edit className="w-3 h-3" />
                                              </Button>
                                              <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6"
                                                onClick={() => setDeleteDialog({ 
                                                  open: true, 
                                                  type: 'price', 
                                                  id: weekendPrice.id,
                                                  clusterId: cluster.id 
                                                })}
                                              >
                                                <Trash2 className="w-3 h-3 text-destructive" />
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <span className="text-gray-400">Chưa có</span>
                                        )}
                                      </td>
                                      <td></td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Tournament Prices Section - Dưới Bảng Giá */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                              ⚽ Giá Giải Đấu
                              <Badge variant="outline" className="ml-2">Theo buổi</Badge>
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Cấu hình giá cho các buổi thi đấu (Sáng, Chiều, Tối, Cả ngày)
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenTournamentPriceDialog(cluster.id)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Thêm Giá
                          </Button>
                        </div>
                        
                        {!clusterTournamentPrices[cluster.id] || clusterTournamentPrices[cluster.id].length === 0 ? (
                          <div className="text-center py-6 text-gray-500 text-sm">
                            Chưa có cấu hình giá giải đấu
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {['5v5', '7v7', '11v11'].map((fieldType) => {
                              const fieldPrices = clusterTournamentPrices[cluster.id].filter(
                                p => p.field_type === fieldType
                              );
                              
                              if (fieldPrices.length === 0) return null;
                              
                              const weekdayPrices = fieldPrices.filter(p => p.day_type === 'weekday');
                              const weekendPrices = fieldPrices.filter(p => p.day_type === 'weekend');
                              
                              const sessionLabels: any = {
                                morning: '🌅 Sáng',
                                afternoon: '☀️ Chiều',
                                evening: '🌙 Tối',
                                full_day: '🌞 Cả ngày',
                              };
                              
                              return (
                                <div key={fieldType} className="border rounded-lg p-4 bg-white">
                                  <h4 className="font-semibold text-base mb-3">
                                    ⚽ Sân {fieldType.toUpperCase()}
                                  </h4>
                                  
                                  <div className="space-y-3">
                                    {weekdayPrices.length > 0 && (
                                      <div>
                                        <div className="text-sm font-medium text-gray-600 mb-2">
                                          📅 Ngày thường (T2-T6)
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          {weekdayPrices.map((price) => (
                                            <div key={price.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                              <span>{sessionLabels[price.session_type]}</span>
                                              <div className="flex items-center gap-2">
                                                <span className="text-green-600 font-semibold">
                                                  {Number(price.price_per_session).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} ₫
                                                </span>
                                                <div className="flex gap-1">
                                                  <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6"
                                                    onClick={() => handleOpenTournamentPriceDialog(cluster.id, price)}
                                                  >
                                                    <Edit className="w-3 h-3" />
                                                  </Button>
                                                  <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6"
                                                    onClick={() => setDeleteDialog({ 
                                                      open: true, 
                                                      type: 'tournament_price', 
                                                      id: price.id,
                                                      clusterId: cluster.id 
                                                    })}
                                                  >
                                                    <Trash2 className="w-3 h-3 text-destructive" />
                                                  </Button>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {weekendPrices.length > 0 && (
                                      <div>
                                        <div className="text-sm font-medium text-gray-600 mb-2">
                                          🎉 Cuối tuần (T7-CN)
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          {weekendPrices.map((price) => (
                                            <div key={price.id} className="flex items-center justify-between p-2 bg-blue-50 rounded text-sm">
                                              <span>{sessionLabels[price.session_type]}</span>
                                              <div className="flex items-center gap-2">
                                                <span className="text-green-600 font-semibold">
                                                  {Number(price.price_per_session).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} ₫
                                                </span>
                                                <div className="flex gap-1">
                                                  <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6"
                                                    onClick={() => handleOpenTournamentPriceDialog(cluster.id, price)}
                                                  >
                                                    <Edit className="w-3 h-3" />
                                                  </Button>
                                                  <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6"
                                                    onClick={() => setDeleteDialog({ 
                                                      open: true, 
                                                      type: 'tournament_price', 
                                                      id: price.id,
                                                      clusterId: cluster.id 
                                                    })}
                                                  >
                                                    <Trash2 className="w-3 h-3 text-destructive" />
                                                  </Button>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Cluster Dialog */}
        <Dialog open={clusterDialog} onOpenChange={setClusterDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCluster ? 'Chỉnh Sửa Cụm Sân' : 'Thêm Cụm Sân Mới'}
              </DialogTitle>
              <DialogDescription>
                Nhập thông tin cụm sân bóng
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tên cụm sân *</Label>
                  <Input
                    id="name"
                    value={clusterForm.name}
                    onChange={(e) => setClusterForm({ ...clusterForm, name: e.target.value })}
                    placeholder="VD: Sân Bóng ABC"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Điện thoại</Label>
                  <Input
                    id="phone"
                    value={clusterForm.phone}
                    onChange={(e) => setClusterForm({ ...clusterForm, phone: e.target.value })}
                    placeholder="0123456789"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Địa chỉ *</Label>
                <Input
                  id="address"
                  value={clusterForm.address}
                  onChange={(e) => setClusterForm({ ...clusterForm, address: e.target.value })}
                  placeholder="123 Đường ABC, Quận 1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="district">Quận/Huyện</Label>
                  <Input
                    id="district"
                    value={clusterForm.district}
                    onChange={(e) => setClusterForm({ ...clusterForm, district: e.target.value })}
                    placeholder="Quận 1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Thành phố</Label>
                  <Input
                    id="city"
                    value={clusterForm.city}
                    onChange={(e) => setClusterForm({ ...clusterForm, city: e.target.value })}
                    placeholder="TP.HCM"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={clusterForm.email}
                  onChange={(e) => setClusterForm({ ...clusterForm, email: e.target.value })}
                  placeholder="contact@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="open_time">Giờ mở cửa</Label>
                  <Input
                    id="open_time"
                    type="time"
                    value={clusterForm.open_time}
                    onChange={(e) => setClusterForm({ ...clusterForm, open_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="close_time">Giờ đóng cửa</Label>
                  <Input
                    id="close_time"
                    type="time"
                    value={clusterForm.close_time}
                    onChange={(e) => setClusterForm({ ...clusterForm, close_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Trạng thái</Label>
                <Select
                  value={clusterForm.status}
                  onValueChange={(value) => setClusterForm({ ...clusterForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="inactive">Không hoạt động</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={clusterForm.description}
                  onChange={(e) => setClusterForm({ ...clusterForm, description: e.target.value })}
                  placeholder="Mô tả về cụm sân..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setClusterDialog(false)}>
                Hủy
              </Button>
              <Button onClick={handleSaveCluster}>
                {editingCluster ? 'Cập Nhật' : 'Tạo Mới'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Field Dialog */}
        <Dialog open={fieldDialog} onOpenChange={setFieldDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingField ? 'Chỉnh Sửa Sân' : 'Thêm Sân Mới'}
              </DialogTitle>
              <DialogDescription>
                Cấu hình thông tin sân con
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="field_type">Loại sân</Label>
                <Select
                  value={fieldForm.field_type}
                  onValueChange={(value: any) => setFieldForm({ ...fieldForm, field_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5v5">Sân 5 người</SelectItem>
                    <SelectItem value="7v7">Sân 7 người</SelectItem>
                    <SelectItem value="11v11">Sân 11 người</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="field_status">Trạng thái</Label>
                <Select
                  value={fieldForm.status}
                  onValueChange={(value: any) => setFieldForm({ ...fieldForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">✓ Hoạt động - Sân có thể đặt chỗ</SelectItem>
                    <SelectItem value="maintenance">🔧 Bảo trì - Không cho phép đặt</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {fieldForm.status === 'maintenance' 
                    ? '⚠️ Sân ở chế độ bảo trì sẽ không hiển thị trong danh sách đặt chỗ'
                    : '✓ Sân đang hoạt động và có thể nhận đặt chỗ'}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFieldDialog(false)}>
                Hủy
              </Button>
              <Button onClick={handleSaveField}>
                {editingField ? 'Cập Nhật' : 'Tạo Mới'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Price Dialog */}
        <Dialog open={priceDialog} onOpenChange={setPriceDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPrice ? 'Chỉnh Sửa Giá' : 'Thêm Cấu Hình Giá'}
              </DialogTitle>
              <DialogDescription>
                Cấu hình giá theo loại sân và ngày
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="price_field_type">Loại sân</Label>
                <Select
                  value={priceForm.field_type}
                  onValueChange={(value: any) => setPriceForm({ ...priceForm, field_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5v5">Sân 5 người</SelectItem>
                    <SelectItem value="7v7">Sân 7 người</SelectItem>
                    <SelectItem value="11v11">Sân 11 người</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="day_type">Loại ngày</Label>
                <Select
                  value={priceForm.day_type}
                  onValueChange={(value: any) => setPriceForm({ ...priceForm, day_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekday">Ngày thường</SelectItem>
                    <SelectItem value="weekend">Cuối tuần</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price_hour">Giá mỗi giờ (VNĐ)</Label>
                <Input
                  id="price_hour"
                  type="number"
                  min="0"
                  step="10000"
                  value={priceForm.price_hour}
                  onChange={(e) => setPriceForm({ ...priceForm, price_hour: Number(e.target.value) })}
                  placeholder="300000"
                />
                <p className="text-xs text-gray-500">
                  Giá hiện tại: {Number(priceForm.price_hour).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VNĐ/giờ
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPriceDialog(false)}>
                Hủy
              </Button>
              <Button onClick={handleSavePrice}>
                {editingPrice ? 'Cập Nhật' : 'Tạo Mới'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Tournament Price Dialog */}
        <Dialog open={tournamentPriceDialog} onOpenChange={setTournamentPriceDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTournamentPrice ? 'Chỉnh Sửa Giá Giải Đấu' : 'Thêm Giá Giải Đấu'}
              </DialogTitle>
              <DialogDescription>
                Cấu hình giá theo buổi cho giải đấu
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="tournament_field_type">Loại sân</Label>
                <Select
                  value={tournamentPriceForm.field_type}
                  onValueChange={(value: any) => setTournamentPriceForm({ ...tournamentPriceForm, field_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5v5">⚽ Sân 5 người</SelectItem>
                    <SelectItem value="7v7">⚽ Sân 7 người</SelectItem>
                    <SelectItem value="11v11">⚽ Sân 11 người</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tournament_day_type">Loại ngày</Label>
                <Select
                  value={tournamentPriceForm.day_type}
                  onValueChange={(value: any) => setTournamentPriceForm({ ...tournamentPriceForm, day_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekday">📅 Ngày thường (T2-T6)</SelectItem>
                    <SelectItem value="weekend">🎉 Cuối tuần (T7-CN)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="session_type">Buổi thi đấu</Label>
                <Select
                  value={tournamentPriceForm.session_type}
                  onValueChange={(value: any) => setTournamentPriceForm({ ...tournamentPriceForm, session_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">🌅 Sáng (6:00-12:00)</SelectItem>
                    <SelectItem value="afternoon">☀️ Chiều (12:00-18:00)</SelectItem>
                    <SelectItem value="evening">🌙 Tối (18:00-23:00)</SelectItem>
                    <SelectItem value="full_day">🌞 Cả ngày (6:00-23:00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tournament_price">Giá (VNĐ)</Label>
                <Input
                  id="tournament_price"
                  type="number"
                  min="0"
                  step="10000"
                  value={tournamentPriceForm.price_per_session}
                  onChange={(e) => setTournamentPriceForm({ ...tournamentPriceForm, price_per_session: Number(e.target.value) })}
                  placeholder="500000"
                />
                <p className="text-xs text-gray-500">
                  Giá hiện tại: {Number(tournamentPriceForm.price_per_session).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VNĐ/buổi
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTournamentPriceDialog(false)}>
                Hủy
              </Button>
              <Button onClick={handleSaveTournamentPrice}>
                {editingTournamentPrice ? 'Cập Nhật' : 'Tạo Mới'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa {
                  deleteDialog.type === 'cluster' ? 'cụm sân' : 
                  deleteDialog.type === 'field' ? 'sân' : 
                  deleteDialog.type === 'tournament_price' ? 'giá giải đấu' :
                  'cấu hình giá'
                } này không?
                Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deleteDialog.type === 'cluster') {
                    handleDeleteCluster(deleteDialog.id);
                  } else if (deleteDialog.type === 'field' && deleteDialog.clusterId) {
                    handleDeleteField(deleteDialog.id, deleteDialog.clusterId);
                  } else if (deleteDialog.type === 'price' && deleteDialog.clusterId) {
                    handleDeletePrice(deleteDialog.id, deleteDialog.clusterId);
                  } else if (deleteDialog.type === 'tournament_price' && deleteDialog.clusterId) {
                    handleDeleteTournamentPrice(deleteDialog.id, deleteDialog.clusterId);
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </RoleBasedLayout>
  );
};

export default OwnerFields;
