import { View } from 'react-native';

import { useTheme } from '@/theme';
import { ErrorState, Skeleton } from '@/ui';

/** заглушка раздела, пока грузятся данные, или ошибка с повтором */
export function SectionState({ error, onRetry }: { error?: boolean; onRetry?: () => void }) {
  const theme = useTheme();
  if (error) return <ErrorState onRetry={onRetry} />;
  return (
    <View style={{ gap: theme.spacing.md }}>
      {[0, 1, 2].map((key) => (
        <Skeleton key={key} height={72} radius={theme.radii.widget} />
      ))}
    </View>
  );
}
