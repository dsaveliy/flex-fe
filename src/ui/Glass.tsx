import { View } from 'react-native';

import type { GlassGroupProps, GlassProps } from './Glass.types';
import { GlassFallback } from './GlassFallback';

/**
 * Default (non-iOS) implementation: always the fallback surface.
 * iOS overrides this file with `Glass.ios.tsx`, which renders the native
 * Liquid Glass `GlassView`.
 */
export function Glass(props: GlassProps) {
  return <GlassFallback {...props} />;
}

/** No-op grouping on platforms without native glass morphing. */
export function GlassGroup({ style, children, testID }: GlassGroupProps) {
  return (
    <View style={style} testID={testID}>
      {children}
    </View>
  );
}

export const isNativeGlassAvailable = false;
