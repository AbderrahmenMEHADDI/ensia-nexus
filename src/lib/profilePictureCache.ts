import {api, BASE_URL} from './apiClient';
import {UserProfileImageURL} from "@/types";

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
    const profile_url = await api.get<UserProfileImageURL>(`/users/${userId}/profile-picture-url`)

    let url = profile_url.profile_picture_url;
    if (!url) return null;

    if (url.startsWith('/')) {
      url = `${BASE_URL}${url}`;
    }

    setCachedProfilePicture(userId, url);
    return url;
  } catch {
    return null;
  }
}
