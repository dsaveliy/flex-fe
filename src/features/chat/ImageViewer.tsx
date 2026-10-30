import { useTranslation } from 'react-i18next';
import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type ChatAttachment, chatFileUrl } from '@/api';
import { useTheme } from '@/theme';
import { Icon, Touchable } from '@/ui';

/** фото из чата на весь экран; закрывается крестиком, нажатием на фон и жестом «назад» */
export function ImageViewer({
  image,
  onClose,
}: {
  image: ChatAttachment | null;
  onClose(): void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <Modal visible={image !== null} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.fill, { backgroundColor: theme.colors.overlay }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('chat.attachment.close')}
        />
        {image ? (
          // касания проходят к фону: нажатие по фото тоже закрывает просмотр
          <View
            pointerEvents="none"
            style={[
              styles.fill,
              { marginTop: insets.top + theme.sizes.touchTarget, marginBottom: insets.bottom + theme.spacing.lg },
            ]}
          >
            <Image
              source={{ uri: chatFileUrl(image.url) }}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
              style={styles.fill}
            />
          </View>
        ) : null}
        <Touchable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('chat.attachment.close')}
          style={[
            styles.close,
            {
              top: insets.top + theme.spacing.sm,
              right: theme.spacing.lg,
              width: theme.sizes.touchTarget,
              height: theme.sizes.touchTarget,
              borderRadius: theme.sizes.touchTarget / 2,
              backgroundColor: theme.colors.glassFillStrong,
            },
          ]}
        >
          <Icon name="close" color={theme.colors.textPrimary} />
        </Touchable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  close: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
