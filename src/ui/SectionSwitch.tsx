import type { ReactNode } from 'react';
import { type StyleProp, View, type ViewStyle } from 'react-native';

export type SectionSwitchProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * заголовок вкладки, который в браузере на телефоне переключает разделы
 * (SectionSwitch.web.tsx). на iOS и Android разделы — в системном таб-баре
 */
export function SectionSwitch({ children, style }: SectionSwitchProps) {
  return <View style={style}>{children}</View>;
}

/** стрелка ⌄ после заголовка — только на web, когда разделы переключаются из заголовка */
export function SectionChevron() {
  return null;
}
