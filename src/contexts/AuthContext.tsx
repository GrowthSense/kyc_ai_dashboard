import React, { createContext, useContext, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { User, LoginCredentials, ResetPasswordData, UserRole, ROLE_PERMISSIONS } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  validateSession: () => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string; demoCode?: string }>;
  resetPassword: (data: ResetPasswordData) => Promise<{ success: boolean; error?: string }>;
  hasPermission: (permission: string) => boolean;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = useAuthStore();

  useEffect(() => {
    store.restoreSession();
  }, []);

  const adaptedUser: User | null = store.user
    ? {
        id: store.user.id,
        email: store.user.email,
        name: store.user.name,
        role: store.user.role as UserRole,
        department: store.user.department,
        avatar_url: null,
        is_active: store.user.isActive,
        last_login: store.user.lastLoginAt,
        created_at: store.user.createdAt,
        updated_at: store.user.updatedAt,
      }
    : null;

  const login = async (credentials: LoginCredentials) => {
    return store.login(credentials.email, credentials.password);
  };

  const logout = async () => {
    store.logout();
  };

  const validateSession = async () => {
    return store.isAuthenticated;
  };

  const requestPasswordReset = async (_email: string) => {
    return { success: false, error: 'Password reset is not yet implemented. Contact your administrator.' };
  };

  const resetPassword = async (_data: ResetPasswordData) => {
    return { success: false, error: 'Password reset is not yet implemented. Contact your administrator.' };
  };

  const hasPermission = (permission: string) => {
    if (!store.user) return false;
    const perms = ROLE_PERMISSIONS[store.user.role as UserRole] || [];
    return perms.includes(permission);
  };

  const clearError = () => store.clearError();

  return (
    <AuthContext.Provider
      value={{
        user: adaptedUser,
        token: store.apiKey,
        isAuthenticated: store.isAuthenticated,
        isLoading: store.isLoading,
        error: store.error,
        login,
        logout,
        validateSession,
        requestPasswordReset,
        resetPassword,
        hasPermission,
        clearError,
      }}
    >
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
