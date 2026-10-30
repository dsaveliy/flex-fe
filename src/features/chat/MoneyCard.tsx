import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import type { ChatMoney, LocalChatMessage } from '@/api';
import { useTheme } from '@/theme';
import { Icon, MoneyAmount, Text, Touchable, useAccessibilityFlags } from '@/ui';

/** знаков в минорных единицах: у крипты 8 (как currencies.decimals на сервере), у фиата 2 */
const CRYPTO = ['BTC', 'ETH', 'USDT'];
export const minorDigits = (currency: string) => (CRYPTO.includes(currency) ? 8 : 2);

export type MoneyCardProps = {
  message: LocalChatMessage;
  money: ChatMoney;
  own: boolean;
  onPay(message: LocalChatMessage): void;
  onDecline(requestId: string): void;
  onOpenGift(giftId: string): void;
};

/**
 * деньги в переписке: перевод, запрос с «Оплатить» и крипто-конверт.
 * суммы — через MoneyAmount: участвуют в «скрыть баланс»
 */
export function MoneyCard({ message, money, own, onPay, onDecline, onOpenGift }: MoneyCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { reduceMotion } = useAccessibilityFlags();
  const ink = own ? 'textInverse' : 'textPrimary';
  const sent = message.delivery === 'sent';

  const title =
    money.type === 'transfer'
      ? t(own ? 'chat.money.card.transferOut' : 'chat.money.card.transferIn')
      : money.type === 'request'
        ? t(own ? 'chat.money.card.requestOut' : 'chat.money.card.requestIn')
        : money.status === 'opened'
          ? t('chat.money.card.giftOpened')
          : t(own ? 'chat.money.card.giftOut' : 'chat.money.card.giftIn');

  const status =
    money.type === 'transfer'
      ? t('chat.money.card.completed')
      : money.type === 'request'
        ? t(`chat.money.card.${money.status}`)
        : money.status === 'sealed'
          ? t(own ? 'chat.money.card.sealedOut' : 'chat.money.card.sealedIn')
          : null;

  const icon = money.type === 'transfer' ? 'transfer' : money.type === 'request' ? 'banknote' : 'star';
  const amount = money.amount;

  return (
    <View
      style={[
        styles.card,
        {
          gap: theme.spacing.sm,
          padding: theme.spacing.md,
          marginBottom: theme.spacing.xs,
          borderRadius: theme.radii.md,
          backgroundColor: own ? theme.colors.glassFill : theme.colors.accentMuted,
        },
      ]}
    >
      <View style={[styles.row, { gap: theme.spacing.sm }]}>
        <View
          style={[
            styles.center,
            {
              width: theme.sizes.iconButton,
              height: theme.sizes.iconButton,
              borderRadius: theme.sizes.iconButton / 2,
              backgroundColor: own ? theme.colors.glassFillStrong : theme.colors.glassFill,
            },
          ]}
        >
          <Icon name={icon} size={20} color={own ? theme.colors.textInverse : theme.colors.accent} />
        </View>
        <Text variant="bodyStrong" color={ink} style={styles.fill}>
          {title}
        </Text>
      </View>

      {amount ? (
        // конверт открыли — сумма «выпрыгивает»; без анимации при Reduce Motion
        <Animated.View
          key={money.type === 'gift' ? money.status : 'amount'}
          entering={money.type === 'gift' && !reduceMotion ? ZoomIn.springify() : undefined}
        >
          <MoneyAmount
            value={amount}
            size="title"
            minorUnitDigits={minorDigits(amount.currency)}
            color={ink}
          />
        </Animated.View>
      ) : (
        <Text variant="title" color={ink}>
          {`${money.type === 'gift' ? money.asset : ''} • • •`}
        </Text>
      )}

      {status ? (
        <Text variant="caption" color={ink} style={{ opacity: 0.75 }}>
          {status}
        </Text>
      ) : null}

      {sent && money.type === 'request' && money.status === 'pending' ? (
        <View style={[styles.row, { gap: theme.spacing.sm }]}>
          {own ? (
            <CardButton label={t('chat.money.card.cancel')} own onPress={() => onDecline(money.requestId)} />
          ) : (
            <>
              <CardButton label={t('chat.money.card.pay')} primary onPress={() => onPay(message)} />
              <CardButton label={t('chat.money.card.decline')} onPress={() => onDecline(money.requestId)} />
            </>
          )}
        </View>
      ) : null}

      {sent && money.type === 'gift' && money.status === 'sealed' && !own ? (
        <CardButton label={t('chat.money.card.open')} primary onPress={() => onOpenGift(money.giftId)} />
      ) : null}
    </View>
  );
}

function CardButton({
  label,
  onPress,
  primary = false,
  own = false,
}: {
  label: string;
  onPress(): void;
  primary?: boolean;
  own?: boolean;
}) {
  const theme = useTheme();

  return (
    <Touchable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.center,
        styles.fill,
        {
          minHeight: theme.sizes.touchTarget - theme.spacing.xs,
          paddingHorizontal: theme.spacing.md,
          borderRadius: theme.radii.pill,
          backgroundColor: primary ? theme.colors.accent : theme.colors.glassFillStrong,
        },
      ]}
    >
      <Text variant="bodyStrong" color={primary ? 'textInverse' : own ? 'textPrimary' : 'accent'}>
        {label}
      </Text>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 220,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: {
    flex: 1,
  },
});
