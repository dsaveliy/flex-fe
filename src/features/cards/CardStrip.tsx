import Animated, {
  type AnimatedRef,
  type SharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';

import type { BankCard } from '@/api';
import { useTheme } from '@/theme';

import { MiniCard } from './MiniCard';

export type CardStripProps = {
  cards: BankCard[];
  index: number;
  progress: SharedValue<number>;
  scrollRef: AnimatedRef<Animated.ScrollView>;
  /** текущий сдвиг ленты — нужен, чтобы плавно догонять активную карту */
  offset: SharedValue<number>;
  /** пользователь сам листает ленту — автоследование на паузе */
  manual: SharedValue<boolean>;
  onSelect: (index: number) => void;
};

/** горизонтальная лента мини-карт; тап по карте листает большую карусель */
export function CardStrip({
  cards,
  index,
  progress,
  scrollRef,
  offset,
  manual,
  onSelect,
}: CardStripProps) {
  const theme = useTheme();

  const onScroll = useAnimatedScrollHandler({
    onBeginDrag: () => {
      manual.value = true;
    },
    onScroll: (event) => {
      offset.value = event.contentOffset.x;
    },
  });

  return (
    <Animated.ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
      // запас под рамку-свечение и увеличение активной мини-карты
      contentContainerStyle={{
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
        gap: theme.spacing.md,
      }}
      style={{ marginVertical: -theme.spacing.md }}
    >
      {cards.map((card, cardIndex) => (
        <MiniCard
          key={card.id}
          card={card}
          index={cardIndex}
          progress={progress}
          selected={cardIndex === index}
          onPress={() => onSelect(cardIndex)}
        />
      ))}
    </Animated.ScrollView>
  );
}
