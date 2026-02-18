import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import api from '@/lib/axios';

// Định nghĩa kiểu dữ liệu cho User và Session
interface User {
  id: string;
  email: string;
  name?: string;
  role_id?: number;
  role?: {
    id: number;
    name_role: string;
    description?: string;
  };
  [key: string]: any;
}

// Role constants
export const ROLES = {
  ADMIN: 1,
  OWNER: 2,
  STAFF: 3,
  MEMBER: 4,
} as const;

interface Session {
  access_token: string;
  refresh_token?: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: () => boolean;
  isOwner: () => boolean;
  isStaff: () => boolean;
  isMember: () => boolean;
  hasRole: (roleId: number) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra session từ localStorage khi component mount
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        try {
          // Parse stored user và set state
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setSession({ access_token: token, user: parsedUser });
        } catch (error) {
          // Không parse được localStorage, xóa dữ liệu
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          setUser(null);
          setSession(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

const signUp = async (email: string, password: string, fullName: string) => {
  try {
    await api.post('/auth/register', {
      name: fullName,
      email,
      password,
    });

    return { error: null };
  } catch (error: any) {
    return { error: new Error(error.response?.data?.message || 'Đăng ký thất bại') };
  }
};

  const signIn = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });
      
      // API trả về: { success, message, data: { user, access_token, ... } }
      const responseData = response.data.data ;
  
      // Extract token từ đúng vị trí
      const token = responseData.access_token || responseData.token || response.data.access_token || response.data.token;
      
      // Extract user data từ đúng vị trí
      let userData = responseData.user || response.data.user || responseData;
      
      // Nếu userData vẫn chứa access_token, nghĩa là chưa đúng, cần lấy nested user
      if (userData.access_token && userData.user) {
        userData = userData.user;
      }
      
      // Lưu token và user vào localStorage
      if (token && userData && userData.email) {
        // Đảm bảo lưu đầy đủ thông tin user bao gồm role_id
        console.log('User data khi login:', userData);
        localStorage.setItem('access_token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Set state
        setUser(userData);
        setSession({ access_token: token, user: userData });
      }
      
      return { error: null };
    } catch (error: any) {
      return { error: new Error(error.response?.data?.message || 'Đăng nhập thất bại') };
    }
  };

  const signOut = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Xóa token và user khỏi localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      setUser(null);
      setSession(null);
    }
  };

  // Role checking functions
  const hasRole = (roleId: number): boolean => {
    return user?.role_id === roleId || user?.role?.id === roleId;
  };

  const isAdmin = (): boolean => hasRole(ROLES.ADMIN);
  const isOwner = (): boolean => hasRole(ROLES.OWNER);
  const isStaff = (): boolean => hasRole(ROLES.STAFF);
  const isMember = (): boolean => hasRole(ROLES.MEMBER);

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      signUp, 
      signIn, 
      signOut,
      isAdmin,
      isOwner,
      isStaff,
      isMember,
      hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
