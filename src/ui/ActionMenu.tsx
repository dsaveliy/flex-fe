import type { ReactNode } from 'react';
import { Alert, View } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import { Touchable } from './Pressable';

export type ActionMenuItem = {
  id: string;
  label: string;
  /** иконка пункта в системном меню iOS */
  systemImage?: SFSymbol;
  /** отмечен галочкой (выбранный вариант фильтра) */
  checked?: boolean;
  onPress: () => void;
};

export type ActionMenuProps = {
  items: ActionMenuItem[];
  /** заголовок диалога на web/Android */
  title?: string;
  cancelLabel: string;
  accessibilityLabel: string;
  /** кнопка, по которой открывается меню; касания обрабатывает само меню */
  children: ReactNode;
};

/**
 * web/Android: по тапу на кнопку открывается системный диалог со списком.
 * на iOS — `ActionMenu.ios.tsx` с нативным стеклянным меню.
 */
export function ActionMenu({
  items,
  title,
  cancelLabel,
  accessibilityLabel,
  children,
}: ActionMenuProps) {
  return (
    <Touchable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={() =>
        Alert.alert(title ?? accessibilityLabel, undefined, [
          ...items.map((item) => ({
            text: item.checked ? `✓ ${item.label}` : item.label,
            onPress: item.onPress,
          })),
          { text: cancelLabel, style: 'cancel' as const },
        ])
      }
    >
      <View pointerEvents="none">{children}</View>
    </Touchable>
  );
}
