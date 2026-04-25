import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { tournamentService, TournamentRequest } from '@/services/tournamentService';
import { fieldComplexService, FieldComplex } from '@/services/fieldComplexService';
import { TournamentFormDialog } from '@/components/Tournament/TournamentFormDialog';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Loader2 } from 'lucide-react';

const Tournament = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(true);
  const [fieldClusters, setFieldClusters] = useState<Array<{ id: number; name: string }>>([]);
  const [isLoadingClusters, setIsLoadingClusters] = useState(true);

  // Load field clusters from API
  useEffect(() => {
    loadFieldClusters();
  }, []);

  const loadFieldClusters = async () => {
    setIsLoadingClusters(true);
    try {
      const data = await fieldComplexService.getAll();
      const clusters = Array.isArray(data) ? data.map((fc: FieldComplex) => ({
        id: fc.id,
        name: fc.name
      })) : [];
      setFieldClusters(clusters);
    } catch (error: any) {
      console.error('Error loading field clusters:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách cụm sân',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingClusters(false);
    }
  };

  const handleCreateTournament = async (data: TournamentRequest) => {
    try {
      const tournament = await tournamentService.create(data);
      toast({
        title: 'Thành công',
        description: 'Giải đấu đã được tạo thành công! Status hiện tại là "draft".',
      });
      navigate(`/tournament/${tournament.id}`);
      return tournament; // Return tournament for file upload
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Có lỗi xảy ra khi tạo giải đấu',
        variant: 'destructive',
      });
      throw error; // Re-throw để dialog không tự đóng
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      // Nếu đóng dialog mà chưa tạo, quay về danh sách
      navigate('/tournaments');
    }
    setIsDialogOpen(open);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 mt-20">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Tổ Chức Giải Đấu</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Tạo giải đấu bóng đá của riêng bạn và kết nối với cộng đồng yêu thích thể thao
          </p>
        </div>

        {/* Info Card */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Quy trình tạo giải đấu</CardTitle>
            <CardDescription>
              Hướng dẫn các bước tạo và quản lý giải đấu
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h3 className="font-semibold">Tạo giải đấu</h3>
                  <p className="text-sm text-muted-foreground">
                    Điền thông tin cơ bản: tên giải, thể thức, thời gian, địa điểm. Giải đấu sẽ có status "draft".
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h3 className="font-semibold">Publish giải đấu</h3>
                  <p className="text-sm text-muted-foreground">
                    Sau khi kiểm tra kỹ, publish giải đấu để chuyển sang status "open" và mở đăng ký.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h3 className="font-semibold">Duyệt đăng ký</h3>
                  <p className="text-sm text-muted-foreground">
                    Xem xét và duyệt các đội đăng ký tham gia giải đấu.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                  4
                </div>
                <div>
                  <h3 className="font-semibold">Tạo lịch thi đấu & cập nhật kết quả</h3>
                  <p className="text-sm text-muted-foreground">
                    Sắp xếp các trận đấu và cập nhật tỷ số. Hệ thống tự động tính điểm và xếp hạng.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Tournament Form Dialog */}
      {isLoadingClusters ? (
        <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
          </div>
        </div>
      ) : (
        <TournamentFormDialog
          open={isDialogOpen}
          onOpenChange={handleDialogClose}
          onSubmit={handleCreateTournament}
          fieldClusters={fieldClusters}
        />
      )}

      <Footer />
    </div>
  );
};

export default Tournament;
