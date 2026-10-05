/**
 * Raw palette extracted from the Figma generator (`design/code (11).js`).
 * Figma stores colors as 0..1 rgb — here they are converted to hex once,
 * so no screen ever hardcodes a color literal.
 */
export const palette = {
  white: '#FFFFFF',
  black: '#000000',

  // Rich mint → aqua → sky page gradient. It must be saturated enough that
  // translucent glass surfaces visibly refract/tint it (a near-white page
  // makes glass indistinguishable from a plain white card).
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
