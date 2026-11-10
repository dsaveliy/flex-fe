import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { API_BASE_URL, USE_MOCK_API } from '@/api/config';
import { useTheme } from '@/theme';
import { Screen, Text } from '@/ui';

export default function StatusScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<'loading' | 'up' | 'down' | 'mock'>('loading');

  useEffect(() => {
    if (USE_MOCK_API) { setState('mock'); return; }
    const controller = new AbortController();
    let active = true;
    setState('loading');
    const timeout = setTimeout(() => controller.abort(), 5000);
    const url = API_BASE_URL.replace(/\/api\/v1\/?$/, '') + '/api/health';
    void fetch(url, { signal: controller.signal, cache: 'no-store' })
      .then(async (response) => {
        const body = await response.json();
        if (active) setState(response.ok && body.status === 'UP' ? 'up' : 'down');
      })
      .catch(() => { if (active) setState('down'); })
      .finally(() => clearTimeout(timeout));
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [attempt]);

  return (
    <Screen>
      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <Text>{t('serviceStatus.title')}</Text>
        {state === 'loading' && <ActivityIndicator color={theme.colors.accent} />}
        <Text accessibilityLiveRegion="polite">{t(`serviceStatus.${state}`)}</Text>
        <Pressable accessibilityRole="button" disabled={state === 'loading'}
          onPress={() => setAttempt((value) => value + 1)}
          style={{ padding: theme.spacing.md, borderRadius: theme.radii.md, backgroundColor: theme.colors.accent }}>
          <Text align="center">{t('serviceStatus.retry')}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
