import type { IconName } from '@/ui';

export type CardExtraActionId =
  'details' | 'limits' | 'pin' | 'wallet' | 'statement' | 'cashback' | 'reissue' | 'settings';

export type CardExtraAction = {
  id: CardExtraActionId;
  icon: IconName;
  /** ключ подписи в `cards.more.*` */
  labelKey: `cards.more.${CardExtraActionId}`;
};

/** два ряда дополнительных действий, которые раскрывает «Ещё» */
export const CARD_EXTRA_ACTIONS: CardExtraAction[][] = [
  [
    { id: 'details', icon: 'cardNumber', labelKey: 'cards.more.details' },
    { id: 'limits', icon: 'gauge', labelKey: 'cards.more.limits' },
    { id: 'pin', icon: 'lock', labelKey: 'cards.more.pin' },
    { id: 'wallet', icon: 'wallet', labelKey: 'cards.more.wallet' },
  ],
  [
    { id: 'statement', icon: 'document', labelKey: 'cards.more.statement' },
    { id: 'cashback', icon: 'percent', labelKey: 'cards.more.cashback' },
    { id: 'reissue', icon: 'refresh', labelKey: 'cards.more.reissue' },
    { id: 'settings', icon: 'sliders', labelKey: 'cards.more.settings' },
  ],
];
