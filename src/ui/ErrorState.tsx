import { useTranslation } from 'react-i18next';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { GlassButton } from './GlassButton';
import { Text } from './Text';

export type ErrorStateProps = {
  onRetry?: () => void;
  style?: ViewStyle;
};

/** Shared error placeholder for failed queries. */
export function ErrorState({ onRetry, style }: ErrorStateProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={[styles.container, { gap: theme.spacing.sm }, style]}>
      <Text variant="sectionTitle" align="center">
        {t('common.errorTitle')}
      </Text>
      <Text variant="caption" color="textMuted" align="center">
        {t('common.errorSubtitle')}
      </Text>
      {onRetry ? (
        <GlassButton
          label={t('common.retry')}
          onPress={onRetry}
          style={{ marginTop: theme.spacing.sm }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
