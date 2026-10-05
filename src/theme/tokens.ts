import type { TextStyle, ViewStyle } from 'react-native';

import { palette } from './palette';

/** семейства шрифтов, зарегистрированные в `app/_layout.tsx` */
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

/** шкала отступов с шагом 4pt */
export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

/** радиусы скругления — значения взяты из генератора Figma */
export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  card: 20,
  cardLg: 24,
  widget: 22,
  bannerSm: 18,
  pill: 999,
} as const;

/** размеры повторяющихся круглых и фиксированных элементов */
export const sizes = {
  touchTarget: 44,
  avatar: 44,
  iconButton: 40,
  actionCircle: 56,
  coinBadge: 48,
  searchHeight: 44,
  segmentHeight: 42,
  tabBarHeight: 64,
  tabBarInset: 16,
  /** соотношение сторон реальной банковской карты по ISO/IEC 7810 ID-1 */
  cardAspectRatio: 1.586,
} as const;

export const durations = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;

export const springs = {
  pill: { damping: 18, stiffness: 180, mass: 0.6 },
  press: { damping: 14, stiffness: 260, mass: 0.5 },
} as const;

export type TypographyToken =
  | 'display'
  | 'balanceCents'
  | 'balanceCurrency'
  | 'title'
  | 'sectionTitle'
  | 'bodyStrong'
  | 'body'
  | 'caption'
  | 'label'
  | 'micro';

export type Typography = Record<TypographyToken, TextStyle>;

const typography: Typography = {
  display: { fontFamily: fonts.bold, fontSize: 40, lineHeight: 46 },
  balanceCents: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 28 },
  balanceCurrency: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 18 },
  title: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 32 },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 20 },
  bodyStrong: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  body: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 15 },
  label: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 14, letterSpacing: 1 },
  micro: { fontFamily: fonts.medium, fontSize: 10, lineHeight: 13 },
};

export type ShadowToken = 'soft' | 'card' | 'floating' | 'raised';
export type Shadows = Record<ShadowToken, ViewStyle>;

export type ThemeColors = {
  /** вертикальный градиент страницы */
  backgroundTop: string;
  backgroundMid: string;
  backgroundBottom: string;
  /** размытые декоративные пятна за контентом */
  blobMint: string;
  blobTeal: string;
  blobBlue: string;
  blobLavender: string;
  halo: string;

  textPrimary: string;
  textMuted: string;
  textInverse: string;
  textInactive: string;

  accent: string;
  accentSoft: string;
  accentMuted: string;
  positive: string;
  negative: string;

  /** поверхности запасного варианта стекла */
  glassFill: string;
  glassFillStrong: string;
  /** яркая кромка на освещённых (верхней и левой) гранях */
  glassBorder: string;
  /** слабая кромка на затенённых (нижней и правой) гранях */
  glassEdgeLow: string;
  /** зеркальный блик в верхней части поверхности */
  glassHighlight: string;
  /** лёгкая тень глубины в нижней части поверхности */
  glassShade: string;
  /** почти непрозрачная «таблетка» для выбранного сегмента или активного элемента на стекле */
  glassSelected: string;
  glassTint: string;

  divider: string;
  skeleton: string;
  shadow: string;
};

export type Theme = {
  name: 'light' | 'dark';
  isDark: boolean;
  colors: ThemeColors;
  spacing: typeof spacing;
  radii: typeof radii;
  sizes: typeof sizes;
  fonts: typeof fonts;
  typography: Typography;
  shadows: Shadows;
  durations: typeof durations;
  springs: typeof springs;
  /** интенсивность размытия для запасного варианта без Liquid Glass */
  blurIntensity: number;
};

const lightShadows: Shadows = {
  soft: {
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 3,
  },
  card: {
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 26,
    elevation: 6,
  },
  floating: {
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  raised: {
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
  },
};

export const lightTheme: Theme = {
  name: 'light',
  isDark: false,
  colors: {
    backgroundTop: palette.bgTop,
    backgroundMid: palette.bgMid,
    backgroundBottom: palette.bgBottom,
    blobMint: palette.blobMint,
    blobTeal: palette.blobTeal,
    blobBlue: palette.blobBlue,
    blobLavender: palette.blobLavender,
    halo: palette.haloMint,

    textPrimary: palette.textPrimary,
    textMuted: palette.textMuted,
    textInverse: palette.white,
    textInactive: palette.inactive,

    accent: palette.accent,
    accentSoft: palette.accentSoft,
    accentMuted: 'rgba(36, 140, 102, 0.12)',
    positive: palette.accent,
    negative: palette.red,

    // низкая прозрачность заливки сделана намеренно: размытые насыщенные
    // цвета страницы должны просвечивать сквозь стекло, а не закрываться белым.
    glassFill: 'rgba(255, 255, 255, 0.18)',
    glassFillStrong: 'rgba(255, 255, 255, 0.34)',
    glassBorder: 'rgba(255, 255, 255, 0.85)',
    glassEdgeLow: 'rgba(255, 255, 255, 0.28)',
    glassHighlight: 'rgba(255, 255, 255, 0.5)',
    glassShade: 'rgba(13, 38, 31, 0.07)',
    glassSelected: 'rgba(255, 255, 255, 0.85)',
    glassTint: 'rgba(255, 255, 255, 0.55)',

    divider: 'rgba(20, 31, 41, 0.08)',
    skeleton: 'rgba(20, 31, 41, 0.06)',
    shadow: palette.shadow,
  },
  spacing,
  radii,
  sizes,
  fonts,
  typography,
  shadows: lightShadows,
  durations,
  springs,
  blurIntensity: 55,
};

/**
 * заглушка тёмной темы — той же формы, что и `lightTheme`, чтобы
 * последующее переключение не требовало рефакторинга. значения временные.
 */
export const darkTheme: Theme = {
  ...lightTheme,
  name: 'dark',
  isDark: true,
  colors: {
    ...lightTheme.colors,
    backgroundTop: '#0B1512',
    backgroundMid: '#0D1917',
    backgroundBottom: '#0E1A17',
    blobMint: '#1B4C3C',
    blobTeal: '#154B4A',
    blobBlue: '#1D3550',
    blobLavender: '#2E2A5A',
    halo: '#1B5A45',

    textPrimary: '#EAF4F0',
    textMuted: '#93A3A3',
    textInverse: palette.textPrimary,
    textInactive: '#5E6B66',

    glassFill: 'rgba(255, 255, 255, 0.08)',
    glassFillStrong: 'rgba(255, 255, 255, 0.14)',
    glassBorder: 'rgba(255, 255, 255, 0.3)',
    glassEdgeLow: 'rgba(255, 255, 255, 0.08)',
    glassHighlight: 'rgba(255, 255, 255, 0.14)',
    glassShade: 'rgba(0, 0, 0, 0.18)',
    glassSelected: 'rgba(255, 255, 255, 0.22)',
    glassTint: 'rgba(12, 24, 20, 0.5)',

    divider: 'rgba(255, 255, 255, 0.1)',
    skeleton: 'rgba(255, 255, 255, 0.08)',
    shadow: '#000000',
  },
  blurIntensity: 40,
};

export const themes = {
  light: lightTheme,
  dark: darkTheme,
} as const;

export type ThemeName = keyof typeof themes;