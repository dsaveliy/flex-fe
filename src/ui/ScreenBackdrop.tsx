import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { useTheme } from '@/theme';

type Blob = {
  id: string;
  /** Position/size as a fraction of screen width/height (from the Figma generator). */
  cx: number;
  cy: number;
  r: number;
  color: 'mint' | 'teal' | 'blue' | 'lavender';
  opacity: number;
};

/**
 * Blobs are spread over the whole height so that glass widgets at any scroll
 * position sit above a visibly colored area (the "glass needs rich content
 * behind it" rule). Radii are relative to screen width.
 */
const BLOBS: Blob[] = [
  { id: 'mint-top', cx: 0.1, cy: 0.1, r: 0.6, color: 'mint', opacity: 0.85 },
  { id: 'blue-upper', cx: 0.95, cy: 0.28, r: 0.5, color: 'blue', opacity: 0.6 },
  { id: 'teal-mid', cx: 0.05, cy: 0.5, r: 0.5, color: 'teal', opacity: 0.5 },
  { id: 'lavender-mid', cx: 0.92, cy: 0.66, r: 0.48, color: 'lavender', opacity: 0.55 },
  { id: 'mint-bottom', cx: 0.25, cy: 0.9, r: 0.55, color: 'mint', opacity: 0.6 },
];

/**
 * Soft blurred color blobs behind the page content.
 * Rendered with SVG radial gradients (cheap, no blur pass) so glass surfaces
 * above them show visible refraction.
 */
export function ScreenBackdrop() {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();

  const blobColors: Record<Blob['color'], string> = {
    mint: theme.colors.blobMint,
    teal: theme.colors.blobTeal,
    blue: theme.colors.blobBlue,
    lavender: theme.colors.blobLavender,
  };

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={width} height={height}>
        <Defs>
          {BLOBS.map((blob) => (
            <RadialGradient key={blob.id} id={blob.id} cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={blobColors[blob.color]} stopOpacity={blob.opacity} />
              <Stop offset="55%" stopColor={blobColors[blob.color]} stopOpacity={blob.opacity * 0.45} />
              <Stop offset="100%" stopColor={blobColors[blob.color]} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        {BLOBS.map((blob) => (
          <Ellipse
            key={blob.id}
            cx={blob.cx * width}
            cy={blob.cy * height}
            rx={blob.r * width}
            ry={blob.r * width}
            fill={`url(#${blob.id})`}
          />
        ))}
      </Svg>
    </View>
  );
}
