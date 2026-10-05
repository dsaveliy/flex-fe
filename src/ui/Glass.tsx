import { View } from 'react-native';

import type { GlassGroupProps, GlassProps } from './Glass.types';
import { GlassFallback } from './GlassFallback';

/**
 * реализация по умолчанию (не для iOS): всегда запасная поверхность.
 * на iOS этот файл подменяется `Glass.ios.tsx`, который рендерит нативный
 * Liquid Glass `GlassView`.
 */
export function Glass(props: GlassProps) {
  return <GlassFallback {...props} />;
}

/** пустая группировка на платформах без нативного смешивания стекла */
export function GlassGroup({ style, children, testID }: GlassGroupProps) {
  return (
    <View style={style} testID={testID}>
      {children}
    </View>
  );
}

export const isNativeGlassAvailable = false;
