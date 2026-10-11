import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useEarnProducts } from '@/api';
import { useTheme } from '@/theme';
import { CoinBadge, GlassButton, GlassCard, Text } from '@/ui';
import { formatPercent } from '@/utils/format';

import { SectionState } from './SectionState';

/** Earn: продукты стейкинга с доходностью и сроком; подключение пока заглушка */
export function EarnSection() {
  const { t } = useTranslation();
  const theme = useTheme();
  const products = useEarnProducts();

  if (!products.data) {
    return <SectionState error={products.isError} onRetry={() => products.refetch()} />;
  }

  return (
    <View style={{ gap: theme.spacing.md }}>
      <Text variant="body" color="textMuted">
        {t('crypto.earn.subtitle')}
      </Text>
      {products.data.map((product) => (
        <GlassCard key={product.id} padding={theme.spacing.lg}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
            <CoinBadge symbol={product.symbol} color={product.badgeColor} size={40} />
            <View style={{ flex: 1 }}>
              <Text variant="sectionTitle">{product.symbol}</Text>
              <Text variant="caption" color="textMuted">
                {product.termDays === null
                  ? t('crypto.earn.flexible')
                  : t('crypto.earn.locked', { days: product.termDays })}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text variant="title" color="accent">
                {formatPercent(product.apyPercent, { withSign: false, digits: 1 })}
              </Text>
              <Text variant="micro" color="textMuted">
                {t('crypto.earn.apy')}
              </Text>
            </View>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: theme.spacing.md,
            }}
          >
            <Text variant="caption" color="textMuted">
              {t('crypto.earn.min', { amount: product.minAmount, symbol: product.symbol })}
            </Text>
            <GlassButton label={t('crypto.earn.subscribe')} onPress={() => {}} />
          </View>
        </GlassCard>
      ))}
    </View>
  );
}
