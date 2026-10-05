import { StyleSheet, TextInput, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { Glass } from './Glass';
import { Icon } from './icons/Icon';

export type SearchFieldProps = {
  placeholder: string;
  value?: string;
  onChangeText?: (text: string) => void;
  editable?: boolean;
  style?: ViewStyle;
};

/** Glass pill search input used on the Crypto and Cards screens. */
export function SearchField({
  placeholder,
  value,
  onChangeText,
  editable = true,
  style,
}: SearchFieldProps) {
  const theme = useTheme();

  return (
    <Glass
      variant="clear"
      radius={theme.radii.pill}
      style={[{ height: theme.sizes.searchHeight }, style]}
    >
      <View style={[styles.row, { paddingHorizontal: theme.spacing.lg, gap: theme.spacing.sm }]}>
        <Icon name="search" size={18} color={theme.colors.textMuted} />
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
            theme.typography.bodyStrong,
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
