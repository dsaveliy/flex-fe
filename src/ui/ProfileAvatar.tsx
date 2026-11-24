import { useState } from 'react';
import { Image } from 'react-native';

import { API_BASE_URL, type User } from '@/api';

import { Glass } from './Glass';
import { Text } from './Text';

type Props = {
  user?: User;
  size: number;
  interactive?: boolean;
};

export function ProfileAvatar({ user, size, interactive }: Props) {
  const [failedUri, setFailedUri] = useState<string>();
  const path = user?.avatarUrl;
  const uri = path?.startsWith('/profile/avatars/') ? `${API_BASE_URL.replace(/\/$/, '')}${path}` : path;

  return (
    <Glass
      variant="regular"
      interactive={interactive}
      radius={size / 2}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      {uri && failedUri !== uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          onError={() => setFailedUri(uri)}
        />
      ) : (
        <Text
          variant="bodyStrong"
          color="accent"
          style={{ fontSize: size * 0.36, lineHeight: size * 0.44 }}
        >
          {user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : ''}
        </Text>
      )}
    </Glass>
  );
}
