import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { useTheme } from '@/theme';

export type IconName =
  | 'home'
  | 'crypto'
  | 'cards'
  | 'account'
  | 'transfer'
  | 'plus'
  | 'bitcoin'
  | 'search'
  | 'chevronRight'
  | 'arrowUp'
  | 'arrowDown'
  | 'contactless';

export type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

/**
 * Single line-icon set drawn with react-native-svg.
 * Keeping icons in code avoids an extra font/asset dependency and lets them
 * inherit theme colors.
 */
export function Icon({ name, size = 22, color, strokeWidth = 1.8 }: IconProps) {
  const theme = useTheme();
  const stroke = color ?? theme.colors.textPrimary;
  const common = {
    stroke,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
      {name === 'home' && (
        <>
          <Path d="M4 10.5 12 4l8 6.5" {...common} />
          <Path d="M6 10v9h12v-9" {...common} />
          <Path d="M10 19v-5h4v5" {...common} />
        </>
      )}
      {name === 'crypto' && (
        <>
          <Rect x={3.5} y={3.5} width={17} height={17} rx={5} {...common} />
          <Path d="M12 7.5 15.5 12 12 16.5 8.5 12z" {...common} />
        </>
      )}
      {name === 'cards' && (
        <>
          <Rect x={3} y={6} width={18} height={12} rx={3.5} {...common} />
          <Path d="M3 10.5h18" {...common} />
          <Path d="M6.5 14.5h4" {...common} />
        </>
      )}
      {name === 'account' && (
        <>
          <Circle cx={12} cy={12} r={8.5} {...common} />
          <Path d="M3.5 12h17" {...common} />
          <Path d="M12 3.5c2.6 2.4 4 5.3 4 8.5s-1.4 6.1-4 8.5c-2.6-2.4-4-5.3-4-8.5s1.4-6.1 4-8.5z" {...common} />
        </>
      )}
      {name === 'transfer' && (
        <>
          <Path d="M4 9h13l-3.2-3.2" {...common} />
          <Path d="M20 15H7l3.2 3.2" {...common} />
        </>
      )}
      {name === 'plus' && (
        <>
          <Path d="M12 5v14" {...common} />
          <Path d="M5 12h14" {...common} />
        </>
      )}
      {name === 'bitcoin' && (
        <>
          <Circle cx={12} cy={12} r={8.5} {...common} />
          <Path d="M9.5 8.5h3.8a2 2 0 0 1 0 4H9.5h4.1a2 2 0 0 1 0 4H9.5z" {...common} />
          <Path d="M11 6.5v2M13 6.5v2M11 16.5v1.5M13 16.5v1.5" {...common} />
        </>
      )}
      {name === 'search' && (
        <>
          <Circle cx={11} cy={11} r={6.5} {...common} />
          <Path d="M16 16l4 4" {...common} />
        </>
      )}
      {name === 'chevronRight' && <Path d="M9.5 5.5 16 12l-6.5 6.5" {...common} />}
      {name === 'arrowUp' && (
        <>
          <Path d="M12 19V5" {...common} />
          <Path d="M6 11l6-6 6 6" {...common} />
        </>
      )}
      {name === 'arrowDown' && (
        <>
          <Path d="M12 5v14" {...common} />
          <Path d="M6 13l6 6 6-6" {...common} />
        </>
      )}
      {name === 'contactless' && (
        <>
          <Path d="M8 7.5a9 9 0 0 1 0 9" {...common} />
          <Path d="M11.5 6a12 12 0 0 1 0 12" {...common} />
          <Path d="M15 4.5a15 15 0 0 1 0 15" {...common} />
        </>
      )}
    </Svg>
  );
}
