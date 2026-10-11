import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useNews } from '@/api';
import { useTheme } from '@/theme';
import { GlassCard, Text } from '@/ui';

import { timeAgo } from '../timeAgo';
import { SectionState } from './SectionState';

/** лента новостей рынка */
export function NewsSection() {
  const { t } = useTranslation();
  const theme = useTheme();
  const news = useNews();

  if (!news.data) return <SectionState error={news.isError} onRetry={() => news.refetch()} />;

  return (
    <View style={{ gap: theme.spacing.md }}>
      {news.data.map((item) => (
        <GlassCard key={item.id} padding={theme.spacing.lg}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            {item.assetSymbol ? (
              <View
                style={{
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: theme.spacing.xxs,
                  borderRadius: theme.radii.pill,
                  backgroundColor: theme.colors.accentMuted,
                }}
              >
                <Text variant="micro" color="accent">
                  {item.assetSymbol}
                </Text>
              </View>
            ) : null}
            <Text variant="caption" color="textMuted" numberOfLines={1} style={{ flex: 1 }}>
              {item.source} · {timeAgo(item.publishedAt, t)}
            </Text>
          </View>
          <Text variant="sectionTitle" style={{ marginTop: theme.spacing.sm }}>
            {item.title}
          </Text>
        </GlassCard>
      ))}
    </View>
  );
}
