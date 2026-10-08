import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useCards, useTransactions } from '@/api';
import { useTheme } from '@/theme';
import {
  ErrorState,
  GlassButton,
  GlassCard,
  GlassGroup,
  MoneyAmount,
  Screen,
  ScreenHeader,
  SearchField,
  Skeleton,
  Text,
  TransactionRow,
} from '@/ui';

/**
 * экран карт — временная раскладка. настоящие `CardCarousel` /
 * `CardThumbStrip` (постраничные, синхронизированные со свайпом) будут
 * сделаны, когда появится макет; пока карты выводятся простым списком,
 * чтобы проверить поток данных.
 */
export default function CardsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();

  const cards = useCards();
  const transactions = useTransactions({ limit: 5 });

  return (
    <Screen>
      <View style={{ paddingHorizontal: theme.spacing.xl, gap: theme.spacing.xl }}>
        <ScreenHeader
          title={t('cards.title')}
          subtitle={t('common.tagline')}
          actions={
            <GlassButton
              shape="circle"
              icon="plus"
              accent
              size={theme.sizes.avatar}
              accessibilityLabel={t('cards.addCard')}
            />
          }
        />

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
                <MoneyAmount
                  value={card.balance}
                  size="title"
                  style={{ marginTop: theme.spacing.sm }}
                />
              </GlassCard>
            ))}
          </View>
        )}

        <GlassGroup
          spacing={theme.spacing.md}
          style={{ flexDirection: 'row', gap: theme.spacing.md }}
        >
          <GlassButton label={t('cards.actions.transfer')} icon="transfer" style={{ flex: 1 }} />
          <GlassButton label={t('cards.actions.topUp')} icon="plus" style={{ flex: 1 }} />
          <GlassButton label={t('cards.actions.details')} style={{ flex: 1 }} />
        </GlassGroup>

        <GlassCard title={t('cards.recentTransactions')}>
          {transactions.isPending ? (
            <Skeleton height={60} />
          ) : transactions.isError ? (
            <ErrorState onRetry={() => transactions.refetch()} />
          ) : (
            transactions.data.map((tx, index) => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                showDivider={index < transactions.data.length - 1}
              />
            ))
          )}
        </GlassCard>
      </View>
    </Screen>
  );
}
