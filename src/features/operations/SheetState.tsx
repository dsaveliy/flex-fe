import { Platform, View } from 'react-native';

import { useTheme } from '@/theme';
import { ErrorState, Skeleton } from '@/ui';

/** шторка операции, пока грузятся счета, или ошибка загрузки */
export function SheetState({ error, onRetry }: { error: boolean; onRetry: () => void }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        padding: theme.spacing.xl,
        paddingTop: theme.spacing.xxxl,
        gap: theme.spacing.lg,
        backgroundColor: Platform.OS === 'ios' ? undefined : theme.colors.backgroundTop,
      }}
    >
      {error ? (
        <ErrorState onRetry={onRetry} />
      ) : (
        [0, 1, 2].map((row) => (
          <Skeleton
            key={row}
            height={theme.sizes.touchTarget + theme.spacing.md}
            radius={theme.radii.card}
          />
        ))
      )}
    </View>
  );
}
