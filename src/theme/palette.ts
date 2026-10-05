/**
 * исходная палитра, извлечённая из генератора Figma (`design/code (11).js`).
 * в Figma цвета хранятся как rgb в диапазоне 0..1 — здесь они один раз
 * преобразованы в hex, поэтому ни один экран не использует цвет-литерал.
 */
export const palette = {
  white: '#FFFFFF',
  black: '#000000',

  // насыщенный градиент страницы мята → аква → небо. он должен быть достаточно
  // насыщенным, чтобы полупрозрачные стеклянные поверхности заметно преломляли
  // и тонировали его (почти белая страница делает стекло неотличимым от обычной белой карточки).
  bgTop: '#9FE0C4',
  bgMid: '#C4ECE3',
  bgBottom: '#CFE6F6',
  blobMint: '#46CFA0',
  blobTeal: '#2FB5B0',
  blobBlue: '#6FA8F0',
  blobLavender: '#B0A0F0',
  haloMint: '#99E0C7',

  textPrimary: '#141F29',
  textMuted: '#526469',
  inactive: '#6C7B78',

  accent: '#248C66',
  accentSoft: '#99CCB8',
  leafDark: '#298061',
  leafLight: '#8CD1AD',
  red: '#D1474D',
  shadow: '#0D261F',

  cardMintA: '#B8E6D9',
  cardMintB: '#A6D1EB',
  cardDarkA: '#3D424D',
  cardDarkB: '#24262E',
  cardGreyA: '#DBE0E6',
  cardGreyB: '#BDC7D1',
  cardPurpleA: '#C7B8F0',
  cardPurpleB: '#998CDB',

  mastercardOrange: '#F59933',
  mastercardRed: '#EB4D47',

  coinA: '#26262E',
  coinB: '#5966D9',
  coinC: '#66A6F2',
  coinD: '#F2D966',
  coinE: '#E65959',
  coinF: '#804DBF',
  coinG: '#D96666',
  coinH: '#333338',
} as const;

export type PaletteColor = keyof typeof palette;
