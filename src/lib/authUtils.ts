/**
 * Auth Utilities - Helper functions for authentication management
 * 
 * Usage in browser console:
 * - window.clearAuth() - Clear all auth data
 * - window.getAuthInfo() - Get current auth status
 */

// Clear tất cả auth data từ localStorage
export const clearAuthData = (): void => {
  console.log('🧹 Clearing all authentication data...');
  
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
  localStorage.removeItem('auth_timestamp');
  
  console.log('✅ Auth data cleared. Please refresh the page.');
};

// Get auth info để debug
export const getAuthInfo = (): object => {
  const token = localStorage.getItem('access_token');
  const user = localStorage.getItem('user');
  const timestamp = localStorage.getItem('auth_timestamp');
  
  let parsedUser = null;
  try {
    parsedUser = user ? JSON.parse(user) : null;
  } catch (e) {
    parsedUser = 'Invalid JSON';
  }
  
  const info = {
    hasToken: !!token,
    tokenPreview: token ? `${token.substring(0, 20)}...` : null,
    user: parsedUser,
    loginTime: timestamp ? new Date(parseInt(timestamp)).toLocaleString('vi-VN') : null,
    tokenAge: timestamp ? `${Math.floor((Date.now() - parseInt(timestamp)) / 1000 / 60)} minutes` : null,
  };
  
  console.log('🔐 Current Auth Info:', info);
  return info;
};

// Check if token is expired (if backend returns exp in token)
export const isTokenExpired = (): boolean => {
  const token = localStorage.getItem('access_token');
  if (!token) return true;
  
  try {
    // JWT tokens có format: header.payload.signature
    const payload = token.split('.')[1];
    if (!payload) return true;
    
    const decoded = JSON.parse(atob(payload));
    
    if (decoded.exp) {
      const expirationTime = decoded.exp * 1000; // Convert to milliseconds
      const isExpired = Date.now() >= expirationTime;
      
      if (isExpired) {
        console.warn('⚠️ Token has expired');
      }
      
      return isExpired;
    }
  } catch (e) {
    console.error('Error decoding token:', e);
  }
  
  return false;
};

// Force logout - clear everything and redirect
export const forceLogout = (): void => {
  clearAuthData();
  window.location.href = '/auth';
};

// Export to window for easy access in console (development only)
if (process.env.NODE_ENV === 'development') {
  (window as any).clearAuth = clearAuthData;
  (window as any).getAuthInfo = getAuthInfo;
  (window as any).isTokenExpired = isTokenExpired;
  (window as any).forceLogout = forceLogout;
  
  console.log('🛠️ Auth utilities available:');
  console.log('  - window.clearAuth() - Clear all auth data');
  console.log('  - window.getAuthInfo() - Get current auth info');
  console.log('  - window.isTokenExpired() - Check if token expired');
  console.log('  - window.forceLogout() - Force logout and redirect');
}

// Validation helper: Check if user object is valid
export const isValidUser = (user: any): boolean => {
  if (!user) return false;
  if (typeof user !== 'object') return false;
  if (!user.id || !user.email) return false;
  return true;
};

// Validation helper: Check if token format is valid (basic check)
export const isValidTokenFormat = (token: string): boolean => {
  if (!token || typeof token !== 'string') return false;
  
  // JWT tokens should have 3 parts separated by dots
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  // Each part should be base64
  try {
    atob(parts[0]);
    atob(parts[1]);
    return true;
  } catch (e) {
    return false;
  }
};

// Auto-clear invalid auth data on import
const autoCleanup = () => {
  const token = localStorage.getItem('access_token');
  const user = localStorage.getItem('user');
  
  if (token && !isValidTokenFormat(token)) {
    console.warn('⚠️ Invalid token format detected, clearing...');
    clearAuthData();
    return;
  }
  
  if (user) {
    try {
      const parsedUser = JSON.parse(user);
      if (!isValidUser(parsedUser)) {
        console.warn('⚠️ Invalid user data detected, clearing...');
        clearAuthData();
      }
    } catch (e) {
      console.warn('⚠️ Corrupted user data detected, clearing...');
      clearAuthData();
    }
  }
};

// Run auto-cleanup on module load
autoCleanup();

export default {
  clearAuthData,
  getAuthInfo,
  isTokenExpired,
  forceLogout,
  isValidUser,
  isValidTokenFormat,
};
