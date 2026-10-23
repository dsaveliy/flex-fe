import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { type ReactNode, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, View } from 'react-native';

import { useTheme } from '@/theme';
import { GlassButton, Icon, Text, Touchable } from '@/ui';

export type OperationSuccess = {
  title: string;
  /** строки под заголовком: сумма, комиссия, курс */
  lines?: string[];
};

type OperationSheetProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  submitLabel: string;
  onSubmit: () => void;
  pending?: boolean;
  /** ошибка формы или сервера — над кнопкой */
  error?: string | null;
  /** после успеха форма сменяется подтверждением с кнопкой «Готово» */
  success?: OperationSuccess | null;
};

/**
 * шторка денежной операции (перевод, пополнение, обмен): заголовок, поля,
 * ошибка и кнопка внизу; после успеха — галочка и итог. на iOS фон даёт
 * системная шторка, на web и Android — фон темы
 */
export function OperationSheet({
  title,
  subtitle,
  children,
  submitLabel,
  onSubmit,
  pending = false,
  error,
  success,
}: OperationSheetProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  useEffect(() => {
    if (success) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [success]);

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      style={Platform.OS === 'ios' ? undefined : { backgroundColor: theme.colors.backgroundTop }}
      contentContainerStyle={{
        flexGrow: 1,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.xxxl,
        gap: theme.spacing.xxl,
      }}
    >
      {success ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            gap: theme.spacing.lg,
            paddingTop: theme.spacing.huge,
          }}
        >
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.colors.accentSoft,
            }}
          >
            <Icon name="check" size={36} color={theme.colors.accent} strokeWidth={2.4} />
          </View>
          <Text variant="title" align="center">
            {success.title}
          </Text>
          {success.lines?.map((line) => (
            <Text key={line} variant="body" color="textMuted" align="center">
              {line}
            </Text>
          ))}
          <GlassButton
            label={t('operations.done')}
            accent
            onPress={() => router.back()}
            size={theme.sizes.touchTarget + theme.spacing.xs}
            style={{ alignSelf: 'stretch', marginTop: 'auto' }}
          />
        </View>
      ) : (
        <>
          <View style={{ gap: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md }}>
              <Text variant="title" style={{ flex: 1 }}>
                {title}
              </Text>
              {/* на iOS шторку закрывают и свайпом вниз, на web и Android нужна кнопка */}
              <Touchable
                accessibilityRole="button"
                onPress={() => router.back()}
                hitSlop={theme.spacing.sm}
                style={{ paddingTop: theme.spacing.xs }}
              >
                <Text variant="headline" color="accent">
                  {t('common.cancel')}
                </Text>
              </Touchable>
            </View>
            {subtitle ? (
              <Text variant="body" color="textMuted">
                {subtitle}
              </Text>
            ) : null}
          </View>
          <View style={{ gap: theme.spacing.lg }}>{children}</View>
          <View style={{ marginTop: 'auto', gap: theme.spacing.md }}>
            {error ? (
              <Text
                variant="bodyStrong"
                color="negative"
                align="center"
                accessibilityLiveRegion="polite"
              >
                {error}
              </Text>
            ) : null}
            <GlassButton
              label={pending ? '…' : submitLabel}
              accent
              onPress={pending ? undefined : onSubmit}
              size={theme.sizes.touchTarget + theme.spacing.xs}
              style={{ alignSelf: 'stretch' }}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}
