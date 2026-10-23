import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

import { GlassCard } from './GlassCard';
import { Icon } from './icons/Icon';
import { Touchable } from './Pressable';
import { Text } from './Text';

export type MenuSheetItem = {
  id: string;
  label: string;
  checked?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export type MenuSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  cancelLabel: string;
  items: MenuSheetItem[];
};

/**
 * меню выбора для web и Android: шторка снизу со списком. системный диалог
 * не подходит — на web `Alert` ничего не показывает, а на Android вмещает
 * только три кнопки. на iOS вместо неё нативные меню (`*.ios.tsx`)
 */
export function MenuSheet({ visible, onClose, title, cancelLabel, items }: MenuSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const choose = (item: MenuSheetItem) => {
    if (item.disabled) return;
    onClose();
    item.onPress();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={cancelLabel}
        onPress={onClose}
        style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.overlay }]}
      />
      <View
        pointerEvents="box-none"
        style={[
          styles.bottom,
          {
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: insets.bottom + theme.spacing.lg,
            gap: theme.spacing.sm,
          },
        ]}
      >
        <GlassCard variant="regular" padding={theme.spacing.sm} style={{ maxHeight: '70%' }}>
          {title ? (
            <Text
              variant="caption"
              color="textMuted"
              align="center"
              style={{ paddingVertical: theme.spacing.sm }}
            >
              {title}
            </Text>
          ) : null}
          <ScrollView bounces={false}>
            {items.map((item) => (
              <Touchable
                key={item.id}
                accessibilityRole="menuitem"
                accessibilityState={{ disabled: item.disabled, checked: item.checked }}
                onPress={() => choose(item)}
                style={[
                  styles.row,
                  {
                    minHeight: theme.sizes.touchTarget,
                    paddingHorizontal: theme.spacing.lg,
                    gap: theme.spacing.md,
                    opacity: item.disabled ? 0.4 : 1,
                  },
                ]}
              >
                <Text variant="headline" style={{ flex: 1 }}>
                  {item.label}
                </Text>
                {item.checked ? <Icon name="check" size={18} color={theme.colors.accent} /> : null}
              </Touchable>
            ))}
          </ScrollView>
        </GlassCard>
        <GlassCard variant="regular" padding={0}>
          <Touchable
            accessibilityRole="button"
            onPress={onClose}
            style={[styles.row, { minHeight: theme.sizes.touchTarget, justifyContent: 'center' }]}
          >
            <Text variant="headline" color="accent">
              {cancelLabel}
            </Text>
          </Touchable>
        </GlassCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bottom: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
