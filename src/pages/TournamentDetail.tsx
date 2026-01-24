import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Trophy, MapPin, Users, Calendar, DollarSign, FileText, Phone, Mail, ArrowLeft, CheckCircle } from 'lucide-react';

// Mock data - sẽ thay bằng API call
const mockTournament = {
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
  startTime: '18:00',
  entryFee: 500000,
  prize: '10,000,000 VNĐ + Cúp vô địch',
  status: 'open',
  rules: `- Thời gian: 2 hiệp x 25 phút
- Nghỉ giữa hiệp: 10 phút
- Luật việt vị: Có áp dụng
- Số cầu thủ dự bị: Tối đa 5 người
- Thẻ phạt: Theo luật FIFA
- Đá penalty khi hòa ở vòng loại trực tiếp
- Mỗi đội được thay tối đa 7 lượt
- Cầu thủ nhận thẻ đỏ sẽ bị treo giò 1 trận
- Ban tổ chức cung cấp trọng tài và bóng thi đấu`,
  contactName: 'Nguyễn Văn A',
  contactPhone: '0123456789',
  contactEmail: 'contact@tmarena.com',
  teams: [
    { id: 1, name: 'FC Thunder', captain: 'Trần Văn B', players: 10 },
    { id: 2, name: 'Dragon United', captain: 'Lê Văn C', players: 12 },
    { id: 3, name: 'Phoenix FC', captain: 'Phạm Văn D', players: 11 },
    { id: 4, name: 'Tigers Squad', captain: 'Hoàng Văn E', players: 9 },
  ],
  schedule: [
    { date: '2026-02-15', time: '18:00', match: 'FC Thunder vs Dragon United', round: 'Vòng bảng A' },
    { date: '2026-02-15', time: '19:30', match: 'Phoenix FC vs Tigers Squad', round: 'Vòng bảng A' },
    { date: '2026-02-22', time: '18:00', match: 'FC Thunder vs Phoenix FC', round: 'Vòng bảng A' },
    { date: '2026-02-22', time: '19:30', match: 'Dragon United vs Tigers Squad', round: 'Vòng bảng A' },
  ],
};

const TournamentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Registration form state
  const [teamName, setTeamName] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [captainPhone, setCaptainPhone] = useState('');
  const [captainEmail, setCaptainEmail] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teamName || !captainName || !captainPhone) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng điền đầy đủ thông tin',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    // TODO: Call API to register team
    setTimeout(() => {
      setIsSubmitting(false);
      setIsDialogOpen(false);
      toast({
        title: 'Đăng ký thành công!',
        description: 'Đội của bạn đã được đăng ký tham gia giải đấu.',
      });
      // Reset form
      setTeamName('');
      setCaptainName('');
      setCaptainPhone('');
      setCaptainEmail('');
    }, 1500);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-green-500 text-lg px-3 py-1">Đang mở đăng ký</Badge>;
      case 'full':
        return <Badge className="bg-yellow-500 text-lg px-3 py-1">Đã đủ đội</Badge>;
      case 'ongoing':
        return <Badge className="bg-blue-500 text-lg px-3 py-1">Đang diễn ra</Badge>;
      case 'finished':
        return <Badge className="bg-gray-500 text-lg px-3 py-1">Đã kết thúc</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 mt-20">
        {/* Back button */}
        <Button variant="ghost" onClick={() => navigate('/tournaments')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại danh sách
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">{mockTournament.name}</h1>
                <div className="flex flex-wrap gap-2">
                  {getStatusBadge(mockTournament.status)}
                  <Badge variant="outline">{mockTournament.type}</Badge>
                  <Badge variant="outline">{mockTournament.teamSize}</Badge>
                </div>
              </div>
            </div>
            
            {mockTournament.status === 'open' && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Đăng ký tham gia
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Đăng ký tham gia giải đấu</DialogTitle>
                    <DialogDescription>
                      Điền thông tin đội của bạn để đăng ký tham gia
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleRegister}>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="teamName">Tên đội <span className="text-destructive">*</span></Label>
                        <Input
                          id="teamName"
                          placeholder="VD: FC Thunder"
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="captainName">Tên đội trưởng <span className="text-destructive">*</span></Label>
                        <Input
                          id="captainName"
                          placeholder="VD: Nguyễn Văn A"
                          value={captainName}
                          onChange={(e) => setCaptainName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="captainPhone">Số điện thoại <span className="text-destructive">*</span></Label>
                        <Input
                          id="captainPhone"
                          type="tel"
                          placeholder="VD: 0123456789"
                          value={captainPhone}
                          onChange={(e) => setCaptainPhone(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="captainEmail">Email</Label>
                        <Input
                          id="captainEmail"
                          type="email"
                          placeholder="VD: captain@email.com"
                          value={captainEmail}
                          onChange={(e) => setCaptainEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Hủy
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Đang đăng ký...' : 'Xác nhận đăng ký'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Thông tin</TabsTrigger>
            <TabsTrigger value="rules">Thể lệ</TabsTrigger>
            <TabsTrigger value="teams">Đội tham gia ({mockTournament.registeredTeams})</TabsTrigger>
            <TabsTrigger value="schedule">Lịch thi đấu</TabsTrigger>
          </TabsList>

          {/* Thông tin tab */}
          <TabsContent value="info" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Địa điểm tổ chức
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-medium">{mockTournament.fieldName}</p>
                  <p className="text-muted-foreground">{mockTournament.location}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Thời gian
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><strong>Bắt đầu:</strong> {new Date(mockTournament.startDate).toLocaleDateString('vi-VN')}</p>
                  <p><strong>Kết thúc:</strong> {new Date(mockTournament.endDate).toLocaleDateString('vi-VN')}</p>
                  <p><strong>Giờ thi đấu:</strong> {mockTournament.startTime}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Quy mô
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><strong>Loại sân:</strong> {mockTournament.teamSize}</p>
                  <p><strong>Số đội:</strong> {mockTournament.registeredTeams}/{mockTournament.maxTeams} đội</p>
                  <p className="text-sm text-muted-foreground">
                    Còn {mockTournament.maxTeams - mockTournament.registeredTeams} slot trống
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Chi phí & Giải thưởng
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><strong>Phí tham gia:</strong> {mockTournament.entryFee.toLocaleString('vi-VN')} VNĐ</p>
                  <p><strong>Giải thưởng:</strong></p>
                  <p className="text-primary font-medium">🏆 {mockTournament.prize}</p>
                </CardContent>
              </Card>
            </div>

            {/* Contact info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Thông tin liên hệ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Người liên hệ:</strong> {mockTournament.contactName}</p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {mockTournament.contactPhone}
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {mockTournament.contactEmail}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Thể lệ tab */}
          <TabsContent value="rules">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Thể lệ thi đấu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap font-sans">{mockTournament.rules}</pre>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teams tab */}
          <TabsContent value="teams">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockTournament.teams.map((team) => (
                <Card key={team.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-lg">{team.name}</h3>
                        <p className="text-sm text-muted-foreground">Đội trưởng: {team.captain}</p>
                        <p className="text-sm text-muted-foreground">Số cầu thủ: {team.players}</p>
                      </div>
                      <Trophy className="w-8 h-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Schedule tab */}
          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Lịch thi đấu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockTournament.schedule.map((match, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0 text-center">
                        <p className="font-bold">{new Date(match.date).toLocaleDateString('vi-VN')}</p>
                        <p className="text-sm text-muted-foreground">{match.time}</p>
                      </div>
                      <div className="flex-grow">
                        <Badge variant="outline" className="mb-2">{match.round}</Badge>
                        <p className="font-medium">{match.match}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default TournamentDetail;
