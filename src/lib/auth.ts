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
  async signInWithGoogle(userId?: number): Promise<User> {
    // For now, this might just be a redirect or a post to a trigger endpoint
    // until the full OAuth flow is linked.
    return api.post<User>('/auth/google', { user_id: userId });
  },

  /**
   * Sign out the current user.
   * Backend clears the HttpOnly cookies.
   */
  async signOut(): Promise<void> {
    return api.post<void>('/auth/logout');
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
