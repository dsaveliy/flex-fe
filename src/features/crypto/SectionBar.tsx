import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';
import { Icon, Text, Touchable } from '@/ui';

import { CRYPTO_SECTIONS, type CryptoSection } from './cryptoSections';

export type SectionBarProps = {
  value: CryptoSection;
  onChange: (section: CryptoSection) => void;
};

/**
 * строка разделов под поиском: матовые пилюли высотой с поисковую строку,
 * без стеклянных эффектов: тёмно-зелёная дымка и плотная светлая кромка. выбранная подсвечена мятой, строка сама
 * подкручивается к ней
 */
export function SectionBar({ value, onChange }: SectionBarProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const scroll = useRef<ScrollView>(null);
  const offsets = useRef<Partial<Record<CryptoSection, number>>>({});
  const inset = theme.spacing.xl;

  useEffect(() => {
    const x = offsets.current[value];
    if (x !== undefined)
      scroll.current?.scrollTo({ x: Math.max(0, x - inset * 2), animated: true });
  }, [inset, value]);

  return (
    <ScrollView
      ref={scroll}
      horizontal
      showsHorizontalScrollIndicator={false}
      // строка уходит под края экрана, как лента мини-карт
      style={{ marginHorizontal: -inset }}
      contentContainerStyle={{ paddingHorizontal: inset, gap: theme.spacing.sm }}
      accessibilityRole="tablist"
    >
      {CRYPTO_SECTIONS.map((section) => {
        const selected = section.id === value;
        return (
          <Touchable
            key={section.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            haptic={false}
            onLayout={(event) => {
              offsets.current[section.id] = event.nativeEvent.layout.x;
            }}
            onPress={() => {
              if (selected) return;
              void Haptics.selectionAsync();
              onChange(section.id);
            }}
          >
            <View
              style={[
                styles.pill,
                {
                  height: theme.sizes.searchHeightSmall,
                  borderRadius: theme.radii.pill,
                  paddingHorizontal: theme.spacing.md + 2,
                  gap: theme.spacing.xs + 2,
                  backgroundColor: selected ? theme.colors.pillSelectedFill : theme.colors.pillFill,
                  borderColor: selected ? theme.colors.accent : theme.colors.pillBorder,
                },
              ]}
            >
              <Icon
                name={section.icon}
                size={15}
                color={selected ? theme.colors.accent : theme.colors.textMuted}
              />
              <Text variant="bodyStrong" color={selected ? 'accent' : 'textPrimary'}>
                {t(`crypto.sections.${section.id}`)}
              </Text>
            </View>
          </Touchable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
});
