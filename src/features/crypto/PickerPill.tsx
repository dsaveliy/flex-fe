import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';
import { ActionMenu, type ActionMenuItem, CoinBadge, Icon, Text } from '@/ui';

export type PickerPillProps = {
  label: string;
  /** заголовок меню и подпись для VoiceOver */
  title: string;
  items: ActionMenuItem[];
  /** значок монеты слева от подписи */
  coin?: { symbol: string; color: string };
};

/** таблетка «BTC ▾», по тапу — системное меню выбора (монета, направление) */
export function PickerPill({ label, title, items, coin }: PickerPillProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <ActionMenu title={title} cancelLabel={t('common.cancel')} accessibilityLabel={title} items={items}>
      <View
        style={[
          styles.pill,
          {
            gap: theme.spacing.xs,
            paddingLeft: coin ? theme.spacing.xs + 2 : theme.spacing.lg,
            paddingRight: theme.spacing.md,
            minHeight: theme.sizes.touchTarget,
            borderRadius: theme.radii.pill,
            backgroundColor: theme.colors.glassFill,
          },
        ]}
      >
        {coin ? <CoinBadge symbol={coin.symbol} color={coin.color} size={30} /> : null}
        <Text variant="bodyStrong">{label}</Text>
        <Icon name="chevronDown" size={16} color={theme.colors.textMuted} />
      </View>
    </ActionMenu>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
