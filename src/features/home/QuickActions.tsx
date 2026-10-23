import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';
import { ActionCircle, GlassGroup, type IconName } from '@/ui';

import { MoreActionsMenu } from './MoreActionsMenu';

type Action = {
  id: string;
  icon: IconName;
  label: string;
  accent?: boolean;
  onPress: () => void;
};

/**
 * быстрые действия на Home: три стеклянных круга и «Ещё», который
 * открывает системное меню (Обменять, Оплатить, Вывести). соседние круги
 * в `GlassGroup` перетекают друг в друга при касании.
 */
export function QuickActions() {
  const { t } = useTranslation();
  const theme = useTheme();

  const actions: Action[] = [
    {
      id: 'transfer',
      icon: 'transfer',
      label: t('home.actions.transfer'),
      onPress: () => router.push('/transfer'),
    },
    {
      id: 'topUp',
      icon: 'plus',
      label: t('home.actions.topUp'),
      accent: true,
      onPress: () => router.push('/top-up'),
    },
    // покупка — в Trade: раздел Crypto сам проведёт через KYC и PIN
    {
      id: 'buyCrypto',
      icon: 'bitcoin',
      label: t('home.actions.buyCrypto'),
      onPress: () => router.push({ pathname: '/crypto', params: { section: 'trade' } }),
    },
  ];

  return (
    <GlassGroup
      spacing={theme.spacing.md}
      style={{ flexDirection: 'row', justifyContent: 'space-around' }}
    >
      {actions.map((action) => (
        <ActionCircle
          key={action.id}
          icon={action.icon}
          label={action.label}
          accent={action.accent}
          onPress={action.onPress}
        />
      ))}
      <MoreActionsMenu
        label={t('home.actions.more')}
        cancelLabel={t('home.actions.cancel')}
        actions={[
          {
            id: 'exchange',
            label: t('home.actions.exchange'),
            systemImage: 'arrow.left.arrow.right',
            onPress: () => router.push('/exchange'),
          },
          {
            id: 'pay',
            label: t('home.actions.pay'),
            systemImage: 'qrcode.viewfinder',
            onPress: () => router.push('/pay'),
          },
          {
            id: 'withdraw',
            label: t('home.actions.withdraw'),
            systemImage: 'arrow.up.right',
            onPress: () => router.push('/withdraw'),
          },
        ]}
      />
    </GlassGroup>
  );
}
