import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tournament, tournamentService } from '@/services/tournamentService';
import { TournamentCard } from '@/components/Tournament/TournamentCard';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Trophy, Search, Plus, Loader2 } from 'lucide-react';

const Tournaments = () => {
  const { toast } = useToast();
  const { user, isAdmin, isOwner } = useAuth();

  // State cho tab "Các giải đấu"
  const [publicTournaments, setPublicTournaments] = useState<Tournament[]>([]);
  const [filteredPublicTournaments, setFilteredPublicTournaments] = useState<Tournament[]>([]);
  const [publicSearchQuery, setPublicSearchQuery] = useState('');
  const [publicFilterStatus, setPublicFilterStatus] = useState('all');
  const [publicFilterFormat, setPublicFilterFormat] = useState('all');
  const [isLoadingPublic, setIsLoadingPublic] = useState(!user); // Chỉ loading nếu không có user (tab mặc định là public)

  // State cho tab "Quản lý giải đấu của tôi"
  const [myTournaments, setMyTournaments] = useState<Tournament[]>([]);
  const [filteredMyTournaments, setFilteredMyTournaments] = useState<Tournament[]>([]);
  const [mySearchQuery, setMySearchQuery] = useState('');
  const [myFilterStatus, setMyFilterStatus] = useState('all');
  const [myFilterFormat, setMyFilterFormat] = useState('all');
  const [myFilterParticipation, setMyFilterParticipation] = useState('all'); // Filter theo loại tham gia
  const [isLoadingMy, setIsLoadingMy] = useState(!!user); // Chỉ loading nếu có user (tab mặc định là my)

  // Tab mặc định: nếu đã đăng nhập thì hiển thị "Quản lý giải đấu của tôi", nếu không thì "Các giải đấu"
  const [activeTab, setActiveTab] = useState(user ? 'my' : 'public');

  // Load dữ liệu ban đầu dựa vào tab mặc định
  useEffect(() => {
    if (activeTab === 'public') {
      loadPublicTournaments();
    } else if (activeTab === 'my' && user) {
      loadMyTournaments();
    }
  }, []);

  // Lazy load khi chuyển tab
  useEffect(() => {
    if (activeTab === 'public' && publicTournaments.length === 0) {
      loadPublicTournaments();
    } else if (activeTab === 'my' && user && myTournaments.length === 0) {
      loadMyTournaments();
    }
  }, [activeTab]);

  // Filter public tournaments
  useEffect(() => {
    const filtered = publicTournaments.filter((tournament) => {
      const matchesSearch = tournament.name.toLowerCase().includes(publicSearchQuery.toLowerCase()) ||
        tournament.field_cluster?.name?.toLowerCase().includes(publicSearchQuery.toLowerCase());
      const matchesStatus = publicFilterStatus === 'all' || tournament.status === publicFilterStatus;
      const matchesFormat = publicFilterFormat === 'all' || tournament.format === publicFilterFormat;

      // Chỉ hiển thị giải đấu công khai (không phải draft)
      const isPublic = tournament.status !== 'draft';

      return matchesSearch && matchesStatus && matchesFormat && isPublic;
    });
    setFilteredPublicTournaments(filtered);
  }, [publicSearchQuery, publicFilterStatus, publicFilterFormat, publicTournaments]);

  // Filter my tournaments
  useEffect(() => {
    const filtered = myTournaments.filter((tournament) => {
      const matchesSearch = tournament.name.toLowerCase().includes(mySearchQuery.toLowerCase()) ||
        tournament.field_cluster?.name?.toLowerCase().includes(mySearchQuery.toLowerCase());
      const matchesStatus = myFilterStatus === 'all' || tournament.status === myFilterStatus;
      const matchesFormat = myFilterFormat === 'all' || tournament.format === myFilterFormat;
      const matchesParticipation = myFilterParticipation === 'all' || tournament.participation_type === myFilterParticipation;

      return matchesSearch && matchesStatus && matchesFormat && matchesParticipation;
    });
    setFilteredMyTournaments(filtered);
  }, [mySearchQuery, myFilterStatus, myFilterFormat, myFilterParticipation, myTournaments]);

  const loadPublicTournaments = async () => {
    setIsLoadingPublic(true);
    try {
      const data = await tournamentService.getAll();
      setPublicTournaments(Array.isArray(data) ? data : []);
    } catch (error: any) {
      if (error.response?.status !== 401) {
        toast({
          title: 'Lỗi',
          description: error.response?.data?.message || 'Không thể tải danh sách giải đấu.',
          variant: 'destructive',
        });
      }
      setPublicTournaments([]);
    } finally {
      setIsLoadingPublic(false);
    }
  };

  const loadMyTournaments = async () => {
    setIsLoadingMy(true);
    try {
      const data = await tournamentService.getMyTournaments();
      setMyTournaments(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể tải giải đấu của bạn.',
        variant: 'destructive',
      });
      setMyTournaments([]);
    } finally {
      setIsLoadingMy(false);
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mb-6 bg-muted/50 p-1 rounded-lg h-11" style={{ gridTemplateColumns: user ? '1fr 1fr' : '1fr' }}>
            <TabsTrigger
              value="public"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200"
            >
              Các giải đấu
            </TabsTrigger>
            {user && (
              <TabsTrigger
                value="my"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200"
              >
                Quản lý giải đấu của tôi
              </TabsTrigger>
            )}
          </TabsList>

          {/* Tab: Các giải đấu (Public) */}
          <TabsContent value="public">
            {/* Filters */}
            <Card className="mb-8">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Tìm kiếm giải đấu..."
                      value={publicSearchQuery}
                      onChange={(e) => setPublicSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select value={publicFilterStatus} onValueChange={setPublicFilterStatus}>
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

                  <Select value={publicFilterFormat} onValueChange={setPublicFilterFormat}>
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
            {isLoadingPublic && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}

            {/* Tournaments Grid */}
            {!isLoadingPublic && filteredPublicTournaments.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPublicTournaments.map((tournament) => (
                  <TournamentCard
                    key={tournament.id}
                    tournament={tournament}
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoadingPublic && filteredPublicTournaments.length === 0 && (
              <Card className="p-12">
                <div className="text-center">
                  <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Không tìm thấy giải đấu</h3>
                  <p className="text-muted-foreground mb-4">
                    {publicSearchQuery || publicFilterStatus !== 'all' || publicFilterFormat !== 'all'
                      ? 'Thử thay đổi bộ lọc hoặc tìm kiếm khác'
                      : 'Chưa có giải đấu nào đang diễn ra.'}
                  </p>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Quản lý giải đấu của tôi */}
          {user && (
            <TabsContent value="my">
              {/* Filters */}
              <Card className="mb-8">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Tìm kiếm giải đấu..."
                        value={mySearchQuery}
                        onChange={(e) => setMySearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <Select value={myFilterParticipation} onValueChange={setMyFilterParticipation}>
                      <SelectTrigger>
                        <SelectValue placeholder="Loại tham gia" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả loại</SelectItem>
                        <SelectItem value="organizer">🎯 Tổ chức</SelectItem>
                        <SelectItem value="participant">⚽ Tham gia</SelectItem>
                        <SelectItem value="both">👑 Tổ chức & Tham gia</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={myFilterStatus} onValueChange={setMyFilterStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                        <SelectItem value="draft">Bản nháp</SelectItem>
                        <SelectItem value="open">Đang mở đăng ký</SelectItem>
                        <SelectItem value="in_progress">Đang diễn ra</SelectItem>
                        <SelectItem value="completed">Đã kết thúc</SelectItem>
                        <SelectItem value="cancelled">Đã hủy</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={myFilterFormat} onValueChange={setMyFilterFormat}>
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
              {isLoadingMy && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}

              {/* Tournaments Grid */}
              {!isLoadingMy && filteredMyTournaments.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMyTournaments.map((tournament) => (
                    <TournamentCard
                      key={tournament.id}
                      tournament={tournament}
                      isManager={true}
                      showActions={true}
                    />
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!isLoadingMy && filteredMyTournaments.length === 0 && (
                <Card className="p-12">
                  <div className="text-center">
                    <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Chưa có giải đấu nào</h3>
                    <p className="text-muted-foreground mb-4">
                      {mySearchQuery || myFilterStatus !== 'all' || myFilterFormat !== 'all' || myFilterParticipation !== 'all'
                        ? 'Thử thay đổi bộ lọc hoặc tìm kiếm khác'
                        : 'Bạn chưa tổ chức hoặc tham gia giải đấu nào. Hãy tạo giải đấu đầu tiên hoặc đăng ký tham gia giải đấu khác!'}
                    </p>
                    <Button asChild>
                      <Link to="/tournament/create">Tạo giải đấu mới</Link>
                    </Button>
                  </div>
                </Card>
              )}
            </TabsContent>
          )}
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Tournaments;