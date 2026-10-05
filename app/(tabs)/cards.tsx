import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useCards, useTransactions } from '@/api';
import { useTheme } from '@/theme';
import {
  ErrorState,
  GlassButton,
  GlassCard,
  ListRow,
  Screen,
  SearchField,
  Skeleton,
  Text,
} from '@/ui';
import { formatShortDate } from '@/utils/format';
import { formatMoney } from '@/utils/money';

/**
 * Cards screen — placeholder layout. The real `CardCarousel` /
 * `CardThumbStrip` (paged, swipe-synced) will be built once the mockup is
 * available; for now cards render as a simple list to validate data flow.
 */
export default function CardsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();

  const cards = useCards();
  const transactions = useTransactions({ limit: 5 });

  return (
    <Screen>
      <View style={{ paddingHorizontal: theme.spacing.xl, gap: theme.spacing.xl }}>
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <View>
            <Text variant="title">{t('cards.title')}</Text>
            <Text variant="caption" color="textMuted">
              {t('common.tagline')}
            </Text>
          </View>
          <GlassButton shape="circle" icon="plus" accent size={theme.sizes.iconButton} />
        </View>

        <SearchField placeholder={t('cards.searchPlaceholder')} />

        {cards.isPending ? (
          <Skeleton height={180} radius={theme.radii.cardLg} />
        ) : cards.isError ? (
          <ErrorState onRetry={() => cards.refetch()} />
        ) : (
          <View style={{ gap: theme.spacing.md }}>
            {cards.data.map((card) => (
              <GlassCard key={card.id} padding={theme.spacing.lg}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text variant="bodyStrong">
                    {card.productName} · {t('cards.debit')}
                  </Text>
                  <Text variant="caption" color="textMuted">
                    •••• {card.last4}
                  </Text>
                </View>
                <Text variant="sectionTitle" style={{ marginTop: theme.spacing.sm }}>
                  {formatMoney(card.balance)}
                </Text>
              </GlassCard>
            ))}
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
          <GlassButton label={t('cards.actions.transfer')} icon="transfer" style={{ flex: 1 }} />
          <GlassButton label={t('cards.actions.topUp')} icon="plus" style={{ flex: 1 }} />
          <GlassButton label={t('cards.actions.details')} style={{ flex: 1 }} />
        </View>

        <GlassCard title={t('cards.recentTransactions')}>
          {transactions.isPending ? (
            <Skeleton height={60} />
          ) : transactions.isError ? (
            <ErrorState onRetry={() => transactions.refetch()} />
          ) : (
            transactions.data.map((tx, index) => (
              <ListRow
                key={tx.id}
                title={tx.merchant}
                subtitle={formatShortDate(tx.occurredAt)}
                right={
                  <Text
                    variant="bodyStrong"
                    color={tx.direction === 'incoming' ? 'positive' : 'textPrimary'}
                  >
                    {tx.direction === 'incoming' ? '+' : '−'}
                    {formatMoney(tx.amount)}
                  </Text>
                }
                showDivider={index < transactions.data.length - 1}
              />
            ))
          )}
        </GlassCard>
      </View>
    </Screen>
  );
}
