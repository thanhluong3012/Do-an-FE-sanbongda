import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tournament, tournamentService } from '@/services/tournamentService';
import { TournamentCard } from '@/components/Tournament/TournamentCard';
import { TournamentFormDialog } from '@/components/Tournament/TournamentFormDialog';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Search, Plus, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Mock field clusters - TODO: Load from API
const mockFieldClusters = [
  { id: 1, name: 'Cụm sân ABC' },
  { id: 2, name: 'Cụm sân XYZ' },
];

const AdminTournaments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterFormat, setFilterFormat] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [deleteTournamentId, setDeleteTournamentId] = useState<number | null>(null);

  useEffect(() => {
    loadTournaments();
  }, []);

  useEffect(() => {
    const filtered = tournaments.filter((tournament) => {
      const matchesSearch = tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           tournament.field_cluster?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || tournament.status === filterStatus;
      const matchesFormat = filterFormat === 'all' || tournament.format === filterFormat;
      
      return matchesSearch && matchesStatus && matchesFormat;
    });
    setFilteredTournaments(filtered);
  }, [searchQuery, filterStatus, filterFormat, tournaments]);

  const loadTournaments = async () => {
    setIsLoading(true);
    try {
      const data = await tournamentService.getAll();
      setTournaments(data);
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể tải danh sách giải đấu',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (data: any) => {
    const tournament = await tournamentService.create(data);
    await loadTournaments();
    return tournament; // Return for file upload in dialog
  };

  const handleUpdate = async (data: any) => {
    if (editingTournament) {
      await tournamentService.update(editingTournament.id, data);
      await loadTournaments();
      setEditingTournament(null);
    }
    // No return needed for update
  };

  const handleDelete = async () => {
    if (deleteTournamentId) {
      try {
        await tournamentService.delete(deleteTournamentId);
        toast({
          title: 'Thành công',
          description: 'Đã xóa giải đấu',
        });
        await loadTournaments();
      } catch (error: any) {
        toast({
          title: 'Lỗi',
          description: error.response?.data?.message || 'Không thể xóa giải đấu',
          variant: 'destructive',
        });
      }
      setDeleteTournamentId(null);
    }
  };

  const handlePublish = async (id: number) => {
    try {
      await tournamentService.publish(id);
      toast({
        title: 'Thành công',
        description: 'Đã publish giải đấu. Status chuyển sang "open" và đã mở đăng ký.',
      });
      await loadTournaments();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể publish giải đấu',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (tournament: Tournament) => {
    setEditingTournament(tournament);
    setIsDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setEditingTournament(null);
    }
    setIsDialogOpen(open);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Quản lý giải đấu</h1>
            <p className="text-muted-foreground">
              Tạo, chỉnh sửa và quản lý các giải đấu
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Tạo giải đấu mới
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Tìm kiếm giải đấu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="draft">Nháp</SelectItem>
                  <SelectItem value="open">Đang mở đăng ký</SelectItem>
                  <SelectItem value="in_progress">Đang diễn ra</SelectItem>
                  <SelectItem value="completed">Đã kết thúc</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterFormat} onValueChange={setFilterFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Thể thức" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả thể thức</SelectItem>
                  <SelectItem value="round_robin">Vòng tròn</SelectItem>
                  <SelectItem value="knockout">Loại trực tiếp</SelectItem>
                  <SelectItem value="group_knockout">Bảng + Loại trực tiếp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Tournaments Grid */}
        {!isLoading && filteredTournaments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map((tournament) => (
              <div key={tournament.id} className="space-y-2">
                <TournamentCard
                  tournament={tournament}
                  showActions={true}
                  onEdit={handleEdit}
                  onDelete={setDeleteTournamentId}
                />
                {tournament.status === 'draft' && (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handlePublish(tournament.id)}
                  >
                    📢 Publish giải đấu
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredTournaments.length === 0 && (
          <Card className="p-12">
            <div className="text-center">
              <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Không tìm thấy giải đấu</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || filterStatus !== 'all' || filterFormat !== 'all'
                  ? 'Thử thay đổi bộ lọc hoặc tìm kiếm khác'
                  : 'Chưa có giải đấu nào. Hãy tạo giải đấu đầu tiên!'}
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>Tạo giải đấu mới</Button>
            </div>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <TournamentFormDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        onSubmit={editingTournament ? handleUpdate : handleCreate}
        tournament={editingTournament}
        fieldClusters={mockFieldClusters}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTournamentId} onOpenChange={() => setDeleteTournamentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa giải đấu này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminTournaments;
