import type { Transaction } from '@/api';
import { formatShortDate } from '@/utils/format';
import { formatMoney } from '@/utils/money';

import { ListRow } from './ListRow';
import { PrivateAmount } from './PrivateAmount';
import { Text } from './Text';

export type TransactionRowProps = {
  transaction: Transaction;
  showDivider?: boolean;
};

/** строка операции: мерчант, дата и сумма (участвует в «скрыть баланс») */
export function TransactionRow({ transaction, showDivider = false }: TransactionRowProps) {
  const incoming = transaction.direction === 'incoming';

  return (
    <ListRow
      title={transaction.merchant}
      subtitle={formatShortDate(transaction.occurredAt)}
      right={
        <PrivateAmount maskVariant="bodyStrong">
          <Text variant="bodyStrong" color={incoming ? 'positive' : 'textPrimary'}>
            {incoming ? '+' : '−'}
            {formatMoney(transaction.amount)}
          </Text>
        </PrivateAmount>
      }
      showDivider={showDivider}
    />
  );
}
