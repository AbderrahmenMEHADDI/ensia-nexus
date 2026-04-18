import { BASE_URL } from './apiClient';

const cacheKey = (userId: number) => `profile_picture_${userId}`;

export function getCachedProfilePicture(userId?: number): string | null {
  if (!userId) return null;
  try {
    return sessionStorage.getItem(cacheKey(userId));
  } catch {
    return null;
  }
}

export function setCachedProfilePicture(userId: number, value: string) {
  try {
    sessionStorage.setItem(cacheKey(userId), value);
  } catch {
    // Ignore storage errors (quota, privacy mode)
  }
}

export function clearCachedProfilePicture(userId: number) {
  try {
    sessionStorage.removeItem(cacheKey(userId));
  } catch {
    // Ignore
  }
}

export async function fetchAndCacheProfilePicture(userId: number): Promise<string | null> {
  try {
    // Use plain fetch to avoid apiClient adding Content-Type or 'include' credentials.
    // This prevents CORS preflight OPTIONS requests when following 307 redirects to external images.
    const response = await fetch(`${BASE_URL}/users/${userId}/profile-picture`, {
      method: 'GET',
      credentials: 'omit',
    });

    if (!response.ok) return null;

    const blob = await response.blob();

    // Check if it's actually an image blob or if there was a CORS/network redirect
    if (!blob || blob.size === 0 || blob.type.includes('json')) return null;

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read image data'));
      reader.readAsDataURL(blob);
    });

    setCachedProfilePicture(userId, dataUrl);
    return dataUrl;
  } catch {
    return null;
  }
}
