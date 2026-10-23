import { useWindowDimensions } from 'react-native';

/** ширина колонки приложения на широком экране; держать в синхронизации с public/index.html */
export const APP_MAX_WIDTH = 440;

/**
 * на компьютере приложение — колонка ширины телефона по центру окна (public/index.html),
 * поэтому карусели и фон считают ширину по ней, а не по окну
 */
export function useAppDimensions() {
  const window = useWindowDimensions();
  return { ...window, width: Math.min(window.width, APP_MAX_WIDTH) };
}
