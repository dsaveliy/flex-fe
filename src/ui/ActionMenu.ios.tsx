import { Button, Host, Menu, RNHostView } from '@expo/ui/swift-ui';
import { disabled } from '@expo/ui/swift-ui/modifiers';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import type { ActionMenuProps } from './ActionMenu';

export type { ActionMenuItem, ActionMenuProps } from './ActionMenu';

/**
 * iOS: кнопка-триггер встроена в системное SwiftUI-меню, по тапу из неё
 * «вырастает» нативное меню Liquid Glass. выбранный пункт отмечен галочкой.
 * Host игнорирует safe area: иначе, когда кнопка уезжает при скролле под
 * статус-бар, SwiftUI сдвигает её вниз, и она отстаёт от остальной шапки.
 */
export function ActionMenu({ items, children, triggerSize }: ActionMenuProps) {
  const theme = useTheme();

  return (
    <Host
      matchContents={!triggerSize}
      ignoreSafeArea="all"
      colorScheme={theme.isDark ? 'dark' : 'light'}
      style={triggerSize}
    >
      <Menu
        label={
          <RNHostView matchContents={!triggerSize}>
            {/* касания обрабатывает меню, а не кнопка внутри */}
            <View
              pointerEvents="none"
              style={triggerSize ? [triggerSize, styles.center] : undefined}
            >
              {children}
            </View>
          </RNHostView>
        }
      >
        {items.map((item) => (
          <Button
            key={item.id}
            label={item.label}
            systemImage={item.checked ? 'checkmark' : item.systemImage}
            onPress={item.onPress}
            modifiers={item.disabled ? [disabled(true)] : undefined}
          />
        ))}
      </Menu>
    </Host>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
