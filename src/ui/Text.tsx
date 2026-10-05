import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme } from '@/theme';
import type { ThemeColors, TypographyToken } from '@/theme';

export type TextProps = RNTextProps & {
  /** Typography token from the theme. */
  variant?: TypographyToken;
  /** Semantic color key; avoids hardcoded colors in screens. */
  color?: keyof ThemeColors;
  align?: 'auto' | 'left' | 'right' | 'center';
  uppercase?: boolean;
};

export function Text({
  variant = 'body',
  color = 'textPrimary',
  align,
  uppercase = false,
  style,
  children,
  ...rest
}: TextProps) {
  const theme = useTheme();

  return (
    <RNText
      {...rest}
      style={[
        theme.typography[variant],
        { color: theme.colors[color] },
        align ? { textAlign: align } : null,
        uppercase ? { textTransform: 'uppercase' } : null,
        style,
      ]}
    >
      {children}
    </RNText>
  );
}
