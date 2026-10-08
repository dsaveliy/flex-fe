import { useTranslation } from 'react-i18next';

import { useBalancePrivacy } from '@/providers/BalancePrivacyProvider';
import { useTheme } from '@/theme';
import { Glass, Icon, Touchable } from '@/ui';

/** маленькая стеклянная кнопка-глаз: скрывает и показывает суммы во всём приложении */
export function PrivacyToggle() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { hidden, toggle } = useBalancePrivacy();
  const size = 32;

  return (
    <Touchable
      accessibilityRole="switch"
      accessibilityState={{ checked: hidden }}
      accessibilityLabel={t('a11y.toggleBalance')}
      hitSlop={8}
      onPress={toggle}
    >
      <Glass
        variant="clear"
        interactive
        elevated={false}
        radius={size / 2}
        style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      >
        <Icon name={hidden ? 'eyeOff' : 'eye'} size={16} color={theme.colors.textMuted} />
      </Glass>
    </Touchable>
  );
}
