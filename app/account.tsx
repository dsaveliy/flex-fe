import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { USE_MOCK_API, useUser } from '@/api';
import { useLogout } from '@/auth';
import { AuthDebugCard } from '@/features/auth/AuthDebugCard';
import { CryptoSecurityCard } from '@/features/auth/CryptoSecurityCard';
import { type AppLanguage, changeLanguage, getCurrentLanguage } from '@/i18n';
import { useBalancePrivacy } from '@/providers/BalancePrivacyProvider';
import { useTheme, useThemeContext } from '@/theme';
import {
  Chip,
  CurrencyMenu,
  Glass,
  GlassCard,
  GlassGroup,
  Icon,
  ListRow,
  Screen,
  Skeleton,
  Text,
  Toggle,
} from '@/ui';

/**
 * профиль открывается с аватара в шапке любой вкладки (push поверх табов).
 * системный прозрачный хедер даёт стеклянную кнопку «назад» и свайп от края.
 */
export default function AccountScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { themeName, setThemeName } = useThemeContext();
  const { hidden, setHidden } = useBalancePrivacy();
  const user = useUser();
  const logout = useLogout();
  const currentLanguage = getCurrentLanguage();

  const handleLanguageChange = (language: AppLanguage) => {
    void changeLanguage(language);
  };

  const rowPadding = { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.xs };
  const avatarSize = 88;

  return (
    <Screen>
      <Stack.Screen options={{ title: t('account.title') }} />

      <View style={{ paddingHorizontal: theme.spacing.xl, gap: theme.spacing.xl }}>
        <View style={{ alignItems: 'center', gap: theme.spacing.md }}>
          <Glass
            variant="regular"
            radius={avatarSize / 2}
            style={{
              width: avatarSize,
              height: avatarSize,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text variant="title" color="accent">
              {user.data ? `${user.data.firstName.charAt(0)}${user.data.lastName.charAt(0)}` : ''}
            </Text>
          </Glass>
          {user.isPending ? (
            <Skeleton height={24} width={160} />
          ) : (
            <Text variant="title">
              {user.data ? `${user.data.firstName} ${user.data.lastName}` : ''}
            </Text>
          )}
          <Text variant="caption" color="textMuted">
            {t('common.tagline')}
          </Text>
        </View>

        <GlassCard contentStyle={rowPadding}>
          <ListRow
            title={t('account.rows.profile')}
            left={<Icon name="user" color={theme.colors.accent} />}
            right={<Icon name="chevronRight" size={16} color={theme.colors.textMuted} />}
            onPress={() => {}}
            showDivider
          />
          <ListRow
            title={t('account.rows.security')}
            left={<Icon name="shield" color={theme.colors.accent} />}
            right={<Icon name="chevronRight" size={16} color={theme.colors.textMuted} />}
            onPress={() => {}}
          />
        </GlassCard>

        <CryptoSecurityCard />

        <GlassCard contentStyle={rowPadding}>
          <ListRow
            title={t('account.rows.hideBalance')}
            subtitle={t('account.hideBalanceHint')}
            left={<Icon name="eyeOff" color={theme.colors.accent} />}
            right={<Toggle value={hidden} onValueChange={setHidden} />}
            showDivider
          />
          <ListRow
            title={t('account.rows.displayCurrency')}
            subtitle={t('account.displayCurrencyHint')}
            left={<Icon name="transfer" color={theme.colors.accent} />}
            right={<CurrencyMenu variant="bodyStrong" color="accent" />}
            showDivider
          />
          <ListRow
            title={t('account.rows.language')}
            left={<Icon name="account" color={theme.colors.accent} />}
            right={
              <GlassGroup
                spacing={theme.spacing.sm}
                style={{ flexDirection: 'row', gap: theme.spacing.sm }}
              >
                <Chip
                  label="RU"
                  selected={currentLanguage === 'ru'}
                  onPress={() => handleLanguageChange('ru')}
                />
                <Chip
                  label="EN"
                  selected={currentLanguage === 'en'}
                  onPress={() => handleLanguageChange('en')}
                />
              </GlassGroup>
            }
            showDivider
          />
          <ListRow
            title={t('account.rows.theme')}
            left={<Icon name="moon" color={theme.colors.accent} />}
            right={
              <GlassGroup
                spacing={theme.spacing.sm}
                style={{ flexDirection: 'row', gap: theme.spacing.sm }}
              >
                <Chip
                  label={t('account.themeLight')}
                  selected={themeName === 'light'}
                  onPress={() => setThemeName('light')}
                />
                <Chip
                  label={t('account.themeDark')}
                  selected={themeName === 'dark'}
                  onPress={() => setThemeName('dark')}
                />
              </GlassGroup>
            }
          />
        </GlassCard>

        <GlassCard contentStyle={rowPadding}>
          <ListRow
            title={t('account.rows.logOut')}
            left={<Icon name="logout" color={theme.colors.negative} />}
            onPress={logout.isPending ? undefined : () => logout.mutate()}
          />
        </GlassCard>

        {__DEV__ && USE_MOCK_API ? <AuthDebugCard /> : null}
      </View>
    </Screen>
  );
}
