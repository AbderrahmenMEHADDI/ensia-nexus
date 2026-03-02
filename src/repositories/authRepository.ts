import type { User } from '@/types';
import { users } from '@/data/mockData';

// This repository abstracts all auth API calls.
// Replace the mock implementations with real API calls when backend is ready.

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export const authRepository = {
  /**
   * Sign in with Google OAuth.
   * TODO: Replace with real Google OAuth flow (e.g., POST /api/auth/google)
   */
  async signInWithGoogle(): Promise<User> {
    await delay(800);
    // Mock: return first user as the authenticated user
    return users[0];
  },

  /**
   * Sign out the current user.
   * TODO: Replace with real sign-out (e.g., POST /api/auth/logout)
   */
  async signOut(): Promise<void> {
    await delay(300);
  },

  /**
   * Get the current session user (e.g., from a cookie/token).
   * TODO: Replace with real session check (e.g., GET /api/auth/me)
   */
  async getCurrentUser(): Promise<User | null> {
    await delay(200);
    return null;
  },
};
