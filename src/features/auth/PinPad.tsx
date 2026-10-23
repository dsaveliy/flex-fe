import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useTheme } from '@/theme';
import { Glass, Icon, type IconName, Text, Touchable } from '@/ui';

type PinPadProps = {
  onDigit: (digit: string) => void;
  onDelete: () => void;
  disabled?: boolean;
  /** кнопка биометрии слева от нуля */
  biometric?: { label: string; onPress: () => void } | null;
};

const KEY = 72;
const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['bio', '0', 'delete'],
];

/** цифровая клавиатура крипто-PIN: стеклянные круги, как на экране блокировки iOS */
export function PinPad({ onDigit, onDelete, disabled = false, biometric }: PinPadProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const iconKey = (name: IconName, label: string, onPress: () => void) => (
    <Touchable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={{ width: KEY, height: KEY, alignItems: 'center', justifyContent: 'center' }}
    >
      <Icon name={name} size={28} color={theme.colors.textPrimary} />
    </Touchable>
  );

  return (
    <View style={{ gap: theme.spacing.lg, opacity: disabled ? 0.4 : 1 }}>
      {ROWS.map((row) => (
        <View key={row.join()} style={{ flexDirection: 'row', gap: theme.spacing.xxl }}>
          {row.map((key) => {
            if (key === 'bio') {
              return biometric ? (
                <View key={key}>{iconKey('faceId', biometric.label, biometric.onPress)}</View>
              ) : (
                <View key={key} style={{ width: KEY, height: KEY }} />
              );
            }
            if (key === 'delete') {
              return <View key={key}>{iconKey('backspace', t('auth.pin.delete'), onDelete)}</View>;
            }
            return (
              <Touchable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={t('auth.pin.digit', { digit: key })}
                disabled={disabled}
                onPress={() => onDigit(key)}
              >
                <Glass
                  variant="clear"
                  interactive
                  radius={KEY / 2}
                  style={{
                    width: KEY,
                    height: KEY,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text variant="title">{key}</Text>
                </Glass>
              </Touchable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
