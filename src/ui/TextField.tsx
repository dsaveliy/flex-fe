import { forwardRef, useState } from 'react';
import { StyleSheet, TextInput, type TextInputProps, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { Glass } from './Glass';
import { Icon, type IconName } from './icons/Icon';
import { Touchable } from './Pressable';
import { Text } from './Text';

export type TextFieldProps = Omit<TextInputProps, 'style' | 'placeholderTextColor'> & {
  label: string;
  /** текст ошибки под полем; поле подсвечивается */
  error?: string | null;
  /** подсказка под полем, если ошибки нет */
  hint?: string;
  icon?: IconName;
  style?: ViewStyle;
};

/**
 * стеклянное поле формы (вход, регистрация, коды). у пароля справа глаз
 * «показать/скрыть», ошибка — красной подписью под полем
 */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, hint, icon, style, secureTextEntry, ...inputProps },
  ref,
) {
  const theme = useTheme();
  const [revealed, setRevealed] = useState(false);
  const isSecret = Boolean(secureTextEntry);

  return (
    <View style={[{ gap: theme.spacing.xs + 2 }, style]}>
      <Text variant="bodyStrong" color="textMuted" style={{ marginLeft: theme.spacing.md }}>
        {label}
      </Text>
      <Glass
        variant="clear"
        interactive
        radius={theme.radii.pill}
        style={{ height: theme.sizes.touchTarget + theme.spacing.xs }}
      >
        <View style={[styles.row, { paddingHorizontal: theme.spacing.lg, gap: theme.spacing.sm }]}>
          {icon ? <Icon name={icon} size={18} color={theme.colors.textMuted} /> : null}
          <TextInput
            ref={ref}
            accessibilityLabel={label}
            placeholderTextColor={theme.colors.textMuted}
            secureTextEntry={isSecret && !revealed}
            style={[styles.input, theme.typography.headline, { color: theme.colors.textPrimary }]}
            {...inputProps}
          />
          {isSecret ? (
            <Touchable
              onPress={() => setRevealed((value) => !value)}
              accessibilityRole="button"
              accessibilityLabel={label}
              hitSlop={theme.spacing.sm}
            >
              <Icon name={revealed ? 'eyeOff' : 'eye'} size={18} color={theme.colors.textMuted} />
            </Touchable>
          ) : null}
        </View>
      </Glass>
      {error || hint ? (
        <Text
          variant="caption"
          color={error ? 'negative' : 'textMuted'}
          style={{ marginLeft: theme.spacing.md }}
        >
          {error ?? hint}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: 0,
  },
});
