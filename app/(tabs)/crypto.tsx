import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useMarkets, useMovers, usePortfolio } from '@/api';
import type { MoverDirection } from '@/api';
import { useTheme } from '@/theme';
import {
  Chip,
  CoinBadge,
  DeltaBadge,
  ErrorState,
  GlassCard,
  ListRow,
  Screen,
  SearchField,
  SegmentedControl,
  Skeleton,
  Sparkline,
  Text,
} from '@/ui';
import { formatPercentAbs } from '@/utils/format';
import { formatMoney, formatPrice } from '@/utils/money';

/**
 * Crypto screen — placeholder layout exercising the full data layer
 * (markets, movers, portfolio) with the design-system components. Pixel
 * layout will follow the Figma mockup once supplied.
 */
export default function CryptoScreen() {
  const { t } = useTranslation();
  const theme = useTheme();

  const [moversDirection, setMoversDirection] = useState<MoverDirection>('gainers');
  const [assetKind, setAssetKind] = useState<'crypto' | 'fiat' | 'stock'>('crypto');

  const topAssets = useMarkets('crypto');
  const movers = useMovers(moversDirection);
  const portfolio = usePortfolio();
  const markets = useMarkets(assetKind);

  return (
    <Screen>
      <View style={{ paddingHorizontal: theme.spacing.xl, gap: theme.spacing.xl }}>
        <Text variant="title">{t('crypto.title')}</Text>

        <SearchField placeholder={t('crypto.searchPlaceholder')} />

        <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
          {(topAssets.data ?? []).slice(0, 2).map((asset) => (
            <GlassCard key={asset.id} style={{ flex: 1 }} padding={theme.spacing.lg}>
              <Text variant="label" color="textMuted">
                {asset.symbol}
              </Text>
              <Text variant="sectionTitle" style={{ marginTop: theme.spacing.xs }}>
                {formatPrice(asset.price, { currency: asset.quoteCurrency })}
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: theme.spacing.sm,
                }}
              >
                <DeltaBadge value={asset.trend.changePercent} variant="caption" />
                {asset.trend.series ? <Sparkline data={asset.trend.series} /> : null}
              </View>
            </GlassCard>
          ))}
        </View>

        <GlassCard title={t('crypto.topMovers')}>
          <SegmentedControl
            options={[
              { value: 'gainers', label: t('crypto.segments.gainers') },
              { value: 'losers', label: t('crypto.segments.losers') },
            ]}
            value={moversDirection}
            onChange={setMoversDirection}
          />

          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              marginTop: theme.spacing.lg,
              gap: theme.spacing.md,
            }}
          >
            {(movers.data ?? []).map((mover) => (
              <View key={mover.id} style={{ width: '22%', alignItems: 'center' }}>
                <CoinBadge symbol={mover.symbol} color={mover.badgeColor} size={40} />
                <Text variant="caption" style={{ marginTop: theme.spacing.xs }}>
                  {mover.symbol}
                </Text>
                <Text
                  variant="micro"
                  color={mover.changePercent >= 0 ? 'positive' : 'negative'}
                >
                  {mover.changePercent >= 0 ? '▲' : '▼'} {formatPercentAbs(mover.changePercent)}
                </Text>
              </View>
            ))}
          </View>
        </GlassCard>

        <GlassCard>
          <Text variant="label" color="textMuted">
            {t('crypto.portfolio').toUpperCase()}
          </Text>
          {portfolio.isPending ? (
            <Skeleton height={30} width={140} style={{ marginTop: theme.spacing.sm }} />
          ) : portfolio.isError ? (
            <ErrorState onRetry={() => portfolio.refetch()} />
          ) : (
            <>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: theme.spacing.xs,
                }}
              >
                <Text variant="sectionTitle">
                  {formatMoney(portfolio.data.value, { withCurrency: false })} $
                </Text>
                <Sparkline data={portfolio.data.series} tone="positive" />
              </View>
              <DeltaBadge
                value={portfolio.data.dayChangePercent}
                caption={t('crypto.today')}
                style={{ marginTop: theme.spacing.xs }}
              />
            </>
          )}
        </GlassCard>

        <GlassCard title={t('crypto.markets')}>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            {(['crypto', 'fiat', 'stock'] as const).map((kind) => (
              <Chip
                key={kind}
                label={t(`crypto.categories.${kind === 'stock' ? 'stocks' : kind}`)}
                selected={assetKind === kind}
                onPress={() => setAssetKind(kind)}
              />
            ))}
          </View>

          <View style={{ marginTop: theme.spacing.md }}>
            {(markets.data ?? []).map((asset, index) => (
              <ListRow
                key={asset.id}
                title={asset.name}
                subtitle={asset.symbol}
                left={<CoinBadge symbol={asset.symbol} color={asset.badgeColor} size={36} />}
                right={
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text variant="bodyStrong">
                      {formatPrice(asset.price, { currency: asset.quoteCurrency })}
                    </Text>
                    <DeltaBadge value={asset.trend.changePercent} variant="micro" />
                  </View>
                }
                showDivider={index < (markets.data?.length ?? 0) - 1}
              />
            ))}
          </View>
        </GlassCard>
      </View>
    </Screen>
  );
}
