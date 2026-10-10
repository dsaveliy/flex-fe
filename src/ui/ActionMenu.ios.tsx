import { Button, Host, Menu, RNHostView } from '@expo/ui/swift-ui';
import { View } from 'react-native';

import { useTheme } from '@/theme';

import type { ActionMenuProps } from './ActionMenu';

export type { ActionMenuItem, ActionMenuProps } from './ActionMenu';

/**
 * iOS: кнопка-триггер встроена в системное SwiftUI-меню, по тапу из неё
 * «вырастает» нативное меню Liquid Glass. выбранный пункт отмечен галочкой.
 */
export function ActionMenu({ items, children }: ActionMenuProps) {
  const theme = useTheme();

  return (
    <Host matchContents colorScheme={theme.isDark ? 'dark' : 'light'}>
      <Menu
        label={
          <RNHostView matchContents>
            {/* касания обрабатывает меню, а не кнопка внутри */}
            <View pointerEvents="none">{children}</View>
          </RNHostView>
        }
      >
        {items.map((item) => (
          <Button
            key={item.id}
            label={item.label}
            systemImage={item.checked ? 'checkmark' : item.systemImage}
            onPress={item.onPress}
          />
        ))}
      </Menu>
    </Host>
  );
}
