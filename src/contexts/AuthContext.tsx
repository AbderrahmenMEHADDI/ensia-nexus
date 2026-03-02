import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { User } from '@/types';
import { authRepository } from '@/repositories/authRepository';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
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
    isLoading: false,
  });

  const signInWithGoogle = useCallback(async () => {
    setState(s => ({ ...s, isLoading: true }));
    try {
      const user = await authRepository.signInWithGoogle();
      setState({ user, isAuthenticated: true, isLoading: false });
    } catch {
      setState(s => ({ ...s, isLoading: false }));
    }
  }, []);

  const signOut = useCallback(async () => {
    setState(s => ({ ...s, isLoading: true }));
    await authRepository.signOut();
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
