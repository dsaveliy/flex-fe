import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { type NewsItem, useNews } from '@/api';
import { useTheme } from '@/theme';
import { Text } from '@/ui';

import { timeAgo } from '../timeAgo';
import type { WidgetRenderProps } from './types';
import { WidgetCard } from './WidgetCard';

/** свежие новости рынка: medium — главный заголовок, large — три */
export function NewsWidget({ size, width, height }: WidgetRenderProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const news = useNews(3);
  const items = news.data ?? [];

  return (
    <WidgetCard
      width={width}
      height={height}
      icon="news"
      title={t('crypto.widgets.news.name')}
      state={news.data ? 'ready' : news.isError ? 'error' : 'loading'}
      onRetry={() => news.refetch()}
    >
      {size === 'medium' ? (
        items[0] ? (
          <Headline item={items[0]} lines={3} />
        ) : null
      ) : (
        <View style={[styles.fill, { gap: theme.spacing.md }]}>
          {items.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.fill,
                index > 0 && {
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: theme.colors.divider,
                  paddingTop: theme.spacing.md,
                },
              ]}
            >
              <Headline item={item} lines={2} />
            </View>
          ))}
        </View>
      )}
    </WidgetCard>
  );
}

function Headline({ item, lines }: { item: NewsItem; lines: number }) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.xxs }}>
      <Text variant="bodyStrong" numberOfLines={lines}>
        {item.title}
      </Text>
      <Text variant="micro" color="textMuted" numberOfLines={1}>
        {[item.assetSymbol, item.source, timeAgo(item.publishedAt, t)].filter(Boolean).join(' · ')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
