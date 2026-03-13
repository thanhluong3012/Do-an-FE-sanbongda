import { Badge } from '@/components/ui/badge';

interface TournamentStatusBadgeProps {
  status: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
  className?: string;
}

export const TournamentStatusBadge = ({ status, className = '' }: TournamentStatusBadgeProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'draft':
        return { label: 'Nháp', color: 'bg-gray-500' };
      case 'open':
        return { label: 'Đang mở đăng ký', color: 'bg-green-500' };
      case 'in_progress':
        return { label: 'Đang diễn ra', color: 'bg-blue-500' };
      case 'completed':
        return { label: 'Đã kết thúc', color: 'bg-purple-500' };
      case 'cancelled':
        return { label: 'Đã hủy', color: 'bg-red-500' };
      default:
        return { label: status, color: 'bg-gray-500' };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge className={`${config.color} ${className}`}>
      {config.label}
    </Badge>
  );
};

interface TournamentFormatBadgeProps {
  format: 'round_robin' | 'knockout' | 'group_knockout';
  className?: string;
}

export const TournamentFormatBadge = ({ format, className = '' }: TournamentFormatBadgeProps) => {
  const getFormatLabel = () => {
    switch (format) {
      case 'round_robin':
        return 'Vòng tròn';
      case 'knockout':
        return 'Loại trực tiếp';
      case 'group_knockout':
        return 'Bảng + Loại trực tiếp';
      default:
        return format;
    }
  };

  return (
    <Badge variant="outline" className={className}>
      {getFormatLabel()}
    </Badge>
  );
};
