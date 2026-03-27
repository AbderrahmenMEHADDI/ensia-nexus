import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import type { User, UserRole } from '@/types';
import { authProvider } from '@/lib/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialLoading: boolean;
}

export const TEACHER_ROLES: UserRole[] = ['TEACHER'];

interface AuthContextType extends AuthState {
  signIn: (credentials: { email: string; password: string }) => Promise<void>;
  signInWithGoogle: (idToken?: string) => Promise<void>;
  signUp: (data: any) => Promise<void>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
  role: UserRole | null;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  isTeacher: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true, // For individual actions
    isInitialLoading: true, // For the very first check
  });

  const checkAuth = useCallback(async () => {
    try {
      const user = await authProvider.getCurrentUser();
      setState({
        user,
        isAuthenticated: !!user,
        isLoading: false,
        isInitialLoading: false,
      });
    } catch (error) {
      console.error('Auth check failed:', error);
      setState({ user: null, isAuthenticated: false, isLoading: false, isInitialLoading: false });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const signIn = useCallback(async (credentials: { email: string; password: string }) => {
    setState(s => ({ ...s, isLoading: true }));
    try {
      const user = await authProvider.signInWithGoogle(userId);
      setState(s => ({ ...s, user, isAuthenticated: true, isLoading: false, isInitialLoading: false }));
    } catch (error) {
      console.error('Sign in failed:', error);
      setState(s => ({ ...s, isLoading: false }));
      throw error;
    }
  }, []);

  const signInWithGoogle = useCallback(async (idToken?: string) => {
    setState(s => ({ ...s, isLoading: true }));
    try {
      const user = await authProvider.signInWithGoogle(idToken);
      setState({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.error('Sign in failed:', error);
      setState(s => ({ ...s, isLoading: false }));
      throw error;
    }
  }, []);

  const signUp = useCallback(async (data: any) => {
    setState(s => ({ ...s, isLoading: true }));
    try {
      const user = await authProvider.signup(data);
      setState(s => ({ ...s, user, isAuthenticated: true, isLoading: false, isInitialLoading: false }));
    } catch (error) {
      console.error('Sign up failed:', error);
      setState(s => ({ ...s, isLoading: false }));
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    setState(s => ({ ...s, isLoading: true }));
    try {
      await authProvider.signOut();
      setState(s => ({ ...s, user: null, isAuthenticated: false, isLoading: false, isInitialLoading: false }));
    } catch (error) {
      console.error('Sign out failed:', error);
      setState(s => ({ ...s, isLoading: false }));
    }
  }, []);

  const role = state.user?.role || null;

  const hasRole = useCallback(
    (role: UserRole | UserRole[]) => {
      if (!state.user) return false;
      const roles = Array.isArray(role) ? role : [role];

      if (roles.includes('TEACHER') && state.user.role === 'TEACHER') return true;
      if (roles.includes('ADMIN') && state.user.role === 'ADMIN') return true;
      if (roles.includes('STUDENT') && state.user.role === 'STUDENT') return true;

      return roles.includes(state.user.role as UserRole);
    },
    [state.user]
  );

  const isTeacher = hasRole('TEACHER');
  const isAdmin = hasRole('ADMIN');

  const value = {
    ...state,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    checkAuth,
    role,
    hasRole,
    isTeacher,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
