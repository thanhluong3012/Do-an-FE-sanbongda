import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, ROLES } from '@/hooks/useAuth';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  MapPin, 
  Settings,
  LogOut,
  Menu,
  X,
  UserCheck,
  DollarSign,
  BarChart3,
  Building2,
  UserCog,
  ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface RoleBasedLayoutProps {
  children: ReactNode;
}

interface MenuItem {
  path: string;
  icon: any;
  label: string;
}

const RoleBasedLayout = ({ children }: RoleBasedLayoutProps) => {
  const { user, signOut, isAdmin, isOwner, isStaff } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [pageTitle, setPageTitle] = useState('');

  useEffect(() => {
    // Kiểm tra authorization và redirect nếu không có quyền
    if (!user) {
      navigate('/auth');
      return;
    }

    const roleId = user.role_id || user.role?.id;
    if (!roleId || roleId === ROLES.MEMBER) {
      navigate('/');
      return;
    }

    // Cấu hình menu theo role
    let items: MenuItem[] = [];
    let title = '';

    if (isOwner()) {
      title = 'Chủ Sân';
      items = [
        { path: '/owner/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/owner/staff', icon: UserCog, label: 'Quản lý nhân viên' },
        { path: '/owner/fields', icon: MapPin, label: 'Quản lý sân' },
        { path: '/owner/bookings', icon: Calendar, label: 'Quản lý booking' },
        { path: '/owner/payments', icon: DollarSign, label: 'Thanh toán' },
        { path: '/owner/revenue', icon: BarChart3, label: 'Báo cáo doanh thu' },
      ];
    } else if (isStaff()) {
      title = 'Nhân Viên';
      items = [
        { path: '/staff/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/staff/fields', icon: MapPin, label: 'Quản lý sân' },
        { path: '/staff/bookings', icon: Calendar, label: 'Quản lý booking' },
        { path: '/staff/revenue', icon: BarChart3, label: 'Báo cáo doanh thu' },
      ];
    }

    setMenuItems(items);
    setPageTitle(title);
  }, [user, isAdmin, isOwner, isStaff, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getRoleBadgeColor = () => {
    if (isAdmin()) return 'bg-red-600';
    if (isOwner()) return 'bg-blue-600';
    if (isStaff()) return 'bg-green-600';
    return 'bg-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 z-40 h-screen transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } bg-gray-900 text-white w-64`}
      >
        <div className="h-full px-3 py-4 overflow-y-auto flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-5 px-3">
            <div>
              <h2 className="text-xl font-bold">{pageTitle}</h2>
              <span className={`text-xs px-2 py-0.5 rounded ${getRoleBadgeColor()}`}>
                {user?.role?.name_role || 'User'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-white hover:bg-gray-800"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User Info */}
          <div className="mb-5 px-3 py-3 bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-300">Xin chào,</p>
            <p className="font-semibold truncate">{user?.name || user?.email}</p>
          </div>

          {/* Navigation */}
          <nav className="space-y-2 flex-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2.5 text-sm rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Sign Out Button */}
          <div className="mt-auto pt-4">
            <Button
              onClick={handleSignOut}
              variant="ghost"
              className="w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`${sidebarOpen ? 'lg:ml-64' : ''} transition-all`}>
        {/* Top Bar */}
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-4">
              <Link to="/" className="text-sm text-blue-600 hover:underline">
                Về trang chủ
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default RoleBasedLayout;
