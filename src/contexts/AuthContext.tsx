import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import type { User, UserRole } from '@/types';
import { authProvider } from '@/lib/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const TEACHER_ROLES: UserRole[] = ['MCA', 'PROFESSOR', 'DOCTOR', 'TEACHER'];

interface AuthContextType extends AuthState {
  signInWithGoogle: (userId?: number) => Promise<void>;
  signOut: () => Promise<void>;
  role: UserRole | null;
  hasRole: (role: UserRole | UserRole[]) => boolean;
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
      const user = await authProvider.getCurrentUser();
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
      const user = await authProvider.signInWithGoogle(userId);
      setState({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.error('Sign in failed:', error);
      setState(s => ({ ...s, isLoading: false }));
    }
  }, []);

  const signOut = useCallback(async () => {
    setState(s => ({ ...s, isLoading: true }));
    try {
      await authProvider.signOut();
      setState({ user: null, isAuthenticated: false, isLoading: false });
    } catch (error) {
      console.error('Sign out failed:', error);
      setState(s => ({ ...s, isLoading: false }));
    }
  }, []);

  const role = state.user?.role || null;

  const hasRole = useCallback((role: UserRole | UserRole[]) => {
    if (!state.user) return false;
    const roles = Array.isArray(role) ? role : [role];

    // Support virtual 'TEACHER' role which includes MCA, PROFESSOR, DOCTOR
    if (roles.includes('TEACHER')) {
      if (TEACHER_ROLES.includes(state.user.role)) return true;
    }

    return roles.includes(state.user.role);
  }, [state.user]);

  const value = {
    ...state,
    signInWithGoogle,
    signOut,
    role,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
