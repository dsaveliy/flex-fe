import { type Href, router, usePathname } from 'expo-router';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useBalance, useCards } from '@/api';
import { useTheme } from '@/theme';
import { formatMoney } from '@/utils/money';

import { GlassCard } from './GlassCard';
import { useAccessibilityFlags } from './hooks/useAccessibilityFlags';
import { useAppDimensions } from './hooks/useAppDimensions';
import { useTabBarShown } from './hooks/useTabBarShown';
import { Icon, type IconName } from './icons/Icon';
import { Touchable } from './Pressable';
import { PrivateAmount } from './PrivateAmount';
import type { SectionSwitchProps } from './SectionSwitch';
import { Text } from './Text';

type Section = { path: string; href: Href; icon: IconName; label: string };

/** вкладки из app/(tabs); порядок — как в таб-баре */
const SECTIONS: Section[] = [
  { path: '/', href: '/', icon: 'home', label: 'tabs.home' },
  { path: '/crypto', href: '/crypto', icon: 'crypto', label: 'tabs.crypto' },
  { path: '/cards', href: '/cards', icon: 'cards', label: 'tabs.cards' },
];

const MENU_WIDTH = 296;

const OpenContext = createContext(false);

/**
 * в браузере на телефоне внизу уже есть панель Safari/Chrome, поэтому своего таб-бара
 * нет: заголовок вкладки со стрелкой раскрывает стеклянное меню разделов — оно
 * вырастает из заголовка. с экрана «Домой» и на компьютере — обычный таб-бар
 */
export function SectionSwitch({ children, style }: SectionSwitchProps) {
  const { t } = useTranslation();
  const tabBarShown = useTabBarShown();
  const anchorRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);

  if (tabBarShown) return <View style={style}>{children}</View>;

  const open = () =>
    anchorRef.current?.measureInWindow((x, y, _width, height) => setAnchor({ x, y: y + height }));

  return (
    <OpenContext.Provider value={anchor !== null}>
      <View ref={anchorRef} style={style}>
        <Touchable
          accessibilityRole="button"
          accessibilityLabel={t('nav.open')}
          accessibilityState={{ expanded: anchor !== null }}
          pressedScale={0.98}
          onPress={open}
        >
          {children}
        </Touchable>
      </View>
      {anchor ? <SectionMenu anchor={anchor} onClosed={() => setAnchor(null)} /> : null}
    </OpenContext.Provider>
  );
}

/** стрелка ⌄ после заголовка; поворачивается, пока меню открыто */
export function SectionChevron() {
  const theme = useTheme();
  const tabBarShown = useTabBarShown();
  const isOpen = useContext(OpenContext);
  if (tabBarShown) return null;

  return (
    <View
      style={
        {
          transform: [{ rotate: isOpen ? '180deg' : '0deg' }],
          transition: 'transform 220ms cubic-bezier(0.3, 0.7, 0.4, 1)',
        } as ViewStyle
      }
    >
      <Icon name="chevronDown" size={20} color={theme.colors.accent} strokeWidth={2.2} />
    </View>
  );
}

function SectionMenu({
  anchor,
  onClosed,
}: {
  anchor: { x: number; y: number };
  onClosed: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const pathname = usePathname();
  const { width } = useAppDimensions();
  const { reduceMotion } = useAccessibilityFlags();
  const balance = useBalance();
  const cards = useCards();
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (!reduceMotion) progress.value = withSpring(1, theme.springs.pill);
  }, [progress, reduceMotion, theme.springs.pill]);

  // меню «вырастает» из заголовка: от верхнего левого угла, с лёгким пружинным перелётом
  const menuStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, progress.value * 1.6),
    transform: [
      { translateY: (1 - progress.value) * -12 },
      { scaleX: 0.55 + progress.value * 0.45 },
      { scaleY: 0.35 + progress.value * 0.65 },
    ],
  }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, progress.value) }));

  const close = (then?: () => void) => {
    const finish = () => {
      onClosed();
      then?.();
    };
    if (reduceMotion) return finish();
    progress.value = withTiming(0, { duration: theme.durations.fast }, (done) => {
      if (done) scheduleOnRN(finish);
    });
  };

  const subtitle = (section: Section) => {
    if (section.path === '/' && balance.data) {
      return (
        <PrivateAmount maskVariant="caption" maskColor="textMuted">
          <Text variant="caption" color="textMuted">
            {formatMoney(balance.data.total)}
          </Text>
        </PrivateAmount>
      );
    }
    const text =
      section.path === '/crypto'
        ? t('nav.cryptoHint')
        : section.path === '/cards' && cards.data
          ? t('nav.cardsCount', { count: cards.data.length })
          : null;
    return text ? (
      <Text variant="caption" color="textMuted">
        {text}
      </Text>
    ) : null;
  };

  return (
    <Modal visible transparent animationType="none" onRequestClose={() => close()}>
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.cancel')}
          onPress={() => close()}
          style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.overlay }]}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.menu,
          {
            left: anchor.x,
            top: anchor.y + theme.spacing.sm,
            width: Math.min(MENU_WIDTH, width - anchor.x - theme.spacing.lg),
          },
          menuStyle,
        ]}
      >
        <GlassCard variant="regular" blur radius={theme.radii.widget} padding={theme.spacing.xs}>
          <Text
            variant="label"
            color="textMuted"
            uppercase
            style={{ paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm }}
          >
            {t('nav.title')}
          </Text>
          {SECTIONS.map((section) => {
            const active = pathname === section.path;
            return (
              <Touchable
                key={section.path}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                pressedScale={0.98}
                onPress={() => close(active ? undefined : () => router.navigate(section.href))}
                style={[
                  styles.row,
                  {
                    gap: theme.spacing.md,
                    padding: theme.spacing.md,
                    borderRadius: theme.radii.card - theme.spacing.xs,
                    backgroundColor: active ? theme.colors.accentMuted : 'transparent',
                  },
                ]}
              >
                <View
                  style={[
                    styles.icon,
                    { backgroundColor: active ? theme.colors.accent : theme.colors.glassFill },
                  ]}
                >
                  <Icon
                    name={section.icon}
                    size={20}
                    color={active ? theme.colors.textInverse : theme.colors.textPrimary}
                  />
                </View>
                <View style={styles.text}>
                  <Text variant="headline">{t(section.label)}</Text>
                  {subtitle(section)}
                </View>
                {active ? <Icon name="check" size={20} color={theme.colors.accent} /> : null}
              </Touchable>
            );
          })}
        </GlassCard>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    transformOrigin: 'top left',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 2,
  },
});
