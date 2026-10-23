import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useMarkets } from '@/api';
import { useTheme } from '@/theme';
import {
  AreaChart,
  Chip,
  CoinBadge,
  DeltaBadge,
  GlassButton,
  GlassCard,
  GlassGroup,
  Text,
  useAppDimensions,
} from '@/ui';
import { formatPrice } from '@/utils/money';

import { SectionState } from './SectionState';

/** пары, доступные для торговли в учебном прототипе */
const TRADE_PAIRS = ['btc', 'eth', 'sol'];

/** торговля: выбор пары, цена с графиком; купить и продать — по рынку через шторку обмена */
export function TradeSection() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { width } = useAppDimensions();
  const markets = useMarkets('crypto');
  const [pair, setPair] = useState(TRADE_PAIRS[0]);
  const asset = markets.data?.find((item) => item.id === pair);
  const trade = (from?: string, to?: string) =>
    router.push({ pathname: '/exchange', params: { mode: 'crypto', from, to } });

  if (!markets.data) {
    return <SectionState error={markets.isError} onRetry={() => markets.refetch()} />;
  }

  return (
    <View style={{ gap: theme.spacing.lg }}>
      <GlassGroup
        spacing={theme.spacing.sm}
        style={{ flexDirection: 'row', gap: theme.spacing.sm }}
      >
        {TRADE_PAIRS.map((id) => {
          const item = markets.data?.find((entry) => entry.id === id);
          return item ? (
            <Chip
              key={id}
              label={`${item.symbol}/USDT`}
              selected={id === pair}
              onPress={() => setPair(id)}
            />
          ) : null;
        })}
      </GlassGroup>

      {asset ? (
        <GlassCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            <CoinBadge symbol={asset.symbol} color={asset.badgeColor} size={32} />
            <Text variant="sectionTitle">{asset.symbol}/USDT</Text>
          </View>
          <Text variant="display" style={{ marginTop: theme.spacing.md }}>
            {formatPrice(asset.price, { currency: asset.quoteCurrency })}
          </Text>
          <DeltaBadge value={asset.trend.changePercent} caption={t('crypto.today')} />
          {asset.trend.series ? (
            <View style={{ marginTop: theme.spacing.lg }}>
              <AreaChart
                data={asset.trend.series}
                width={width - theme.spacing.xl * 4}
                height={150}
              />
            </View>
          ) : null}
        </GlassCard>
      ) : null}

      {/* рыночные сделки: покупка за рубли, продажа в рубли; лимитных ордеров пока нет */}
      <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
        <GlassButton
          label={t('crypto.trade.buy')}
          accent
          onPress={() => trade('BYN', asset?.symbol)}
          style={{ flex: 1 }}
        />
        <GlassButton
          label={t('crypto.trade.sell')}
          onPress={() => trade(asset?.symbol, 'BYN')}
          style={{ flex: 1 }}
        />
      </View>
      <Text variant="caption" color="textMuted" align="center">
        {t('crypto.trade.noOrders')}
      </Text>
    </View>
  );
}
