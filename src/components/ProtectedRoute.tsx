import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, ROLES } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: number; // 1: Admin, 2: Owner, 3: Staff, 4: Member
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Lấy role_id của user
  const userRoleId = user?.role_id || user?.role?.id;

  // Kiểm tra quyền truy cập
  const hasAccess = !requiredRole || userRoleId === requiredRole;

  // useEffect để hiển thị toast và redirect khi không có quyền
  useEffect(() => {
    if (!loading && user && requiredRole && !hasAccess) {
      toast({
        title: '❌ Không có quyền truy cập',
        description: 'Bạn không có quyền truy cập vào trang này. Đang chuyển về trang chủ...',
        variant: 'destructive',
      });
      
      const timer = setTimeout(() => {
        navigate('/', { replace: true });
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [loading, user, requiredRole, hasAccess, toast, navigate]);

  // Hiển thị loading khi đang kiểm tra authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Nếu chưa đăng nhập, redirect về trang auth
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Nếu yêu cầu role cụ thể nhưng không có quyền
  if (requiredRole && !hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-red-600 font-semibold">Không có quyền truy cập</p>
          <p className="text-gray-500 text-sm mt-2">Đang chuyển về trang chủ...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
