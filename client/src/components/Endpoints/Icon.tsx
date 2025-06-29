import React, { memo, useState, useMemo } from 'react';
import type { TUser } from 'librechat-data-provider';
import type { IconProps } from '~/common';
import MessageEndpointIcon from './MessageEndpointIcon';
import { useAuthContext } from '~/hooks/AuthContext';
import useAvatar from '~/hooks/Messages/useAvatar';
import useLocalize from '~/hooks/useLocalize';
import { UserIcon } from '~/components/svg';
import { createAvatar } from '@dicebear/core';
import { initials } from '@dicebear/collection';
import { cn } from '~/utils';

type UserAvatarProps = {
  size: number;
  user?: TUser;
  avatarSrc: string;
  username: string;
  className?: string;
};

const UserAvatar = memo(({ size, user, avatarSrc, username, className }: UserAvatarProps) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const renderDefaultAvatar = () => (
    <div
      style={{
        backgroundColor: 'rgb(121, 137, 255)',
        width: '20px',
        height: '20px',
        boxShadow: 'rgba(240, 246, 252, 0.1) 0px 0px 0px 1px',
      }}
      className="relative flex h-9 w-9 items-center justify-center rounded-sm p-1 text-white"
    >
      <UserIcon />
    </div>
  );

  return (
    <div
      title={username}
      style={{
        width: size,
        height: size,
      }}
      className={cn('relative flex items-center justify-center', className ?? '')}
    >
      {(!(user?.avatar ?? '') && (!(user?.username ?? '') || user?.username.trim() === '')) ||
      imageError ? (
          renderDefaultAvatar()
        ) : (
          <img
            className="rounded-full"
            src={(user?.avatar ?? '') || avatarSrc}
            alt="avatar"
            onError={handleImageError}
          />
        )}
    </div>
  );
});

UserAvatar.displayName = 'UserAvatar';

const Icon: React.FC<IconProps> = memo((props) => {
  const { user } = useAuthContext();
  const { size = 30, isCreatedByUser } = props;

  const avatarSrc = useAvatar(user);
  const localize = useLocalize();

  // Generate Meld AI avatar with same styling as user avatar but red background
  const meldAiAvatar = useMemo(() => {
    const avatar = createAvatar(initials, {
      seed: 'Meld AI',
      fontFamily: ['Verdana'],
      fontSize: 36,
      backgroundColor: ['BD3C28'], // Use the rust red color
      textColor: ['ffffff'], // White text
    });

    try {
      return avatar.toDataUri();
    } catch (error) {
      console.error('Failed to generate Meld AI avatar:', error);
      return '';
    }
  }, []);

  if (isCreatedByUser) {
    const username = user?.name ?? user?.username ?? localize('com_nav_user');
    return (
      <UserAvatar
        size={size}
        user={user}
        avatarSrc={avatarSrc}
        username={username}
        className={props.className}
      />
    );
  }

  // Show Meld AI avatar with same styling as user avatars
  return (
    <div
      title="Meld AI"
      style={{
        width: size,
        height: size,
      }}
      className={cn('relative flex items-center justify-center', props.className ?? '')}
    >
      <img
        className="rounded-full"
        src={meldAiAvatar}
        alt="Meld AI"
        style={{ height: size, width: size }}
      />
    </div>
  );
});

Icon.displayName = 'Icon';

export default Icon;
