import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useMarkets, useMovers } from '@/api';
import { useTheme } from '@/theme';
import {
  CoinBadge,
  DeltaBadge,
  GlassCard,
  ListRow,
  SegmentedControl,
  Sparkline,
  Text,
} from '@/ui';
import { formatPercentAbs } from '@/utils/format';
import { formatPrice } from '@/utils/money';

import { SectionState } from './SectionState';

type RatesFilter = 'all' | 'gainers' | 'losers';

/** курсы: все монеты со sparkline либо лидеры роста и падения за сутки */
export function RatesSection() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [filter, setFilter] = useState<RatesFilter>('all');
  const markets = useMarkets('crypto');
  const movers = useMovers(filter === 'losers' ? 'losers' : 'gainers');

  return (
    <View style={{ gap: theme.spacing.lg }}>
      <SegmentedControl
        options={[
          { value: 'all', label: t('crypto.rates.all') },
          { value: 'gainers', label: t('crypto.segments.gainers') },
          { value: 'losers', label: t('crypto.segments.losers') },
        ]}
        value={filter}
        onChange={setFilter}
      />

      {filter === 'all' ? (
        markets.data ? (
          <GlassCard padding={theme.spacing.lg}>
            {markets.data.map((asset, index) => (
              <ListRow
                key={asset.id}
                title={asset.name}
                subtitle={asset.symbol}
                left={<CoinBadge symbol={asset.symbol} color={asset.badgeColor} size={36} />}
                right={
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
                    {asset.trend.series ? (
                      <Sparkline data={asset.trend.series} width={56} height={24} strokeWidth={1.6} />
                    ) : null}
                    <View style={{ alignItems: 'flex-end', minWidth: 84 }}>
                      <Text variant="bodyStrong">
                        {formatPrice(asset.price, { currency: asset.quoteCurrency })}
                      </Text>
                      <DeltaBadge value={asset.trend.changePercent} variant="micro" />
                    </View>
                  </View>
                }
                showDivider={index < (markets.data?.length ?? 0) - 1}
              />
            ))}
          </GlassCard>
        ) : (
          <SectionState error={markets.isError} onRetry={() => markets.refetch()} />
        )
      ) : movers.data ? (
        <GlassCard padding={theme.spacing.lg}>
          {movers.data.map((mover, index) => (
            <ListRow
              key={mover.id}
              title={mover.symbol}
              left={<CoinBadge symbol={mover.symbol} color={mover.badgeColor} size={36} />}
              right={
                <Text
                  variant="bodyStrong"
                  color={mover.changePercent >= 0 ? 'positive' : 'negative'}
                >
                  {mover.changePercent >= 0 ? '▲' : '▼'} {formatPercentAbs(mover.changePercent)}
                </Text>
              }
              showDivider={index < (movers.data?.length ?? 0) - 1}
            />
          ))}
        </GlassCard>
      ) : (
        <SectionState error={movers.isError} onRetry={() => movers.refetch()} />
      )}
    </View>
  );
}
