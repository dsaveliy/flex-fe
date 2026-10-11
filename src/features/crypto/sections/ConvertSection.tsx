import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput, View } from 'react-native';

import { type MarketAsset, useMarkets } from '@/api';
import { useTheme } from '@/theme';
import { type ActionMenuItem, GlassButton, GlassCard, Text } from '@/ui';

import { formatCoinAmount, pairRate } from '../convertRate';
import { PickerPill } from '../PickerPill';
import { SectionState } from './SectionState';

/** обмен одной монеты на другую по рыночному курсу; сама операция пока заглушка */
export function ConvertSection() {
  const { t } = useTranslation();
  const theme = useTheme();
  const markets = useMarkets('crypto');
  const [fromId, setFromId] = useState('btc');
  const [toId, setToId] = useState('usdt');
  const [amount, setAmount] = useState('');

  const assets = markets.data;
  if (!assets) return <SectionState error={markets.isError} onRetry={() => markets.refetch()} />;

  const from = assets.find((item) => item.id === fromId);
  const to = assets.find((item) => item.id === toId);
  const value = Number(amount.replace(',', '.')) || 0;
  const rate = from && to ? pairRate(from, to) : 0;

  const items = (selected: string, pick: (id: string) => void): ActionMenuItem[] =>
    assets.map((item) => ({
      id: item.id,
      label: `${item.symbol} · ${item.name}`,
      checked: item.id === selected,
      onPress: () => pick(item.id),
    }));

  const pill = (asset: MarketAsset | undefined, selected: string, pick: (id: string) => void, title: string) => (
    <PickerPill
      label={asset?.symbol ?? '—'}
      title={title}
      coin={asset ? { symbol: asset.symbol, color: asset.badgeColor } : undefined}
      items={items(selected, pick)}
    />
  );

  const swap = () => {
    setFromId(toId);
    setToId(fromId);
  };

  return (
    <View style={{ gap: theme.spacing.lg }}>
      <GlassCard>
        <Text variant="caption" color="textMuted">
          {t('crypto.convert.from')}
        </Text>
        <View style={[styles.row, { gap: theme.spacing.md, marginTop: theme.spacing.sm }]}>
          {pill(from, fromId, setFromId, t('crypto.gallery.chooseFrom'))}
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="decimal-pad"
            accessibilityLabel={t('crypto.convert.amount')}
            style={[styles.input, theme.typography.title, { color: theme.colors.textPrimary }]}
          />
        </View>

        <View style={[styles.divider, { marginVertical: theme.spacing.lg }]}>
          <View style={[styles.line, { backgroundColor: theme.colors.divider }]} />
          <GlassButton
            shape="circle"
            icon="swap"
            size={theme.sizes.iconButton}
            onPress={swap}
            accessibilityLabel={t('crypto.convert.swap')}
          />
          <View style={[styles.line, { backgroundColor: theme.colors.divider }]} />
        </View>

        <Text variant="caption" color="textMuted">
          {t('crypto.convert.to')}
        </Text>
        <View style={[styles.row, { gap: theme.spacing.md, marginTop: theme.spacing.sm }]}>
          {pill(to, toId, setToId, t('crypto.gallery.chooseTo'))}
          <Text variant="title" numberOfLines={1} adjustsFontSizeToFit style={styles.input}>
            {formatCoinAmount(value * rate)}
          </Text>
        </View>
      </GlassCard>

      {from && to ? (
        <Text variant="caption" color="textMuted" align="center">
          1 {from.symbol} ≈ {formatCoinAmount(rate)} {to.symbol}
        </Text>
      ) : null}

      {/* заглушка: обмен появится вместе с торговым API */}
      <GlassButton label={t('crypto.convert.action')} icon="swap" accent onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
});
