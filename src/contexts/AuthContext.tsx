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
  signInWithGoogle: (idToken?: string) => Promise<{ user: User; is_new: boolean }>;
  signUp: (data: any) => Promise<void>;
  completeRegistration: (data: any) => Promise<void>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<User | null>;
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
      return user;
    } catch (error) {
      console.error('Auth check failed:', error);
      setState({ user: null, isAuthenticated: false, isLoading: false, isInitialLoading: false });
      return null;
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const handleUnauthorized = () => {
      // Clear auth state to force redirect to signin
      setState(s => ({
        ...s,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialLoading: false,
      }));
    };
    
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const signIn = useCallback(async (credentials: { email: string; password: string }) => {
    setState(s => ({ ...s, isLoading: true }));
    try {
      const user = await authProvider.login(credentials);
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
      const res = await authProvider.signInWithGoogle(idToken);
      setState(s => ({ ...s, user: res.user, isAuthenticated: true, isLoading: false, isInitialLoading: false }));
      return res;
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

  const completeRegistration = useCallback(async (data: any) => {
    setState(s => ({ ...s, isLoading: true }));
    try {
      const user = await authProvider.completeRegistration(data);
      setState(s => ({ ...s, user, isAuthenticated: true, isLoading: false, isInitialLoading: false }));
    } catch (error) {
      console.error('Complete registration failed:', error);
      setState(s => ({ ...s, isLoading: false }));
      throw error;
    }
  }, []);

  const role = state.user?.role || null;

  const hasRole = useCallback(
    (role: UserRole | UserRole[]) => {
      if (!state.user) return false;
      const roles = Array.isArray(role) ? role : [role];
      return roles.includes(state.user.role as UserRole);
    },
    [state.user]
  );

  const isTeacher = state.user?.role === 'TEACHER';
  const isAdmin = state.user?.role === 'ADMIN';

  const value = {
    ...state,
    signIn,
    signInWithGoogle,
    signUp,
    completeRegistration,
    signOut,
    checkAuth,
    role,
    hasRole,
    isTeacher,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
