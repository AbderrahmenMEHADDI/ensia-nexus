import { api, BASE_URL } from './apiClient';
import type { User } from '@/types';

export async function fetchProfilePicture(userId: number): Promise<string | null> {
  try {
    const user = await api.get<User>(`/users/${userId}`);

    let url = user.profile_picture_url;
    if (!url) return null;

    if (url.startsWith('/')) {
      url = `${BASE_URL}${url}`;
    }

    return url;
  } catch {
    return null;
  }
}
