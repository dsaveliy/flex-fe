import { Switch } from 'react-native';

import { useTheme } from '@/theme';

export type ToggleProps = {
  value: boolean;
  onValueChange?: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
};

/** переключатель: на iOS и Android — системный, на web — свой (Toggle.web.tsx) */
export function Toggle({ value, onValueChange, disabled, accessibilityLabel }: ToggleProps) {
  const theme = useTheme();
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      trackColor={{ true: theme.colors.accent }}
    />
  );
}
