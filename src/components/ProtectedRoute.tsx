import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: number;
  allowMultipleRoles?: number[];
}

const ProtectedRoute = ({ children, requiredRole, allowMultipleRoles }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const userRoleId = user?.role_id || user?.role?.id;
  
  const hasAccess = !requiredRole && !allowMultipleRoles
    ? true
    : requiredRole 
      ? userRoleId === requiredRole
      : allowMultipleRoles?.includes(userRoleId) ?? false;

  useEffect(() => {
    if (!loading && user && !hasAccess) {
      toast({
        title: 'Không có quyền truy cập',
        description: 'Đang chuyển về trang chủ...',
        variant: 'destructive',
      });
      
      const timer = setTimeout(() => navigate('/', { replace: true }), 1500);
      return () => clearTimeout(timer);
    }
  }, [loading, user, hasAccess, toast, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />;
  if (!hasAccess) return <Navigate to="/" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
