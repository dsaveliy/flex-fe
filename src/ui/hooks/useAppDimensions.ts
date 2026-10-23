import { useWindowDimensions } from 'react-native';

/** размеры области приложения: на телефоне это окно (на web — колонка, useAppDimensions.web.ts) */
export function useAppDimensions() {
  return useWindowDimensions();
}
