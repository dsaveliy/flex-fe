import { Pressable, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import type { ToggleProps } from './Toggle';

const WIDTH = 51;
const HEIGHT = 31;
const THUMB = 27;
const EASE = '220ms cubic-bezier(0.3, 0.7, 0.4, 1)';

/**
 * переключатель в духе iOS для браузера: у `Switch` из react-native-web
 * дорожка в выключенном состоянии прозрачная, а включённый бегунок бирюзовый
 */
export function Toggle({ value, onValueChange, disabled, accessibilityLabel }: ToggleProps) {
  const theme = useTheme();
  const offTrack = theme.isDark ? 'rgba(120, 120, 128, 0.36)' : 'rgba(120, 120, 128, 0.2)';

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={() => onValueChange?.(!value)}
      style={
        {
          width: WIDTH,
          height: HEIGHT,
          borderRadius: HEIGHT / 2,
          padding: (HEIGHT - THUMB) / 2,
          backgroundColor: value ? theme.colors.accent : offTrack,
          opacity: disabled ? 0.45 : 1,
          transition: `background-color ${EASE}`,
        } as ViewStyle
      }
    >
      <View
        style={
          {
            width: THUMB,
            height: THUMB,
            borderRadius: THUMB / 2,
            backgroundColor: '#FFFFFF',
            boxShadow: '0 3px 8px rgba(0, 0, 0, 0.15), 0 3px 1px rgba(0, 0, 0, 0.06)',
            transform: [{ translateX: value ? WIDTH - HEIGHT : 0 }],
            transition: `transform ${EASE}`,
          } as ViewStyle
        }
      />
    </Pressable>
  );
}
