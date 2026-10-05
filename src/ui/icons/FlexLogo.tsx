import Svg, { Path } from 'react-native-svg';

import { palette } from '@/theme';

export type FlexLogoProps = {
  size?: number;
};

/** Two-leaf brand mark used in headers, the promo banner and card plastic. */
export function FlexLogo({ size = 28 }: FlexLogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" accessibilityElementsHidden>
      <Path
        d="M16 29c0-7.2 4.4-13 11.5-14.4C27 22 22.6 27.3 16 29z"
        fill={palette.leafLight}
      />
      <Path
        d="M16 29C16 18.6 10.2 10.3 3 8c0 11 5.6 18.7 13 21z"
        fill={palette.leafDark}
      />
    </Svg>
  );
}
