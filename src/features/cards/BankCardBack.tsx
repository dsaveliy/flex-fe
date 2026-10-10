import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { BankCard } from '@/api';
import { palette, useTheme } from '@/theme';
import { FlexLogo } from '@/ui';

import { CardBrandMark } from './CardBrandMark';
import { CardDetailsBlock } from './CardDetailsBlock';
import { CARD_SKINS, WHITE_TRANSPARENT } from './cardStyles';
import { requestSensitiveAccess } from './sensitiveAccess';

const BASE_WIDTH = 335;

export type BankCardBackProps = {
  card: BankCard;
  width: number;
  /** карта сейчас перевёрнута; при возврате на лицевую сторону реквизиты снова скрываются */
  flipped: boolean;
};

/**
 * оборотная сторона пластика: магнитная полоса и реквизиты. реквизиты скрыты,
 * пока пользователь не нажмёт на них и не пройдёт проверку доступа.
 */
export function BankCardBack({ card, width, flipped }: BankCardBackProps) {
  const theme = useTheme();
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!flipped) setRevealed(false);
  }, [flipped]);

  const toggleDetails = async () => {
    if (revealed) {
      setRevealed(false);
      return;
    }
    if (await requestSensitiveAccess()) setRevealed(true);
  };

  const skin = CARD_SKINS[card.style];
  const unit = width / BASE_WIDTH;
  const height = width / theme.sizes.cardAspectRatio;
  const radius = theme.radii.bankCard * unit;

  return (
    <View style={[{ width, height, borderRadius: radius }, theme.shadows.card]}>
      <View style={[styles.clip, { borderRadius: radius }]}>
        {/* градиент зеркальный лицевой стороне — как у настоящего пластика */}
        <LinearGradient
          colors={skin.colors}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={[palette.white, WHITE_TRANSPARENT]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0.4, y: 0.7 }}
          style={[StyleSheet.absoluteFill, { opacity: 0.25 }]}
        />
        <View
          style={{
            marginTop: theme.spacing.lg * unit,
            height: 34 * unit,
            backgroundColor: palette.cardDarkB,
            opacity: 0.85,
          }}
        />
        <View
          style={{
            flex: 1,
            justifyContent: 'space-between',
            paddingHorizontal: theme.spacing.xl * unit,
            paddingTop: theme.spacing.md * unit,
            paddingBottom: theme.spacing.lg * unit,
          }}
        >
          <CardDetailsBlock
            card={card}
            ink={skin.ink}
            revealed={revealed}
            onPress={() => void toggleDetails()}
          />
          <View style={styles.footer}>
            <FlexLogo size={18 * unit} />
            <CardBrandMark brand={card.brand} ink={skin.ink} unit={unit * 0.8} />
          </View>
        </View>
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: radius,
              borderWidth: StyleSheet.hairlineWidth * 2,
              borderColor: palette.white,
              opacity: 0.4,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    flex: 1,
    overflow: 'hidden',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
