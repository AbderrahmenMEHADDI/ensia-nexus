import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import type { User } from '@/types';
import { authRepository } from '@/repositories/authRepository';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  signInWithGoogle: (userId?: number) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  isPartner: boolean;
  hasRole: (role: string | string[]) => boolean;
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
    isLoading: true, // Start with loading while we check the session
  });

  const checkAuth = useCallback(async () => {
    try {
      const user = await authRepository.getCurrentUser();
      setState({
        user,
        isAuthenticated: !!user,
        isLoading: false,
      });
    } catch (error) {
      console.error('Auth check failed:', error);
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const signInWithGoogle = useCallback(async (userId?: number) => {
    setState(s => ({ ...s, isLoading: true }));
    try {
      const user = await authRepository.signInWithGoogle(userId);
      setState({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.error('Sign in failed:', error);
      setState(s => ({ ...s, isLoading: false }));
    }
  }, []);

  const signOut = useCallback(async () => {
    setState(s => ({ ...s, isLoading: true }));
    try {
      await authRepository.signOut();
      setState({ user: null, isAuthenticated: false, isLoading: false });
    } catch (error) {
       console.error('Sign out failed:', error);
       setState(s => ({ ...s, isLoading: false }));
    }
  }, []);

  const isAdmin = state.user?.role === 'ADMIN';
  const isTeacher = state.user?.role === 'TEACHER';
  const isStudent = state.user?.role === 'STUDENT';
  const isPartner = state.user?.role === 'PARTNER';

  const hasRole = useCallback((role: string | string[]) => {
    if (!state.user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(state.user.role);
  }, [state.user]);

  const value = {
    ...state,
    signInWithGoogle,
    signOut,
    isAdmin,
    isTeacher,
    isStudent,
    isPartner,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
