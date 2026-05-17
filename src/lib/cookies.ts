/**
 * Utility functions for managing browser cookies in the frontend.
 */

export const setCookie = (name: string, value: string, days = 365) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

export const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return decodeURIComponent(parts.pop()?.split(';').shift() || '');
  }
  return null;
};

export const getAppliedCollaborations = (): number[] => {
  const cookie = getCookie('applied_collaborations');
  if (!cookie) return [];
  return cookie
    .split(',')
    .map(id => parseInt(id.trim(), 10))
    .filter(id => !isNaN(id));
};

export const markCollaborationAsApplied = (callId: number) => {
  const applied = getAppliedCollaborations();
  if (!applied.includes(callId)) {
    applied.push(callId);
    setCookie('applied_collaborations', applied.join(','));
  }
};
