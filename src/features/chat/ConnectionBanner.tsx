import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { reconnectChat, useChatConnection } from '@/api';
import { useTheme } from '@/theme';
import { Glass, Text, Touchable } from '@/ui';

/**
 * системное сообщение о связи: «Подключаемся…» при первом входе,
 * «Нет соединения · переподключаемся…» после обрыва — с кнопкой «Повторить»
 */
export function ConnectionBanner() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { status, everConnected } = useChatConnection();

  if (status === 'online' || status === 'idle') return null;
  const offline = status === 'offline' || everConnected;

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.center, { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.sm }]}
    >
      <Glass variant="regular" radius={theme.radii.pill}>
        <View
          style={[
            styles.row,
            {
              gap: theme.spacing.sm,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.xs + 2,
            },
          ]}
        >
          <ActivityIndicator size="small" color={offline ? theme.colors.negative : theme.colors.accent} />
          <Text variant="bodyStrong" color={offline ? 'negative' : 'textMuted'}>
            {t(offline ? 'chat.connection.offline' : 'chat.connection.connecting')}
          </Text>
          {status === 'offline' ? (
            <Touchable onPress={reconnectChat} accessibilityLabel={t('chat.connection.retry')}>
              <Text variant="bodyStrong" color="accent">
                {t('chat.connection.retry')}
              </Text>
            </Touchable>
          ) : null}
        </View>
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
