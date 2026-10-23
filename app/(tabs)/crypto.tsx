import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { useCryptoSession } from '@/auth';
import { CryptoGate } from '@/features/auth/CryptoGate';
import { CryptoLogo } from '@/features/crypto/CryptoLogo';
import { EditControls } from '@/features/crypto/EditControls';
import type { CryptoSection } from '@/features/crypto/cryptoSections';
import { SectionBar } from '@/features/crypto/SectionBar';
import { ConvertSection } from '@/features/crypto/sections/ConvertSection';
import { DesktopSection } from '@/features/crypto/sections/DesktopSection';
import { EarnSection } from '@/features/crypto/sections/EarnSection';
import { FiatSection } from '@/features/crypto/sections/FiatSection';
import { NewsSection } from '@/features/crypto/sections/NewsSection';
import { PortfolioSection } from '@/features/crypto/sections/PortfolioSection';
import { RatesSection } from '@/features/crypto/sections/RatesSection';
import { TradeSection } from '@/features/crypto/sections/TradeSection';
import { useTheme } from '@/theme';
import { Screen, ScreenHeader, SearchField } from '@/ui';

/**
 * экран Crypto. под поиском — строка разделов: «Мой стол» пользователь
 * собирает сам из виджетов (раскладка хранится в его настройках на бэкенде),
 * остальные разделы — готовые экраны банка. карандаш включает режим
 * редактирования стола (покачивание, «−», перетаскивание): аватар прячется,
 * справа «+» (галерея виджетов) и капсула «Готово».
 * всё ниже шапки закрыто `CryptoGate`: без crypto-токена там KYC, настройка
 * PIN или ввод PIN / Face ID
 */
export default function CryptoScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [section, setSection] = useState<CryptoSection>('desktop');
  // переход с другого экрана сразу в раздел, например «Купить крипто» на Home → Trade
  const { section: requested } = useLocalSearchParams<{ section?: CryptoSection }>();
  const [editing, setEditing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // пока виджет под пальцем, прокрутка экрана выключена (ставится из UI-потока жеста)
  const scrollLock = useSharedValue(false);
  const unlocked = Boolean(useCryptoSession().token);

  useEffect(() => {
    if (requested) {
      setEditing(false);
      setSection(requested);
    }
  }, [requested]);

  // раздел закрылся посреди редактирования — после входа стол снова в обычном режиме
  useEffect(() => {
    if (!unlocked) setEditing(false);
  }, [unlocked]);

  const enterEdit = useCallback(() => setEditing(true), []);
  const openGallery = useCallback(() => router.push('/widget-gallery'), []);
  // редактирование относится только к столу: при уходе в другой раздел оно выключается
  const changeSection = useCallback((next: CryptoSection) => {
    setEditing(false);
    setSection(next);
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  };

  const onDesktop = section === 'desktop' && unlocked;

  return (
    <Screen
      onRefresh={editing || !unlocked ? undefined : () => void refresh()}
      refreshing={refreshing}
      scrollLock={scrollLock}
    >
      <View style={{ paddingHorizontal: theme.spacing.xl }}>
        <ScreenHeader
          size="large"
          title={t('crypto.title')}
          titleNode={<CryptoLogo />}
          // на столе аватар рисует EditControls: в режиме редактирования его накрывает «Готово»
          hideAvatar={onDesktop}
          actions={
            onDesktop ? (
              <EditControls
                editing={editing}
                onEdit={enterEdit}
                onDone={() => setEditing(false)}
                onAdd={openGallery}
              />
            ) : null
          }
        />

        <View style={{ marginTop: theme.spacing.md }}>
          <CryptoGate>
            <View style={{ gap: theme.spacing.xxl }}>
              <View style={{ gap: theme.spacing.md }}>
                <SearchField
                  size="small"
                  placeholder={t('crypto.searchPlaceholder')}
                  editable={!editing}
                  style={{ marginTop: theme.spacing.xs }}
                />
                <SectionBar value={section} onChange={changeSection} />
              </View>

              {section === 'desktop' ? (
                <DesktopSection
                  editing={editing}
                  onEnterEdit={enterEdit}
                  scrollLock={scrollLock}
                  onOpenGallery={openGallery}
                  onOpenSection={changeSection}
                />
              ) : section === 'rates' ? (
                <RatesSection />
              ) : section === 'news' ? (
                <NewsSection />
              ) : section === 'trade' ? (
                <TradeSection />
              ) : section === 'convert' ? (
                <ConvertSection />
              ) : section === 'fiat' ? (
                <FiatSection />
              ) : section === 'portfolio' ? (
                <PortfolioSection />
              ) : (
                <EarnSection />
              )}
            </View>
          </CryptoGate>
        </View>
      </View>
    </Screen>
  );
}
