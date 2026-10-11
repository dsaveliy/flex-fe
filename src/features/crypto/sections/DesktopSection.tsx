import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut, type SharedValue } from 'react-native-reanimated';

import { useCryptoLayout, useSaveCryptoLayout } from '@/api';
import { useTheme } from '@/theme';
import {
  ErrorState,
  GlassButton,
  Icon,
  Skeleton,
  Text,
  Touchable,
  useAccessibilityFlags,
} from '@/ui';

import type { CryptoSection } from '../cryptoSections';
import { WidgetGrid } from '../WidgetGrid';

export type DesktopSectionProps = {
  editing: boolean;
  onEnterEdit: () => void;
  /** пока виджет под пальцем, прокрутка экрана выключена */
  scrollLock: SharedValue<boolean>;
  onOpenGallery: () => void;
  onOpenSection: (section: CryptoSection) => void;
};

/** «Мой стол»: виджеты, которые пользователь собрал сам */
export function DesktopSection({
  editing,
  onEnterEdit,
  scrollLock,
  onOpenGallery,
  onOpenSection,
}: DesktopSectionProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { reduceMotion } = useAccessibilityFlags();
  const layout = useCryptoLayout();
  const save = useSaveCryptoLayout();
  const widgets = layout.data?.widgets ?? [];

  if (layout.isPending) {
    return (
      <View style={{ flexDirection: 'row', gap: theme.spacing.lg }}>
        {[0, 1].map((key) => (
          <Skeleton key={key} height={156} radius={theme.radii.widget} style={{ flex: 1 }} />
        ))}
      </View>
    );
  }

  if (layout.isError) return <ErrorState onRetry={() => layout.refetch()} />;

  if (widgets.length === 0) {
    return (
      <View style={{ alignItems: 'center', gap: theme.spacing.md, paddingTop: theme.spacing.huge }}>
        <Text variant="sectionTitle">{t('crypto.empty.title')}</Text>
        <Text variant="body" color="textMuted" align="center">
          {t('crypto.empty.subtitle')}
        </Text>
        <GlassButton
          label={t('crypto.addWidget')}
          icon="plus"
          accent
          onPress={() => {
            onEnterEdit();
            onOpenGallery();
          }}
          style={{ marginTop: theme.spacing.sm }}
        />
      </View>
    );
  }

  return (
    <View style={{ gap: theme.spacing.lg }}>
      <WidgetGrid
        widgets={widgets}
        editing={editing}
        onChange={(next) => save.mutate(next)}
        onEnterEdit={onEnterEdit}
        scrollLock={scrollLock}
        onOpenSection={onOpenSection}
      />
      {/* вторая точка входа в галерею, кроме «+» в шапке. стекла внутри нет,
          поэтому появление можно анимировать */}
      {editing ? (
        <Animated.View
          entering={reduceMotion ? undefined : FadeIn.duration(theme.durations.normal)}
          exiting={reduceMotion ? undefined : FadeOut.duration(theme.durations.fast)}
        >
          <Touchable
            accessibilityRole="button"
            accessibilityLabel={t('crypto.addWidget')}
            onPress={onOpenGallery}
          >
            <View
              style={{
                height: theme.sizes.addWidgetHeight,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: theme.radii.widget,
                borderWidth: 1.5,
                borderStyle: 'dashed',
                borderColor: theme.colors.pillBorder,
                backgroundColor: theme.colors.pillFill,
              }}
            >
              <Icon name="plus" size={30} color={theme.colors.textPrimary} />
            </View>
          </Touchable>
        </Animated.View>
      ) : null}
    </View>
  );
}
