/**
 * Auth Storage Wrapper
 * 
 * Sử dụng sessionStorage thay vì localStorage để:
 * - Mỗi tab có thể login tài khoản khác nhau
 * - Vẫn persist qua reload (F5)
 * - Chỉ mất khi đóng tab
 * 
 * ✅ Tab 1: Login User → sessionStorage riêng của tab 1
 * ✅ Tab 2: Login Owner → sessionStorage riêng của tab 2
 * ✅ Real-time sync vẫn hoạt động bình thường
 */

// Storage keys
const AUTH_TOKEN_KEY = 'access_token';
const AUTH_USER_KEY = 'user';
const AUTH_TIMESTAMP_KEY = 'auth_timestamp';

/**
 * Chọn storage type để dùng
 * - sessionStorage: Mỗi tab độc lập, persist qua reload, mất khi đóng tab
 * - localStorage: Share giữa các tab, persist vĩnh viễn
 */
const STORAGE: Storage = sessionStorage; // ⬅️ THAY ĐỔI Ở ĐÂY

// ========== AUTH TOKEN ==========

export const getAuthToken = (): string | null => {
  return STORAGE.getItem(AUTH_TOKEN_KEY);
};

export const setAuthToken = (token: string): void => {
  STORAGE.setItem(AUTH_TOKEN_KEY, token);
  STORAGE.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString());
  console.log('✅ Auth token saved to', STORAGE === sessionStorage ? 'sessionStorage' : 'localStorage');
};

export const removeAuthToken = (): void => {
  STORAGE.removeItem(AUTH_TOKEN_KEY);
  STORAGE.removeItem(AUTH_TIMESTAMP_KEY);
};

// ========== AUTH USER ==========

export const getAuthUser = (): any | null => {
  const userStr = STORAGE.getItem(AUTH_USER_KEY);
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch (e) {
    console.error('Error parsing user data:', e);
    return null;
  }
};

export const setAuthUser = (user: any): void => {
  STORAGE.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

export const removeAuthUser = (): void => {
  STORAGE.removeItem(AUTH_USER_KEY);
};

// ========== AUTH TIMESTAMP ==========

export const getAuthTimestamp = (): string | null => {
  return STORAGE.getItem(AUTH_TIMESTAMP_KEY);
};

// ========== CLEAR ALL ==========

export const clearAuthData = (): void => {
  console.log('🧹 Clearing all auth data from', STORAGE === sessionStorage ? 'sessionStorage' : 'localStorage');
  removeAuthToken();
  removeAuthUser();
  STORAGE.removeItem(AUTH_TIMESTAMP_KEY);
};

// ========== UTILITIES ==========

export const hasAuthToken = (): boolean => {
  return !!getAuthToken();
};

export const getAuthInfo = () => {
  const token = getAuthToken();
  const user = getAuthUser();
  const timestamp = getAuthTimestamp();
  
  return {
    hasToken: !!token,
    tokenPreview: token ? `${token.substring(0, 20)}...` : null,
    user: user,
    loginTime: timestamp ? new Date(parseInt(timestamp)).toLocaleString('vi-VN') : null,
    tokenAge: timestamp ? `${Math.floor((Date.now() - parseInt(timestamp)) / 1000 / 60)} phút` : null,
    storageType: STORAGE === sessionStorage ? 'sessionStorage' : 'localStorage',
  };
};

// ========== DEVELOPMENT HELPERS ==========

if (import.meta.env.DEV) {
  (window as any).authStorage = {
    getToken: getAuthToken,
    setToken: setAuthToken,
    removeToken: removeAuthToken,
    getUser: getAuthUser,
    setUser: setAuthUser,
    removeUser: removeAuthUser,
    clear: clearAuthData,
    info: getAuthInfo,
    storageType: STORAGE === sessionStorage ? 'sessionStorage' : 'localStorage',
  };
  
  console.log('🔐 Auth Storage initialized:', STORAGE === sessionStorage ? 'sessionStorage (tab-isolated)' : 'localStorage (shared)');
  console.log('🛠️ Debug helpers: window.authStorage');
}

export default {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  getAuthUser,
  setAuthUser,
  removeAuthUser,
  getAuthTimestamp,
  clearAuthData,
  hasAuthToken,
  getAuthInfo,
};
