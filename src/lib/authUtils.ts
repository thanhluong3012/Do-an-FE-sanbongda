/**
 * Auth Utilities - Helper functions for authentication management
 * 
 * Usage in browser console:
 * - window.clearAuth() - Clear all auth data
 * - window.getAuthInfo() - Get current auth status
 */

import { getAuthToken, getAuthUser, getAuthTimestamp, clearAuthData as clearStorage } from './authStorage';

// Clear tất cả auth data
export const clearAuthData = (): void => {
  console.log('🧹 Clearing all authentication data...');
  clearStorage();
  console.log('✅ Auth data cleared. Please refresh the page.');
};

// Get auth info để debug
export const getAuthInfo = (): object => {
  const token = getAuthToken();
  const user = getAuthUser();
  const timestamp = getAuthTimestamp();
  
  const parsedUser = user || null;
  
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
  const token = getAuthToken();
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
if (import.meta.env.DEV) {
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
  const token = getAuthToken();
  const user = getAuthUser();
  
  if (token && !isValidTokenFormat(token)) {
    console.warn('⚠️ Invalid token format detected, clearing...');
    clearAuthData();
    return;
  }
  
  if (user && !isValidUser(user)) {
    console.warn('⚠️ Invalid user data detected, clearing...');
    clearAuthData();
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
