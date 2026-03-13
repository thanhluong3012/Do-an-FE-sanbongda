import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tournament, tournamentService } from '@/services/tournamentService';
import { TournamentCard } from '@/components/Tournament/TournamentCard';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Trophy, Search, Plus, Loader2 } from 'lucide-react';

const Tournaments = () => {
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterFormat, setFilterFormat] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTournaments();
  }, []);

  useEffect(() => {
    const filtered = tournaments.filter((tournament) => {
      const matchesSearch = tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           tournament.field_cluster?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || tournament.status === filterStatus;
      const matchesFormat = filterFormat === 'all' || tournament.format === filterFormat;
      
      // Chỉ hiển thị giải đấu công khai (không phải draft) cho user thường
      const isPublic = tournament.status !== 'draft';
      
      return matchesSearch && matchesStatus && matchesFormat && isPublic;
    });
    setFilteredTournaments(filtered);
  }, [searchQuery, filterStatus, filterFormat, tournaments]);

  const loadTournaments = async () => {
    setIsLoading(true);
    try {
      const data = await tournamentService.getAll();
      console.log('📊 Received data type:', typeof data, 'Is Array:', Array.isArray(data));
      console.log('📊 Data:', data);
      
      // Đảm bảo luôn là array
      if (Array.isArray(data)) {
        setTournaments(data);
      } else {
        console.warn('⚠️ Data is not an array, using empty array');
        setTournaments([]);
      }
    } catch (error: any) {
      console.error('❌ Error loading tournaments:', error);
      toast({
        title: 'Lỗi kết nối API',
        description: error.response?.data?.message || 'Không thể tải danh sách giải đấu. Vui lòng kiểm tra backend đã chạy chưa.',
        variant: 'destructive',
      });
      // Set empty array để trang không bị trắng
      setTournaments([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 mt-20">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Giải Đấu</h1>
            <p className="text-muted-foreground">
              Khám phá và tham gia các giải đấu bóng đá hấp dẫn
            </p>
          </div>
          {user ? (
            <Button asChild className="gap-2">
              <Link to="/tournament/create">
                <Plus className="w-4 h-4" />
                Tạo giải đấu mới
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline" className="gap-2">
              <Link to="/auth">
                Đăng nhập để tạo giải đấu
              </Link>
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card className="mb-8">
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
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
              />
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
                  : isAdmin() 
                    ? 'Chưa có giải đấu nào. Hãy tạo giải đấu đầu tiên!' 
                    : 'Chưa có giải đấu nào đang diễn ra.'}
              </p>
              {isAdmin() && (
                <Button asChild>
                  <Link to="/tournament/create">Tạo giải đấu mới</Link>
                </Button>
              )}
            </div>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Tournaments;
