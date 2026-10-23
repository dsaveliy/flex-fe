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
  | 'chevronDown'
  | 'arrowUp'
  | 'arrowDown'
  | 'contactless'
  | 'eye'
  | 'eyeOff'
  | 'user'
  | 'shield'
  | 'moon'
  | 'logout'
  | 'snowflake'
  | 'lock'
  | 'wallet'
  | 'refresh'
  | 'gauge'
  | 'check'
  | 'cardNumber'
  | 'undo'
  | 'chevronUp'
  | 'document'
  | 'percent'
  | 'sliders'
  | 'filter'
  | 'more'
  | 'pencil'
  | 'minus'
  | 'grid'
  | 'chart'
  | 'news'
  | 'candles'
  | 'swap'
  | 'banknote'
  | 'pie'
  | 'coins'
  | 'star'
  | 'backspace'
  | 'faceId';

export type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

/**
 * единый набор линейных иконок, нарисованных через react-native-svg.
 * хранение иконок в коде избавляет от лишней зависимости на шрифт или ресурс
 * и позволяет им наследовать цвета темы.
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
      {name === 'chevronDown' && <Path d="M5.5 9.5 12 16l6.5-6.5" {...common} />}
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
      {name === 'eye' && (
        <>
          <Path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" {...common} />
          <Circle cx={12} cy={12} r={3} {...common} />
        </>
      )}
      {name === 'eyeOff' && (
        <>
          <Path d="M9.9 5.7A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.7 3.4" {...common} />
          <Path d="M6.6 7.6A16.6 16.6 0 0 0 2.5 12s3.5 6.5 9.5 6.5c1.9 0 3.5-.6 4.9-1.5" {...common} />
          <Path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" {...common} />
          <Path d="M3.5 3.5l17 17" {...common} />
        </>
      )}
      {name === 'user' && (
        <>
          <Circle cx={12} cy={8.5} r={3.8} {...common} />
          <Path d="M4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" {...common} />
        </>
      )}
      {name === 'shield' && (
        <>
          <Path d="M12 3.5 19 6v5.5c0 4.4-3 7.8-7 9-4-1.2-7-4.6-7-9V6z" {...common} />
          <Path d="M9 12l2 2 4-4" {...common} />
        </>
      )}
      {name === 'moon' && (
        <Path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z" {...common} />
      )}
      {name === 'more' && (
        <>
          <Circle cx={6} cy={12} r={1.3} {...common} />
          <Circle cx={12} cy={12} r={1.3} {...common} />
          <Circle cx={18} cy={12} r={1.3} {...common} />
        </>
      )}
      {name === 'pencil' && (
        <>
          <Path d="M4.5 19.5 5.3 15.6 15.8 5.1a2 2 0 0 1 2.9 0l.2.2a2 2 0 0 1 0 2.9L8.4 18.7z" {...common} />
          <Path d="M13.8 7.1 16.9 10.2" {...common} />
        </>
      )}
      {name === 'minus' && <Path d="M6 12h12" {...common} />}
      {name === 'grid' && (
        <>
          <Rect x={4} y={4} width={7} height={7} rx={2} {...common} />
          <Rect x={13} y={4} width={7} height={7} rx={2} {...common} />
          <Rect x={4} y={13} width={16} height={7} rx={2} {...common} />
        </>
      )}
      {name === 'chart' && (
        <>
          <Path d="M4 19h16" {...common} />
          <Path d="m5 15 4.5-4.5 3.5 3 6-6.5" {...common} />
          <Path d="M15.5 7H19v3.5" {...common} />
        </>
      )}
      {name === 'news' && (
        <>
          <Rect x={3.5} y={5} width={13} height={14} rx={2.5} {...common} />
          <Path d="M16.5 9h2.5a1.5 1.5 0 0 1 1.5 1.5V17a2 2 0 0 1-4 0" {...common} />
          <Path d="M7 9h6M7 12.5h6M7 16h3.5" {...common} />
        </>
      )}
      {name === 'candles' && (
        <>
          <Path d="M7 4v3M7 15v5M17 4v5M17 17v3" {...common} />
          <Rect x={5} y={7} width={4} height={8} rx={1} {...common} />
          <Rect x={15} y={9} width={4} height={8} rx={1} {...common} />
        </>
      )}
      {name === 'swap' && (
        <>
          <Path d="M7 4v15M3.5 7.5 7 4l3.5 3.5" {...common} />
          <Path d="M17 20V5M20.5 16.5 17 20l-3.5-3.5" {...common} />
        </>
      )}
      {name === 'banknote' && (
        <>
          <Rect x={2.5} y={6} width={19} height={12} rx={2.5} {...common} />
          <Circle cx={12} cy={12} r={2.5} {...common} />
          <Path d="M6 9.5v5M18 9.5v5" {...common} />
        </>
      )}
      {name === 'pie' && (
        <>
          <Path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5H12z" {...common} />
          <Path d="M15 3.9A8.5 8.5 0 0 1 20.1 9H15z" {...common} />
        </>
      )}
      {name === 'coins' && (
        <>
          <Circle cx={9} cy={9} r={5.5} {...common} />
          <Path d="M14.5 9.6a5.5 5.5 0 1 1-5 5" {...common} />
        </>
      )}
      {name === 'star' && (
        <Path
          d="m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4-3.9-3.8 5.4-.8z"
          {...common}
        />
      )}
      {name === 'snowflake' && (
        <>
          <Path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" {...common} />
          <Path d="M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5" {...common} />
        </>
      )}
      {name === 'lock' && (
        <>
          <Rect x={5} y={10.5} width={14} height={9.5} rx={2.5} {...common} />
          <Path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" {...common} />
        </>
      )}
      {name === 'wallet' && (
        <>
          <Rect x={3.5} y={6} width={17} height={13} rx={2.5} {...common} />
          <Path d="M3.5 10h17M15.5 14.5h2" {...common} />
        </>
      )}
      {name === 'refresh' && (
        <>
          <Path d="M19 12a7 7 0 1 1-2.05-4.95" {...common} />
          <Path d="M19 4.5v3.5h-3.5" {...common} />
        </>
      )}
      {name === 'gauge' && (
        <>
          <Path d="M4.5 16.5a8 8 0 1 1 15 0" {...common} />
          <Path d="M12 14l3.5-4" {...common} />
        </>
      )}
      {name === 'check' && <Path d="M5.5 12.5l4 4 9-9" {...common} />}
      {name === 'cardNumber' && (
        <>
          <Rect x={3} y={6} width={18} height={12} rx={3.5} {...common} />
          <Path d="M7 13.5h.01M10 13.5h.01M13 13.5h.01M16 13.5h1.5" {...common} />
        </>
      )}
      {name === 'undo' && (
        <>
          <Path d="M9 14.5 4.5 10 9 5.5" {...common} />
          <Path d="M4.5 10H14a5 5 0 0 1 0 10h-3" {...common} />
        </>
      )}
      {name === 'filter' && <Path d="M4 6h16l-6 7.5V19l-4-2v-3.5z" {...common} />}
      {name === 'chevronUp' && <Path d="M5.5 14.5 12 8l6.5 6.5" {...common} />}
      {name === 'document' && (
        <>
          <Path d="M14 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8z" {...common} />
          <Path d="M14 3.5V8h4.5M9 12.5h6M9 16h4" {...common} />
        </>
      )}
      {name === 'percent' && (
        <>
          <Path d="M18 6 6 18" {...common} />
          <Circle cx={7.5} cy={7.5} r={2.2} {...common} />
          <Circle cx={16.5} cy={16.5} r={2.2} {...common} />
        </>
      )}
      {name === 'sliders' && (
        <>
          <Path d="M4 7.5h9M18 7.5h2M4 16.5h3M11 16.5h9" {...common} />
          <Circle cx={15.5} cy={7.5} r={2.2} {...common} />
          <Circle cx={8.5} cy={16.5} r={2.2} {...common} />
        </>
      )}
      {name === 'backspace' && (
        <>
          <Path d="M9 5.5h10a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H9L3.5 12z" {...common} />
          <Path d="M11.5 9.5l5 5M16.5 9.5l-5 5" {...common} />
        </>
      )}
      {name === 'faceId' && (
        <>
          <Path d="M4 8.5V6.5A2.5 2.5 0 0 1 6.5 4h2M15.5 4h2A2.5 2.5 0 0 1 20 6.5v2" {...common} />
          <Path d="M4 15.5v2A2.5 2.5 0 0 0 6.5 20h2M15.5 20h2a2.5 2.5 0 0 0 2.5-2.5v-2" {...common} />
          <Path d="M9 9.5v1.5M15 9.5v1.5M12 9.5v3.5h-1" {...common} />
          <Path d="M9.5 16a3.6 3.6 0 0 0 5 0" {...common} />
        </>
      )}
      {name === 'logout' && (
        <>
          <Path d="M14 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H14" {...common} />
          <Path d="M10 12h10l-3.5-3.5M20 12l-3.5 3.5" {...common} />
        </>
      )}
    </Svg>
  );
}
