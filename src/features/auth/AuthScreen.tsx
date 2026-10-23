import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme';
import { FlexLogo, GlassCard, Screen, Text, Touchable } from '@/ui';

type AuthScreenProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** низ экрана: ссылка «Нет аккаунта? …» */
  footer?: ReactNode;
};

/** общая раскладка экранов входа: лист Flex, крупный заголовок, форма, ссылка внизу */
export function AuthScreen({ title, subtitle, children, footer }: AuthScreenProps) {
  const theme = useTheme();

  return (
    <Screen
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View
        style={{
          flex: 1,
          paddingHorizontal: theme.spacing.xl,
          paddingTop: theme.spacing.huge,
          gap: theme.spacing.xxl,
        }}
      >
        <View style={{ gap: theme.spacing.sm }}>
          <FlexLogo size={44} />
          <Text variant="largeTitle">{title}</Text>
          {subtitle ? (
            <Text variant="body" color="textMuted">
              {subtitle}
            </Text>
          ) : null}
        </View>
        {children}
        {footer ? (
          <View style={{ marginTop: 'auto', alignItems: 'center', paddingTop: theme.spacing.xl }}>
            {footer}
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

/** строка-ссылка «Вопрос? Действие» */
export function AuthLink({
  question,
  action,
  onPress,
}: {
  question: string;
  action: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Touchable accessibilityRole="link" onPress={onPress} hitSlop={theme.spacing.sm}>
      <Text variant="body" color="textMuted">
        {question}{' '}
        <Text variant="bodyStrong" color="accent">
          {action}
        </Text>
      </Text>
    </Touchable>
  );
}

/** плашка-уведомление над формой (причина выхода, «аккаунт создан») */
export function AuthNotice({ text, tone = 'info' }: { text: string; tone?: 'info' | 'warning' }) {
  const theme = useTheme();
  return (
    <GlassCard contentStyle={{ padding: theme.spacing.lg }}>
      <Text variant="bodyStrong" color={tone === 'warning' ? 'negative' : 'accent'}>
        {text}
      </Text>
    </GlassCard>
  );
}
