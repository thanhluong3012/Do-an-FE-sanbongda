import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

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

  // Kiểm tra quyền admin (dựa vào user metadata hoặc role)
  // Chỉ cho phép user có email chứa "admin" hoặc có role admin trong metadata
  if (requireAdmin) {
    const userMetadata = user.user_metadata;
    const isAdmin = userMetadata?.role === 'admin' || user.email?.includes('admin');
    
    if (!isAdmin) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
