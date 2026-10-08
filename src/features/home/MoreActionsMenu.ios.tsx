import { Button, Host, Menu, RNHostView } from '@expo/ui/swift-ui';
import { View } from 'react-native';

import { useTheme } from '@/theme';
import { ActionCircle } from '@/ui';

import type { MoreActionsMenuProps } from './MoreActionsMenu';

export type { MoreAction, MoreActionsMenuProps } from './MoreActionsMenu';

/**
 * iOS: круг «Ещё» — это кнопка системного SwiftUI-меню. по тапу из круга
 * «вырастает» нативное меню Liquid Glass. сам круг — обычный RN-компонент,
 * встроенный в SwiftUI через `RNHostView`, поэтому выглядит как соседние.
 */
export function MoreActionsMenu({ label, actions }: MoreActionsMenuProps) {
  const theme = useTheme();

  return (
    <Host matchContents colorScheme={theme.isDark ? 'dark' : 'light'}>
      <Menu
        label={
          <RNHostView matchContents>
            {/* касания обрабатывает меню, а не RN-кнопка внутри */}
            <View pointerEvents="none">
              <ActionCircle icon="more" label={label} />
            </View>
          </RNHostView>
        }
      >
        {actions.map((action) => (
          <Button
            key={action.id}
            label={action.label}
            systemImage={action.systemImage}
            onPress={action.onPress}
          />
        ))}
      </Menu>
    </Host>
  );
}
