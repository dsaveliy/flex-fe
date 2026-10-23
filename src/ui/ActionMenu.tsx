import { type ReactNode, useState } from 'react';
import { View } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import { MenuSheet } from './MenuSheet';
import { Touchable } from './Pressable';

export type ActionMenuItem = {
  id: string;
  label: string;
  /** иконка пункта в системном меню iOS */
  systemImage?: SFSymbol;
  /** отмечен галочкой (выбранный вариант фильтра) */
  checked?: boolean;
  /** серый и не нажимается (функция пока недоступна) */
  disabled?: boolean;
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
  /**
   * фиксированный размер кнопки. на iOS без него SwiftUI-контейнер подгоняет
   * рамку под содержимое на кадр позже, и при перерисовке кнопка дёргается
   */
  triggerSize?: { width: number; height: number };
};

/**
 * web/Android: по тапу на кнопку снизу открывается шторка со списком (`MenuSheet`).
 * на iOS — `ActionMenu.ios.tsx` с нативным стеклянным меню.
 */
export function ActionMenu({
  items,
  title,
  cancelLabel,
  accessibilityLabel,
  children,
}: ActionMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Touchable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={() => setOpen(true)}
      >
        <View pointerEvents="none">{children}</View>
      </Touchable>
      <MenuSheet
        visible={open}
        onClose={() => setOpen(false)}
        title={title ?? accessibilityLabel}
        cancelLabel={cancelLabel}
        items={items}
      />
    </>
  );
}
