import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, MapPin, Users, Calendar, DollarSign, Search, Plus } from 'lucide-react';

// Mock data - sẽ thay bằng API call
const mockTournaments = [
  {
    id: 1,
    name: 'Giải bóng đá TM Arena Cup 2026',
    type: 'Bảng đấu + Loại trực tiếp',
    fieldName: 'Sân TM Arena 1',
    location: '123 Đường ABC, Quận 1, TP.HCM',
    teamSize: '5v5',
    maxTeams: 16,
    registeredTeams: 12,
    startDate: '2026-02-15',
    endDate: '2026-03-15',
    entryFee: 500000,
    prize: '10,000,000 VNĐ + Cúp vô địch',
    status: 'open',
  },
  {
    id: 2,
    name: 'Giải Futsal Đại Học 2026',
    type: 'Vòng tròn',
    fieldName: 'Sân TM Arena 2',
    location: '456 Đường XYZ, Quận 3, TP.HCM',
    teamSize: '5v5',
    maxTeams: 8,
    registeredTeams: 8,
    startDate: '2026-02-01',
    endDate: '2026-02-28',
    entryFee: 300000,
    prize: '5,000,000 VNĐ',
    status: 'full',
  },
  {
    id: 3,
    name: 'Giải Bóng Đá Mini Mùa Hè',
    type: 'Loại trực tiếp',
    fieldName: 'Sân TM Arena 3',
    location: '789 Đường DEF, Quận 7, TP.HCM',
    teamSize: '7v7',
    maxTeams: 16,
    registeredTeams: 5,
    startDate: '2026-03-01',
    endDate: '2026-03-30',
    entryFee: 700000,
    prize: '15,000,000 VNĐ + Giải thưởng cá nhân',
    status: 'open',
  },
  {
    id: 4,
    name: 'Giải Bóng Đá Cộng Đồng',
    type: 'League',
    fieldName: 'Sân TM Arena 4',
    location: '321 Đường GHI, Quận 5, TP.HCM',
    teamSize: '11v11',
    maxTeams: 12,
    registeredTeams: 12,
    startDate: '2026-01-20',
    endDate: '2026-06-30',
    entryFee: 1000000,
    prize: '30,000,000 VNĐ',
    status: 'ongoing',
  },
];

const Tournaments = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTeamSize, setFilterTeamSize] = useState('all');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-green-500">Đang mở đăng ký</Badge>;
      case 'full':
        return <Badge className="bg-yellow-500">Đã đủ đội</Badge>;
      case 'ongoing':
        return <Badge className="bg-blue-500">Đang diễn ra</Badge>;
      case 'finished':
        return <Badge className="bg-gray-500">Đã kết thúc</Badge>;
      default:
        return null;
    }
  };

  const filteredTournaments = mockTournaments.filter((tournament) => {
    const matchesSearch = tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tournament.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || tournament.status === filterStatus;
    const matchesTeamSize = filterTeamSize === 'all' || tournament.teamSize === filterTeamSize;
    
    return matchesSearch && matchesStatus && matchesTeamSize;
  });

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
          <Button asChild className="gap-2">
            <Link to="/tournament/create">
              <Plus className="w-4 h-4" />
              Tạo giải đấu mới
            </Link>
          </Button>
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
                  <SelectItem value="full">Đã đủ đội</SelectItem>
                  <SelectItem value="ongoing">Đang diễn ra</SelectItem>
                  <SelectItem value="finished">Đã kết thúc</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterTeamSize} onValueChange={setFilterTeamSize}>
                <SelectTrigger>
                  <SelectValue placeholder="Quy mô đội" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả quy mô</SelectItem>
                  <SelectItem value="5v5">Sân 5 (5v5)</SelectItem>
                  <SelectItem value="7v7">Sân 7 (7v7)</SelectItem>
                  <SelectItem value="11v11">Sân 11 (11v11)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tournaments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTournaments.map((tournament) => (
            <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Trophy className="w-8 h-8 text-primary" />
                  {getStatusBadge(tournament.status)}
                </div>
                <CardTitle className="text-xl">{tournament.name}</CardTitle>
                <CardDescription>{tournament.type}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{tournament.fieldName}</p>
                    <p className="text-muted-foreground">{tournament.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {tournament.teamSize} • {tournament.registeredTeams}/{tournament.maxTeams} đội
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {new Date(tournament.startDate).toLocaleDateString('vi-VN')} - {' '}
                    {new Date(tournament.endDate).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {tournament.entryFee.toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-sm font-medium text-primary">🏆 {tournament.prize}</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link to={`/tournament/${tournament.id}`}>
                    Xem chi tiết
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredTournaments.length === 0 && (
          <Card className="p-12">
            <div className="text-center">
              <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Không tìm thấy giải đấu</h3>
              <p className="text-muted-foreground mb-4">
                Thử thay đổi bộ lọc hoặc tìm kiếm khác
              </p>
              <Button asChild>
                <Link to="/tournament/create">Tạo giải đấu mới</Link>
              </Button>
            </div>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Tournaments;
