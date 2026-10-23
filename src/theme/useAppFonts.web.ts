/**
 * на web Inter подключён в public/index.html (@font-face WOFF2 + preload) с font-display: swap,
 * поэтому приложение рисуется сразу, не дожидаясь шрифтов
 */
export function useAppFonts(): [boolean, Error | null] {
  return [true, null];
}
