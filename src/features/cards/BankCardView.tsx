import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { BankCard } from '@/api';
import { palette, useTheme } from '@/theme';
import { FlexLogo, Icon, PrivateAmount, Text } from '@/ui';
import { formatMoney } from '@/utils/money';

import { CardBrandMark } from './CardBrandMark';
import {
  CardBevel,
  CardGlare,
  CardGuilloche,
  CardHolo,
  type CardLight,
  EmvChip,
} from './CardLighting';
import { BLACK_TRANSPARENT, CARD_SKINS } from './cardStyles';
import { FrostOverlay } from './FrostOverlay';

/** базовая ширина карты в макете — от неё масштабируется графика пластика */
const BASE_WIDTH = 335;

export type BankCardViewProps = {
  card: BankCard;
  width: number;
  /** откуда падает свет: наклон телефона и свайп — блики и переливание бегут за ним */
  light: CardLight;
  /** карта в центре карусели — только у неё постоянные эффекты льда */
  active: boolean;
};

/**
 * пластик карты в реальной пропорции 1.586:1 (ISO/IEC 7810 ID-1), как в Wallet:
 * градиент из макета с лёгкой виньеткой, гильош, голографическое переливание
 * и глянцевые блики, бегущие за светом, фаска по краю, золотой EMV-чип,
 * тиснёные цифры и баланс (участвует в «скрыть баланс»).
 * у замороженной карты поверх — лёд (`FrostOverlay`).
 */
export function BankCardView({ card, width, light, active }: BankCardViewProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const skin = CARD_SKINS[card.style];
  const unit = width / BASE_WIDTH;
  const height = width / theme.sizes.cardAspectRatio;
  const radius = theme.radii.bankCard * unit;
  const frozen = card.status === 'frozen';
  const onDark = skin.ink === palette.white;
  // тиснение: на тёмном пластике тень под буквами, на светлом — светлая кромка
  const emboss = {
    textShadowColor: onDark ? `${palette.black}66` : `${palette.white}aa`,
    textShadowOffset: { width: 0, height: onDark ? unit : -0.5 * unit },
    textShadowRadius: 0.5,
  };
  const ink = { color: skin.ink, ...emboss };
  const inkMuted = { color: skin.ink, opacity: 0.7, ...emboss };

  // лёд остаётся смонтированным, пока не дотает
  const [frostMounted, setFrostMounted] = useState(frozen);
  // карта, замороженная ещё до открытия экрана, показывается сразу со льдом
  const skipIntro = useRef(frozen);
  useEffect(() => {
    if (frozen) setFrostMounted(true);
  }, [frozen]);
  const handleMelted = useCallback(() => {
    skipIntro.current = false;
    setFrostMounted(false);
  }, []);

  return (
    <View style={[{ width, height, borderRadius: radius }, theme.shadows.card]}>
      <View style={[styles.clip, { borderRadius: radius }]}>
        <LinearGradient
          colors={skin.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* виньетка: к нижнему правому углу пластик чуть темнее — появляется объём */}
        <LinearGradient
          colors={[BLACK_TRANSPARENT, palette.black]}
          start={{ x: 0.35, y: 0.3 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { opacity: onDark ? 0.35 : 0.12 }]}
        />
        <CardGuilloche width={width} height={height} ink={skin.ink} />
        <CardHolo width={width} height={height} light={light} onDark={onDark} />
        <CardGlare width={width} height={height} light={light} id={card.id} />

        <View style={[styles.content, { padding: theme.spacing.xl * unit }]}>
          <View style={styles.row}>
            <View style={[styles.row, { gap: theme.spacing.sm * unit }]}>
              <FlexLogo size={24 * unit} />
              <Text variant="sectionTitle" style={ink}>
                {card.productName}
              </Text>
            </View>
            <CardBrandMark brand={card.brand} ink={skin.ink} unit={unit} />
          </View>

          <View style={[styles.row, styles.start, { gap: theme.spacing.md * unit }]}>
            <EmvChip unit={unit} id={card.id} />
            {card.contactless ? (
              <View style={{ opacity: 0.55 }}>
                <Icon name="contactless" size={22 * unit} color={skin.ink} />
              </View>
            ) : null}
          </View>

          <View>
            <Text variant="bodyStrong" style={inkMuted}>
              {`••••  ${card.last4}`}
            </Text>
            <View style={[styles.row, styles.baseline, { marginTop: theme.spacing.xxs }]}>
              <View style={[styles.row, styles.baseline, { gap: theme.spacing.xs }]}>
                <PrivateAmount maskVariant="title" maskColorValue={skin.ink}>
                  <Text variant="title" style={ink}>
                    {formatMoney(card.balance, { withCurrency: false })}
                  </Text>
                </PrivateAmount>
                <Text variant="bodyStrong" style={inkMuted}>
                  {card.balance.currency}
                </Text>
              </View>
              {/* у замороженной карты на этом месте стоит плашка «Заморожена» */}
              <Text variant="caption" style={[inkMuted, frozen ? styles.hidden : null]}>
                {t(`cards.kinds.${card.kind}`)}
              </Text>
            </View>
          </View>
        </View>

        {frostMounted ? (
          <FrostOverlay
            seed={card.id}
            frozen={frozen}
            skipIntro={skipIntro.current}
            onMelted={handleMelted}
            width={width}
            height={height}
            active={active}
            inset={theme.spacing.xl * unit}
          />
        ) : null}

        <CardBevel width={width} height={height} radius={radius} id={card.id} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hidden: {
    opacity: 0,
  },
  clip: {
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  start: {
    justifyContent: 'flex-start',
  },
  // у PrivateAmount вокруг текста своя View, поэтому базовую линию не выровнять — прижимаем к низу
  baseline: {
    alignItems: 'flex-end',
  },
});
