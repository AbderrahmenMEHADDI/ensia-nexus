import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { fetchProfilePicture } from '@/lib/profilePictureCache';

interface ProfileAvatarProps {
  userId?: number;
  name?: string;
  imageUrl?: string | null;
  className?: string;
  textClassName?: string;
  imgClassName?: string;
}

export function ProfileAvatar({
  userId,
  name,
  imageUrl = null,
  className,
  textClassName,
  imgClassName,
}: ProfileAvatarProps) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(imageUrl || null);

  useEffect(() => {
    setResolvedUrl(imageUrl || null);
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
