import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { AccountBalance } from '@/api';
import { useTheme } from '@/theme';
import { CoinBadge, Glass, Icon, MenuSheet, type MenuSheetItem, Text, Touchable } from '@/ui';

import { formatBalance } from './amount';

type SelectFieldProps = {
  label: string;
  /** выбранное значение; пусто — показывается `placeholder` */
  title?: string;
  subtitle?: string;
  placeholder?: string;
  left?: ReactNode;
  options: MenuSheetItem[];
};

/** поле формы в стиле `TextField`: по тапу — список вариантов снизу */
export function SelectField({
  label,
  title,
  subtitle,
  placeholder,
  left,
  options,
}: SelectFieldProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <View style={{ gap: theme.spacing.xs + 2 }}>
      <Text variant="bodyStrong" color="textMuted" style={{ marginLeft: theme.spacing.md }}>
        {label}
      </Text>
      <Touchable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setOpen(true)}
      >
        <Glass variant="clear" interactive radius={theme.radii.card}>
          <View
            style={[
              styles.row,
              {
                minHeight: theme.sizes.touchTarget + theme.spacing.md,
                paddingHorizontal: theme.spacing.lg,
                paddingVertical: theme.spacing.sm,
                gap: theme.spacing.md,
              },
            ]}
          >
            {left}
            <View style={{ flex: 1 }}>
              <Text
                variant="headline"
                numberOfLines={1}
                color={title ? 'textPrimary' : 'textMuted'}
              >
                {title ?? placeholder ?? t('operations.chooseAccount')}
              </Text>
              {subtitle ? (
                <Text variant="caption" color="textMuted" numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <Icon name="chevronDown" size={18} color={theme.colors.textMuted} />
          </View>
        </Glass>
      </Touchable>
      <MenuSheet
        visible={open}
        onClose={() => setOpen(false)}
        title={label}
        cancelLabel={t('common.cancel')}
        items={options}
      />
    </View>
  );
}

type AccountSelectProps = {
  label: string;
  accounts: AccountBalance[];
  value: string | undefined;
  onChange: (accountId: string) => void;
};

/** выбор своего счёта: название, остаток и значок валюты */
export function AccountSelect({ label, accounts, value, onChange }: AccountSelectProps) {
  const theme = useTheme();
  const selected = accounts.find((account) => account.id === value);

  return (
    <SelectField
      label={label}
      title={selected?.name}
      subtitle={selected ? formatBalance(selected) : undefined}
      left={
        selected ? (
          <CoinBadge
            symbol={selected.currency}
            color={selected.color}
            size={theme.sizes.iconButton}
          />
        ) : undefined
      }
      options={accounts.map((account) => ({
        id: account.id,
        label: `${account.name} · ${formatBalance(account)}`,
        checked: account.id === value,
        onPress: () => onChange(account.id),
      }))}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
