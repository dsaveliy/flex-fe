import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type StyleProp, View, type ViewStyle } from 'react-native';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';

import type { BalancePeriod, BalanceSummary } from '@/api';
import { useTheme } from '@/theme';
import { useDisplayAmount } from '@/providers/DisplayCurrencyProvider';
import { CurrencyMenu, DeltaBadge, MoneyAmount, SegmentedControl, Text } from '@/ui';
import { formatShortDate, formatShortDateWithYear, formatTime } from '@/utils/format';
import { toMajorUnits } from '@/utils/money';

import { BalanceChart } from './BalanceChart';
import { PrivacyToggle } from './PrivacyToggle';

const PERIODS: BalancePeriod[] = ['1D', '1W', '1M', '1Y', 'ALL'];

/** длительность периода в часах — для подписи даты под пальцем */
const PERIOD_HOURS: Record<BalancePeriod, number> = {
  '1D': 24,
  '1W': 24 * 7,
  '1M': 24 * 30,
  '1Y': 24 * 365,
  ALL: 24 * 365 * 3,
};

function pointDate(period: BalancePeriod, index: number, count: number): string {
  const hoursAgo = PERIOD_HOURS[period] * (1 - index / Math.max(1, count - 1));
  const iso = new Date(Date.now() - hoursAgo * 3_600_000).toISOString();
  if (period === '1D') return formatTime(iso);
  // за всё время точки охватывают несколько лет — без года дата неоднозначна
  if (period === 'ALL') return formatShortDateWithYear(iso);
  return formatShortDate(iso);
}

function changePercent(from: number, to: number): number {
  return from === 0 ? 0 : ((to - from) / from) * 100;
}

export type BalanceChartWidgetProps = {
  balance: BalanceSummary;
  /** анимированный стиль для фоновой Σ (параллакс от наклона) */
  decorStyle?: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>;
};

/**
 * огромная сумма без карточки и живой график под ней. за суммой —
 * крупная полупрозрачная Σ из макета. при скраббинге сумма перекатывается
 * к значению под пальцем, а вместо подписи периода показывается дата точки.
 */
export function BalanceChartWidget({ balance, decorStyle }: BalanceChartWidgetProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [period, setPeriod] = useState<BalancePeriod>('1M');
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);
  const [chartWidth, setChartWidth] = useState(0);

  const series = balance.history[period];
  const first = series[0] ?? 0;
  const scrubbed = scrubIndex === null ? null : series[scrubIndex];

  const toDisplay = useDisplayAmount();

  // история и итог хранятся в базовой валюте (BYN) — пересчитываем в выбранную;
  // процент изменения от валюты не зависит
  const shown = toDisplay(scrubbed ?? toMajorUnits(balance.total));
  const delta = changePercent(first, scrubbed ?? series.at(-1) ?? first);
  const caption =
    scrubIndex === null
      ? t(`home.periodCaption.${period}`)
      : pointDate(period, scrubIndex, series.length);

  return (
    <View style={{ gap: theme.spacing.md }}>
      <Animated.View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[{ position: 'absolute', top: -56, right: -theme.spacing.sm }, decorStyle]}
      >
        <Text variant="decor" color="accent" style={{ opacity: theme.isDark ? 0.14 : 0.08 }}>
          Σ
        </Text>
      </Animated.View>

      {/* подпись прижата к сумме: у кегля 52/60 над цифрами уже ~11 pt воздуха */}
      <View>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text variant="label" color="textMuted" uppercase>
            {t('home.totalBalance')}
          </Text>
          {/* глаз по центру подписи; отрицательные поля не дают ему раздувать строку */}
          <View style={{ marginVertical: -9, transform: [{ translateY: 4 }] }}>
            <PrivacyToggle />
          </View>
        </View>
        <MoneyAmount
          value={shown.value}
          minorUnitDigits={shown.minorUnitDigits}
          fractionDigits={shown.fractionDigits}
          size="hero"
          toggleOnPress
          renderCurrency={() => <CurrencyMenu />}
          style={{ marginTop: 2 }}
        />
      </View>
      {/* под цифрами ~11 pt запаса строки — подтягиваем дельту ближе к сумме */}
      <DeltaBadge value={delta} caption={caption} style={{ marginTop: -6 }} />

      <View
        style={{ marginHorizontal: -theme.spacing.xl, marginTop: theme.spacing.xl }}
        onLayout={(event) => setChartWidth(event.nativeEvent.layout.width)}
      >
        {chartWidth > 0 ? (
          <BalanceChart data={series} width={chartWidth} height={194} onScrub={setScrubIndex} />
        ) : null}
      </View>

      <SegmentedControl
        options={PERIODS.map((value) => ({ value, label: t(`home.periods.${value}`) }))}
        value={period}
        onChange={setPeriod}
      />
    </View>
  );
}
