import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { fetchProfilePicture } from '@/lib/profilePictureCache';
import { BASE_URL } from '@/lib/apiClient';

interface ProfileAvatarProps {
  userId?: number;
  name?: string;
  imageUrl?: string | null;
  className?: string;
  textClassName?: string;
  imgClassName?: string;
  title?: string;
}

const getFullUrl = (url: string | null | undefined) => {
  if (!url) return null;
  if (url.startsWith('/')) {
    const base = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
    return `${base}${url}`;
  }
  return url;
};

export function ProfileAvatar({
  userId,
  name,
  imageUrl = null,
  className,
  textClassName,
  imgClassName,
  title,
}: ProfileAvatarProps) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(() => getFullUrl(imageUrl));

  useEffect(() => {
    setResolvedUrl(getFullUrl(imageUrl));
  }, [imageUrl]);

  useEffect(() => {
    if (!userId || imageUrl) return;

    let cancelled = false;

    fetchProfilePicture(userId).then((url) => {
      if (!cancelled && url) {
        setResolvedUrl(url);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [userId, imageUrl]);

  const initials = name
    ? name.split(' ').map(n => n[0]).join('').slice(0, 2)
    : '';

  return (
    <div className={cn('flex items-center justify-center overflow-hidden', className)}>
      {resolvedUrl ? (
        <img
          src={resolvedUrl}
          alt={name || 'User'}
          className={cn('h-full w-full object-cover', imgClassName)}
          onError={() => setResolvedUrl(null)}
        />
      ) : (
        <span className={textClassName}>{initials}</span>
      )}
    </div>
  );
}
