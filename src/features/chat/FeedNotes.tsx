import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';
import { Text } from '@/ui';

import { dayLabel } from './feed';

/** капсула «Сегодня» / «12 окт.» между днями переписки */
export function DateSeparator({ iso }: { iso: string }) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.center, { paddingVertical: theme.spacing.md }]}>
      <View
        style={{
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.xs,
          borderRadius: theme.radii.pill,
          backgroundColor: theme.colors.glassFill,
        }}
      >
        <Text variant="micro" color="textMuted" accessibilityRole="header">
          {dayLabel(iso, t)}
        </Text>
      </View>
    </View>
  );
}

/** системное событие посреди ленты: «Обращение закрыто», «Оператор подключился» */
export function SystemMessage({ text }: { text: string }) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.center,
        { paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.xxxl },
      ]}
    >
      <Text variant="caption" color="textMuted" align="center">
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
  },
});
