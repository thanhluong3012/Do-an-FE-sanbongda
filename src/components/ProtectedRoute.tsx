import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Kiểm tra quyền admin
  const isAdmin = user && (
    user.role_id === 2 || 
    user.role_id === 3 ||
    user.role === 'admin' || 
    user.role === 'superadmin' ||
    user.role?.toLowerCase() === 'admin' ||
    user.role?.toLowerCase() === 'superadmin'
  );

  // useEffect để hiển thị toast và redirect khi không có quyền
  useEffect(() => {
    if (!loading && user && requireAdmin && !isAdmin) {
      toast({
        title: '❌ Không có quyền truy cập',
        description: 'Bạn không có quyền truy cập vào trang quản trị. Đang chuyển về trang chủ...',
        variant: 'destructive',
      });
      
      const timer = setTimeout(() => {
        navigate('/', { replace: true });
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [loading, user, requireAdmin, isAdmin, toast, navigate]);

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

  // Nếu yêu cầu admin nhưng không phải admin
  if (requireAdmin && !isAdmin) {
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
