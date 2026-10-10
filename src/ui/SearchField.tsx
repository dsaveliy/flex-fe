import { StyleSheet, TextInput, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { Glass } from './Glass';
import { Icon } from './icons/Icon';

export type SearchFieldProps = {
  placeholder: string;
  value?: string;
  onChangeText?: (text: string) => void;
  editable?: boolean;
  /** `small` — компактное лёгкое поле (экран Cards) */
  size?: 'default' | 'small';
  style?: ViewStyle;
};

/** стеклянное поле поиска в форме таблетки, используется на экранах Crypto и Cards */
export function SearchField({
  placeholder,
  value,
  onChangeText,
  editable = true,
  size = 'default',
  style,
}: SearchFieldProps) {
  const theme = useTheme();
  const small = size === 'small';

  return (
    <Glass
      variant="clear"
      interactive
      radius={theme.radii.pill}
      style={[{ height: small ? theme.sizes.searchHeightSmall : theme.sizes.searchHeight }, style]}
    >
      <View
        style={[
          styles.row,
          {
            paddingHorizontal: small ? theme.spacing.md : theme.spacing.lg,
            gap: small ? theme.spacing.xs + 2 : theme.spacing.sm,
          },
        ]}
      >
        <Icon name="search" size={small ? 15 : 18} color={theme.colors.textMuted} />
        <TextInput
          accessibilityLabel={placeholder}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          returnKeyType="search"
          style={[
            styles.input,
            small ? theme.typography.body : theme.typography.bodyStrong,
            { color: theme.colors.textPrimary },
          ]}
        />
      </View>
    </Glass>
  );
}

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
