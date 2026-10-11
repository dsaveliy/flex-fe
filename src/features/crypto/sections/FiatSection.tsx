import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useMarkets } from '@/api';
import { useTheme } from '@/theme';
import { CoinBadge, DeltaBadge, GlassCard, ListRow, Sparkline, Text } from '@/ui';
import { formatPrice } from '@/utils/money';

import { SectionState } from './SectionState';

/** фиатные валюты: курс к белорусскому рублю и изменение за сутки */
export function FiatSection() {
  const { t } = useTranslation();
  const theme = useTheme();
  const markets = useMarkets('fiat');

  if (!markets.data) {
    return <SectionState error={markets.isError} onRetry={() => markets.refetch()} />;
  }

  return (
    <GlassCard title={t('crypto.fiat.title')} padding={theme.spacing.lg}>
      <Text variant="caption" color="textMuted" style={{ marginTop: -theme.spacing.sm }}>
        {t('crypto.fiat.subtitle')}
      </Text>
      {markets.data.map((asset, index) => (
        <ListRow
          key={asset.id}
          title={asset.name}
          subtitle={`1 ${asset.symbol}`}
          left={<CoinBadge symbol={asset.symbol} color={asset.badgeColor} size={36} />}
          right={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
              {asset.trend.series ? (
                <Sparkline data={asset.trend.series} width={56} height={24} strokeWidth={1.6} />
              ) : null}
              <View style={{ alignItems: 'flex-end' }}>
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
  );
}
