import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { Touchable } from './Pressable';
import { Text } from './Text';

export type ListRowProps = {
  title: string;
  subtitle?: string;
  /** ведущий слот: аватар, значок монеты, иконка */
  left?: ReactNode;
  /** завершающий слот: сумма, шеврон, переключатель */
  right?: ReactNode;
  onPress?: () => void;
  showDivider?: boolean;
  style?: ViewStyle;
};

/** универсальная строка для транзакций, рынков и настроек аккаунта */
export function ListRow({
  title,
  subtitle,
  left,
  right,
  onPress,
  showDivider = false,
  style,
}: ListRowProps) {
  const theme = useTheme();

  const body = (
    <View
      style={[
        styles.row,
        {
          minHeight: theme.sizes.touchTarget,
          paddingVertical: theme.spacing.md,
          gap: theme.spacing.md,
          borderBottomWidth: showDivider ? StyleSheet.hairlineWidth : 0,
          borderBottomColor: theme.colors.divider,
        },
        style,
      ]}
    >
      {left}
      <View style={styles.texts}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );

  if (!onPress) return body;

  return (
    <Touchable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} pressedScale={0.99}>
      {body}
    </Touchable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  texts: {
    flex: 1,
  },
});
