import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';
import { FlexLogo, Text } from '@/ui';

/** логотип раздела по макету: лист Flex, мелкое «Flex» и крупное акцентное «Crypto» */
export function CryptoLogo() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={[styles.row, { gap: theme.spacing.sm }]}>
      <FlexLogo size={36} />
      <View>
        <Text variant="label" color="textMuted">
          {t('crypto.logo.brand')}
        </Text>
        <Text variant="title" color="accent" style={styles.title}>
          {t('crypto.logo.section')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    // плотнее к надписи «Flex», как в макете
    marginTop: -2,
  },
});
