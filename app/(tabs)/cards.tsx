import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWindowDimensions, View } from 'react-native';

import { type CardStatus, useCards } from '@/api';
import { CardActions } from '@/features/cards/CardActions';
import { MAX_CARDS_PER_USER } from '@/features/cards/cardLimits';
import { CardPager } from '@/features/cards/CardPager';
import { CardTransactions } from '@/features/cards/CardTransactions';
import { playFreezeHaptics } from '@/features/cards/frost';
import { MINI_CARD_WIDTH } from '@/features/cards/MiniCard';
import { useTheme } from '@/theme';
import {
  ActionMenu,
  ErrorState,
  GlassButton,
  Screen,
  ScreenHeader,
  SearchField,
  Skeleton,
} from '@/ui';

/**
 * экран карт в стиле Home: крупный заголовок, карусель пластиков на всю
 * ширину и лента мини-карт, круглые действия («Ещё» раскрывает ещё два
 * ряда) и операции по выбранной карте. тап по карте переворачивает её
 * реквизитами вверх.
 */
export default function CardsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const queryClient = useQueryClient();

  const cards = useCards();
  const [index, setIndex] = useState(0);
  // заморозка пока только на клиенте — в API ещё нет метода для смены статуса
  const [statusOverrides, setStatusOverrides] = useState<Record<string, CardStatus>>({});
  const [flipped, setFlipped] = useState(false);
  const [expanded, setExpanded] = useState(false);
  // при смене карты контент может стать короче (меньше операций, свернулось «Ещё»),
  // и прокрутка подпрыгнула бы вверх. держим прежнюю высоту, пока пользователь
  // сам не потянет экран
  const contentHeight = useRef(0);
  const [heldHeight, setHeldHeight] = useState(0);

  const list = (cards.data ?? []).map((card) => ({
    ...card,
    status: statusOverrides[card.id] ?? card.status,
  }));
  const active = list[Math.min(index, list.length - 1)];
  const atCardLimit = list.length >= MAX_CARDS_PER_USER;

  const toggleFreeze = () => {
    if (!active) return;
    playFreezeHaptics(active.status !== 'frozen');
    setStatusOverrides((prev) => ({
      ...prev,
      [active.id]: active.status === 'frozen' ? 'active' : 'frozen',
    }));
  };

  const unflip = useCallback(() => setFlipped(false), []);
  const toggleFlip = useCallback(() => setFlipped((value) => !value), []);
  // меню «Ещё» и реквизиты относятся к одной карте: при смене карты всё закрывается
  const changeIndex = useCallback((next: number) => {
    setHeldHeight(contentHeight.current);
    setIndex(next);
    setFlipped(false);
    setExpanded(false);
  }, []);
  // реквизиты открываются из «Ещё», поэтому при его сворачивании карта возвращается лицом
  const toggleExpanded = useCallback(() => {
    if (expanded) setFlipped(false);
    setExpanded(!expanded);
  }, [expanded]);

  const padded = { paddingHorizontal: theme.spacing.xl };

  return (
    <Screen
      onRefresh={() => {
        void cards.refetch();
        void queryClient.invalidateQueries({ queryKey: ['transactions'] });
      }}
      refreshing={cards.isRefetching}
      onScrollBeginDrag={() => setHeldHeight(0)}
    >
      <View
        onLayout={(event) => {
          contentHeight.current = event.nativeEvent.layout.height;
        }}
        style={{ gap: theme.spacing.xxl, minHeight: heldHeight }}
      >
        <View style={padded}>
          <ScreenHeader
            size="large"
            title={t('cards.title')}
            actions={
              // заглушки: выпуск и привязка карт появятся вместе с API
              <ActionMenu
                title={t('cards.add.title')}
                cancelLabel={t('common.cancel')}
                accessibilityLabel={t('cards.addCard')}
                items={[
                  // на лимите вместо выпуска — объяснение, почему нельзя добавить ещё
                  ...(atCardLimit
                    ? [
                        {
                          id: 'limit',
                          label: t('cards.add.limit', { max: MAX_CARDS_PER_USER }),
                          systemImage: 'exclamationmark.circle' as const,
                          disabled: true,
                          onPress: () => {},
                        },
                      ]
                    : []),
                  {
                    id: 'virtual',
                    label: t('cards.add.virtual'),
                    systemImage: 'iphone',
                    disabled: atCardLimit,
                    onPress: () => {},
                  },
                  // пластиковые карты банк пока не выпускает — только виртуальные
                  {
                    id: 'physical',
                    label: t('cards.add.physical'),
                    systemImage: 'lock',
                    disabled: true,
                    onPress: () => {},
                  },
                  {
                    id: 'link',
                    label: t('cards.add.link'),
                    systemImage: 'link',
                    disabled: atCardLimit,
                    onPress: () => {},
                  },
                ]}
              >
                <GlassButton
                  shape="circle"
                  icon="plus"
                  accent
                  size={theme.sizes.avatarLarge}
                  accessibilityLabel={t('cards.addCard')}
                />
              </ActionMenu>
            }
          />
          <SearchField
            size="small"
            placeholder={t('cards.searchPlaceholder')}
            style={{ marginTop: theme.spacing.lg }}
          />
        </View>

        {cards.isPending ? (
          <View style={[padded, { gap: theme.spacing.lg }]}>
            <Skeleton
              height={(screenWidth - theme.spacing.xl * 2) / theme.sizes.cardAspectRatio}
              radius={theme.radii.bankCard}
            />
            <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
              {[0, 1, 2].map((key) => (
                <Skeleton
                  key={key}
                  width={MINI_CARD_WIDTH}
                  height={MINI_CARD_WIDTH / theme.sizes.cardAspectRatio}
                  radius={theme.radii.md}
                />
              ))}
            </View>
          </View>
        ) : cards.isError ? (
          <View style={padded}>
            <ErrorState onRetry={() => cards.refetch()} />
          </View>
        ) : (
          <CardPager
            cards={list}
            index={index}
            onIndexChange={changeIndex}
            flipped={flipped}
            onCardPress={toggleFlip}
            onDragStart={unflip}
          />
        )}

        {active ? (
          <View style={[padded, { gap: theme.spacing.xxl }]}>
            <CardActions
              card={active}
              flipped={flipped}
              expanded={expanded}
              onToggleExpanded={toggleExpanded}
              onToggleFlip={toggleFlip}
              onToggleFreeze={toggleFreeze}
            />

            <CardTransactions cardId={active.id} />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
