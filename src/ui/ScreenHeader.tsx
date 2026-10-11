import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { AvatarButton } from './AvatarButton';
import { Text } from './Text';

export type ScreenHeaderProps = {
  title: string;
  /** мелкая строка над заголовком (приветствие) */
  eyebrow?: string;
  /** мелкая строка под заголовком */
  subtitle?: string;
  /** собственный заголовок вместо текста (логотип Flex Crypto); `title` остаётся подписью для VoiceOver */
  titleNode?: ReactNode;
  /** значок сразу после заголовка (солнце/месяц в приветствии) */
  titleAccessory?: ReactNode;
  /** дополнительные кнопки слева от аватара */
  actions?: ReactNode;
  /** не рисовать аватар: экран ставит его сам в `actions` (стол Crypto) */
  hideAvatar?: boolean;
  /** `large` — крупное приветствие главного экрана */
  size?: 'default' | 'large';
};

/** шапка вкладки: заголовок слева, действия и аватар профиля справа */
export function ScreenHeader({
  title,
  eyebrow,
  subtitle,
  titleNode,
  titleAccessory,
  actions,
  hideAvatar = false,
  size = 'default',
}: ScreenHeaderProps) {
  const theme = useTheme();
  const large = size === 'large';

  return (
    <View style={[styles.row, { gap: theme.spacing.md }]}>
      <View style={styles.titles}>
        {eyebrow ? (
          <Text variant={large ? 'greeting' : 'body'} color="textMuted">
            {eyebrow}
          </Text>
        ) : null}
        {titleNode ? (
          <View accessible accessibilityRole="header" accessibilityLabel={title}>
            {titleNode}
          </View>
        ) : (
          <View style={[styles.row, { gap: theme.spacing.sm }]}>
            <Text variant={large ? 'largeTitle' : 'title'} numberOfLines={1} style={styles.shrink}>
              {title}
            </Text>
            {titleAccessory}
          </View>
        )}
        {subtitle ? (
          <Text variant="caption" color="textMuted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={[styles.row, { gap: theme.spacing.sm }]}>
        {actions}
        {hideAvatar ? null : (
          <AvatarButton size={large ? theme.sizes.avatarLarge : theme.sizes.avatar} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titles: {
    flex: 1,
  },
  shrink: {
    flexShrink: 1,
  },
});
