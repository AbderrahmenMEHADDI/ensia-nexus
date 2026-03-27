import type { User } from '@/types';
import { api } from './apiClient';

/**
 * This repository abstracts all auth API calls.
 * Backend handles the session via HttpOnly cookies.
 */
export const authProvider = {
  /**
   * Sign in with Google OAuth.
   * Backend handles the redirect and sets HttpOnly cookies.
   */
  async signInWithGoogle(idToken?: string): Promise<User> {
    return api.post<User>('/auth/google', { id_token: idToken });
  },

  /**
   * Sign out the current user.
   * Backend clears the HttpOnly cookies.
   */
  async signOut(): Promise<void> {
    return api.delete<void>('/auth/logout');
  },

  /**
   * Get the current session user (e.g., from a cookie/token).
   * Backend checks the server-only cookie.
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      return await api.get<User>('/auth/me');
    } catch (error) {
      // If unauthorized, return null
      return null;
    }
  },

  /**
   * Log in with email and password.
   */
  async login(credentials: any): Promise<User> {
    return api.post<User>('/auth/login', credentials);
  },

  /**
   * Sign up with user data.
   */
  async signup(data: any): Promise<User> {
    return api.post<User>('/auth/signup', data);
  },
};
