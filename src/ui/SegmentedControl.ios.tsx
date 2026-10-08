import { Host, Picker, Text } from '@expo/ui/swift-ui';
import { pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';

import { useTheme } from '@/theme';

import type { SegmentedControlProps } from './SegmentedControl';

export type { SegmentedControlProps, SegmentOption } from './SegmentedControl';

/**
 * iOS-версия: системный SwiftUI `Picker` в стиле segmented. на iOS 26 это
 * Liquid Glass с линзой, которую можно зажать и перетаскивать, как в
 * таб-баре. пропсы совпадают с `SegmentedControl.tsx` (web/Android).
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  style,
}: SegmentedControlProps<T>) {
  const theme = useTheme();

  return (
    <Host
      matchContents={{ vertical: true }}
      colorScheme={theme.isDark ? 'dark' : 'light'}
      style={[{ width: '100%' }, style]}
    >
      <Picker<T>
        selection={value}
        onSelectionChange={onChange}
        modifiers={[pickerStyle('segmented')]}
      >
        {options.map((option) => (
          <Text key={option.value} modifiers={[tag(option.value)]}>
            {option.label}
          </Text>
        ))}
      </Picker>
    </Host>
  );
}
