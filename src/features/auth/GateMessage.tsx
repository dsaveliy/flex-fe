import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme';
import { Glass, Icon, type IconName, Text } from '@/ui';

type GateMessageProps = {
  icon: IconName;
  title: string;
  text?: string | null;
  /** цвет текста: ошибка или обычная подсказка */
  tone?: 'muted' | 'negative';
  children?: ReactNode;
};

/** шапка экранов криптораздела до входа: значок в стеклянном круге, заголовок, пояснение */
export function GateMessage({ icon, title, text, tone = 'muted', children }: GateMessageProps) {
  const theme = useTheme();
  const badge = 64;

  return (
    <View style={{ alignItems: 'center', gap: theme.spacing.md }}>
      <Glass
        variant="regular"
        radius={badge / 2}
        style={{ width: badge, height: badge, alignItems: 'center', justifyContent: 'center' }}
      >
        <Icon name={icon} size={28} color={theme.colors.accent} />
      </Glass>
      <Text variant="title" align="center">
        {title}
      </Text>
      {text ? (
        <Text variant="body" color={tone === 'negative' ? 'negative' : 'textMuted'} align="center">
          {text}
        </Text>
      ) : null}
      {children}
    </View>
  );
}
