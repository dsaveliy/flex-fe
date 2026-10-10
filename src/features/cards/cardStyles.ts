import type { CardStyle } from '@/api';
import { palette } from '@/theme';

/** диагональный градиент пластика и цвет текста на нём — из генератора Figma */
export const CARD_SKINS: Record<CardStyle, { colors: [string, string]; ink: string }> = {
  mint: { colors: [palette.cardMintA, palette.cardMintB], ink: palette.textPrimary },
  dark: { colors: [palette.cardDarkA, palette.cardDarkB], ink: palette.white },
  grey: { colors: [palette.cardGreyA, palette.cardGreyB], ink: palette.textPrimary },
  purple: { colors: [palette.cardPurpleA, palette.cardPurpleB], ink: palette.white },
};

/** полностью прозрачный белый — конец градиента блика */
export const WHITE_TRANSPARENT = `${palette.white}00`;

/** полностью прозрачный чёрный — начало градиента виньетки */
export const BLACK_TRANSPARENT = `${palette.black}00`;
