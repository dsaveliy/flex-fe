import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { GlassButton } from './GlassButton';
import type { IconName } from './icons/Icon';
import { Text } from './Text';

export type ActionCircleProps = {
  icon: IconName;
  label: string;
  onPress?: () => void;
  accent?: boolean;
  style?: ViewStyle;
};

/** круглое стеклянное действие с подписью снизу (Home: Transfer / Top up / Buy crypto) */
export function ActionCircle({ icon, label, onPress, accent = false, style }: ActionCircleProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { gap: theme.spacing.sm }, style]}>
      <GlassButton
        shape="circle"
        icon={icon}
        accent={accent}
        onPress={onPress}
        accessibilityLabel={label}
      />
      <Text variant="caption" color="textMuted" align="center">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
});
