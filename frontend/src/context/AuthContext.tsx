import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authAPI } from '../services/api';
import { ensureCsrfToken } from '../utils/csrf';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (username: string, email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  isAdmin: boolean;
  isEditor: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ensureCsrfToken().catch(() => {});
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const { user } = await authAPI.getCurrentUser();
      setUser(user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(username: string, password: string) {
    const { user } = await authAPI.login(username, password);
    setUser(user);
  }

  async function logout() {
    await authAPI.logout();
    setUser(null);
  }

  async function register(username: string, email: string, password: string, firstName?: string, lastName?: string) {
    const { user } = await authAPI.register(username, email, password, undefined, firstName, lastName);
    setUser(user);
  }

  function hasPermission(permission: string): boolean {
    if (!user) return false;

    const rolePermissions: Record<string, string[]> = {
      admin: ['create:whiskey', 'read:whiskey', 'update:whiskey', 'delete:whiskey', 'manage:users'],
      editor: ['create:whiskey', 'read:whiskey', 'update:whiskey'],
    };

    return rolePermissions[user.role]?.includes(permission) || false;
  }

  const isAdmin = user?.role === 'admin';
  const isEditor = user?.role === 'editor' || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        register,
        hasPermission,
        isAdmin,
        isEditor,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
