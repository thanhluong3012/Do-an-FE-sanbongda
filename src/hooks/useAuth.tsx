import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import api from '@/lib/axios';
import { getAuthToken, setAuthToken, removeAuthToken, getAuthUser, setAuthUser, removeAuthUser } from '@/lib/authStorage';

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
  signUp: (email: string, password: string, fullName: string, passwordConfirmation?: string) => Promise<{ error: Error | null }>;
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
    // Kiểm tra và verify session từ storage khi component mount
    const checkAuth = async () => {
      const token = getAuthToken();
      const storedUser = getAuthUser();
      
      // Nếu không có token hoặc user, set trạng thái chưa đăng nhập
      if (!token || !storedUser) {
        setUser(null);
        setSession(null);
        setLoading(false);
        return;
      }

      try {
        // User data đã parsed
        const parsedUser = storedUser;
        
        // QUAN TRỌNG: Verify token với backend để đảm bảo còn hợp lệ
        // Gọi API để check user profile (sẽ fail nếu token expired/invalid)
        const response = await api.get('/auth/me');
        
        if (response.data && (response.data.data || response.data.user)) {
          // Token hợp lệ, cập nhật user data từ backend
          const validUser = response.data.data || response.data.user;
          setUser(validUser);
          setSession({ access_token: token, user: validUser });
          
          // Cập nhật lại storage với data mới nhất từ backend
          setAuthUser(validUser);
          
          console.log('✅ Token verified, user authenticated:', validUser.email);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error: any) {
        // Token không hợp lệ hoặc expired, clear toàn bộ
        console.warn('⚠️ Token verification failed, clearing auth data:', error.message);
        removeAuthToken();
        removeAuthUser();
        setUser(null);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

const signUp = async (email: string, password: string, fullName: string, passwordConfirmation?: string) => {
  try {
    const registerData: any = {
      name: fullName,
      email,
      password,
    };

    // Thêm password_confirmation nếu được cung cấp
    // Laravel thường yêu cầu field này để validation
    if (passwordConfirmation) {
      registerData.password_confirmation = passwordConfirmation;
    } else {
      // Nếu không có, dùng password làm confirmation
      registerData.password_confirmation = password;
    }

    const response = await api.post('/auth/register', registerData);
    
    console.log('✅ Registration successful:', email);
    return { error: null };
  } catch (error: any) {
    console.error('❌ Registration failed:', error.response?.data);
    
    let errorMessage = 'Đăng ký thất bại';
    
    if (error.response?.status === 422) {
      const errors = error.response?.data?.errors;
      if (errors) {
        // Ưu tiên các field theo thứ tự: name → email → password
        const fieldOrder = ['name', 'email', 'password', 'password_confirmation'];
        let found = false;
        for (const field of fieldOrder) {
          if (errors[field]) {
            const msg = Array.isArray(errors[field]) ? errors[field][0] : errors[field];
            errorMessage = msg;
            found = true;
            break;
          }
        }
        if (!found) {
          // Lấy lỗi đầu tiên bất kỳ
          const firstError = Object.values(errors)[0];
          errorMessage = Array.isArray(firstError) ? (firstError[0] as string) : String(firstError);
        }
      } else {
        errorMessage = error.response?.data?.message || 'Dữ liệu không hợp lệ';
      }
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }
    
    return { error: new Error(errorMessage) };
  }
};

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting login for:', email);
      
      const response = await api.post('/auth/login', {
        email,
        password,
      });
      
      console.log('📥 Login response:', response.data);
      
      // API trả về: { success, message, data: { user, access_token, ... } }
      // Hoặc: { user, access_token, ... }
      // Hoặc: { data: { user, access_token } }
      
      let responseData = response.data;
      
      // Nếu có nested data, unwrap nó
      if (responseData.data) {
        responseData = responseData.data;
      }
  
      // Extract token - thử nhiều locations
      const token = responseData.access_token || 
                   responseData.token || 
                   responseData.accessToken;
      
      // Extract user data - thử nhiều locations
      let userData = responseData.user || responseData;
      
      // Nếu userData vẫn chứa access_token/token, nghĩa là chưa đúng
      // Cần lấy nested user object
      if ((userData.access_token || userData.token) && userData.user) {
        userData = userData.user;
      }
      
      // Validate dữ liệu
      if (!token) {
        console.error('❌ Missing token in response');
        throw new Error('Không tìm thấy token trong response từ server');
      }
      
      if (!userData || !userData.email) {
        console.error('❌ Invalid user data in response:', userData);
        throw new Error('Dữ liệu user không hợp lệ từ server');
      }
      
      // Lưu token và user vào storage
      console.log('✅ Login successful:', userData.email);
      console.log('👤 User role:', userData.role_id || userData.role?.id || 'N/A');
      
      setAuthToken(token);
      setAuthUser(userData);
      
      // Set state
      setUser(userData);
      setSession({ access_token: token, user: userData });
      
      return { error: null };
    } catch (error: any) {
      console.error('❌ Login failed:', error.response?.data || error.message);
      
      let errorMessage = 'Đăng nhập thất bại';
      
      if (error.response?.status === 401) {
        errorMessage = 'Email hoặc mật khẩu không chính xác';
      } else if (error.response?.status === 403) {
        // Backend trả về: { message: "Login failed", errors: "Tài khoản đã bị khóa..." }
        // Lỗi thật nằm trong `errors` (string), không phải `message`
        const errorsField = error.response?.data?.errors;
        const serverMsg = typeof errorsField === 'string'
          ? errorsField
          : (error.response?.data?.message || '');

        if (serverMsg.toLowerCase().includes('khóa') || serverMsg.toLowerCase().includes('lock')) {
          errorMessage = 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.';
        } else if (serverMsg.toLowerCase().includes('xác nhận') || serverMsg.toLowerCase().includes('verify')) {
          errorMessage = 'Tài khoản chưa xác nhận email. Vui lòng kiểm tra hộp thư và nhấn link xác nhận.';
        } else {
          errorMessage = serverMsg || 'Truy cập bị từ chối. Vui lòng liên hệ quản trị viên.';
        }
      } else if (error.response?.status === 422) {
        const errors = error.response?.data?.errors;
        if (errors) {
          const fieldOrder = ['email', 'password'];
          let found = false;
          for (const field of fieldOrder) {
            if (errors[field]) {
              const msg = Array.isArray(errors[field]) ? errors[field][0] : errors[field];
              errorMessage = msg;
              found = true;
              break;
            }
          }
          if (!found) {
            const firstError = Object.values(errors)[0];
            errorMessage = Array.isArray(firstError) ? (firstError[0] as string) : String(firstError);
          }
        } else {
          errorMessage = error.response?.data?.message || 'Dữ liệu không hợp lệ';
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message && !error.response) {
        errorMessage = error.message;
      }
      
      return { error: new Error(errorMessage) };
    }
  };

  const signOut = async () => {
    try {
      // Gọi API logout (optional, backend có thể blacklist token)
      await api.post('/auth/logout');
      console.log('🚪 Logged out from server');
    } catch (error) {
      console.error('Logout API error:', error);
      // Vẫn tiếp tục clear localStorage dù API fail
    } finally {
      // Xóa TẤT CẢ auth data khỏi storage
      removeAuthToken();
      removeAuthUser();
      
      // Clear state
      setUser(null);
      setSession(null);
      
      console.log('✅ Auth data cleared');
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
