import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { type AppLanguage, changeLanguage, getCurrentLanguage } from '@/i18n';
import { useTheme } from '@/theme';
import { Chip, GlassCard, Icon, ListRow, Screen, Text } from '@/ui';

/** простой экран-заглушка; переключатель языка полностью рабочий */
export default function AccountScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const currentLanguage = getCurrentLanguage();

  const handleLanguageChange = (language: AppLanguage) => {
    void changeLanguage(language);
  };

  return (
    <Screen>
      <View style={{ paddingHorizontal: theme.spacing.xl, gap: theme.spacing.xl }}>
        <Text variant="title">{t('account.title')}</Text>

        <GlassCard contentStyle={{ padding: 0 }}>
          <ListRow
            title={t('account.rows.profile')}
            left={<Icon name="account" color={theme.colors.accent} />}
            right={<Icon name="chevronRight" size={16} color={theme.colors.textMuted} />}
            showDivider
          />
          <ListRow
            title={t('account.rows.security')}
            left={<Icon name="contactless" color={theme.colors.accent} />}
            right={<Icon name="chevronRight" size={16} color={theme.colors.textMuted} />}
            showDivider
          />

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: theme.spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.divider,
            }}
          >
            <Text variant="bodyStrong">{t('account.rows.language')}</Text>
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
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
            </View>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: theme.spacing.md,
            }}
          >
            <Text variant="bodyStrong" color="textInactive">
              {t('account.rows.theme')}
            </Text>
            <Text variant="caption" color="textInactive">
              {t('account.themeComingSoon')}
            </Text>
          </View>
        </GlassCard>

        <GlassCard contentStyle={{ padding: 0 }}>
          <ListRow title={t('account.rows.logOut')} left={<Icon name="chevronRight" size={18} />} />
        </GlassCard>
      </View>
    </Screen>
  );
}
