import { useTranslation } from 'react-i18next';
import { useWindowDimensions, View } from 'react-native';

import { usePortfolio } from '@/api';
import { useTheme } from '@/theme';
import { AreaChart, DeltaBadge, GlassCard, PrivateAmount, Text } from '@/ui';
import { formatMoney } from '@/utils/money';

import { AllocationBar } from '../AllocationBar';
import { SectionState } from './SectionState';

/** портфель: стоимость, изменение за день, график и доли активов */
export function PortfolioSection() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const portfolio = usePortfolio();
  const data = portfolio.data;

  if (!data) return <SectionState error={portfolio.isError} onRetry={() => portfolio.refetch()} />;

  const chartWidth = width - theme.spacing.xl * 4;

  return (
    <View style={{ gap: theme.spacing.lg }}>
      <GlassCard>
        <Text variant="label" color="textMuted">
          {t('crypto.portfolio').toUpperCase()}
        </Text>
        <PrivateAmount maskVariant="display" style={{ marginTop: theme.spacing.xs }}>
          <Text variant="display" numberOfLines={1} adjustsFontSizeToFit>
            {formatMoney(data.value)}
          </Text>
        </PrivateAmount>
        <DeltaBadge value={data.dayChangePercent} caption={t('crypto.today')} />
        <View style={{ marginTop: theme.spacing.lg }}>
          <AreaChart data={data.series} width={chartWidth} height={140} />
        </View>
      </GlassCard>

      <GlassCard title={t('crypto.portfolioSection.allocation')}>
        <AllocationBar holdings={data.holdings} />
      </GlassCard>
    </View>
  );
}
