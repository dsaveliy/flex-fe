import { useTranslation } from 'react-i18next';
import { Image, Linking, StyleSheet, View } from 'react-native';

import { type ChatAttachment, chatFileUrl } from '@/api';
import { useTheme } from '@/theme';
import { Icon, Text, Touchable } from '@/ui';

import { formatFileSize } from './attachments';

/** одно фото — по пропорциям, несколько — плиткой в две колонки */
const SINGLE_WIDTH = 220;
const SINGLE_MIN_HEIGHT = 120;
const SINGLE_MAX_HEIGHT = 300;
const TILE = 108;

export type MessageAttachmentsProps = {
  attachments: ChatAttachment[];
  own: boolean;
  onOpenImage(attachment: ChatAttachment): void;
};

/** вложения в пузыре: миниатюры фото (нажатие — на весь экран) и карточки PDF (нажатие — открыть) */
export function MessageAttachments({ attachments, own, onOpenImage }: MessageAttachmentsProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const images = attachments.filter((item) => item.kind === 'image');
  const files = attachments.filter((item) => item.kind === 'file');
  const ink = own ? theme.colors.textInverse : theme.colors.textPrimary;

  const single = images.length === 1 ? images[0] : null;
  const singleHeight =
    single?.width && single.height
      ? Math.min(SINGLE_MAX_HEIGHT, Math.max(SINGLE_MIN_HEIGHT, (SINGLE_WIDTH * single.height) / single.width))
      : SINGLE_WIDTH * 0.75;

  return (
    <View style={{ gap: theme.spacing.xs, marginBottom: theme.spacing.xs }}>
      {images.length > 0 ? (
        <View style={[styles.grid, { gap: theme.spacing.xxs, maxWidth: TILE * 2 + theme.spacing.xxs }]}>
          {images.map((image) => (
            <Touchable
              key={image.id}
              haptic={false}
              pressedScale={0.97}
              onPress={() => onOpenImage(image)}
              accessibilityRole="imagebutton"
              accessibilityLabel={t('chat.attachment.openImage')}
            >
              <Image
                source={{ uri: chatFileUrl(image.thumbnailUrl ?? image.url) }}
                resizeMode="cover"
                style={{
                  width: single ? SINGLE_WIDTH : TILE,
                  height: single ? singleHeight : TILE,
                  borderRadius: theme.radii.md,
                  backgroundColor: theme.colors.glassFill,
                }}
              />
            </Touchable>
          ))}
        </View>
      ) : null}

      {files.map((file) => (
        <Touchable
          key={file.id}
          haptic={false}
          pressedScale={0.98}
          onPress={() => void Linking.openURL(chatFileUrl(file.url))}
          accessibilityRole="link"
          accessibilityLabel={t('chat.attachment.open', { name: file.name })}
          style={[
            styles.file,
            {
              gap: theme.spacing.sm,
              padding: theme.spacing.sm,
              borderRadius: theme.radii.md,
              backgroundColor: own ? theme.colors.glassFill : theme.colors.accentMuted,
            },
          ]}
        >
          <View
            style={[
              styles.fileIcon,
              {
                width: theme.sizes.iconButton,
                height: theme.sizes.iconButton,
                borderRadius: theme.radii.sm,
                backgroundColor: own ? theme.colors.glassFillStrong : theme.colors.glassFill,
              },
            ]}
          >
            <Icon name="document" size={22} color={own ? ink : theme.colors.accent} />
          </View>
          <View style={styles.fill}>
            <Text variant="bodyStrong" numberOfLines={1} style={{ color: ink }}>
              {file.name}
            </Text>
            <Text variant="caption" style={{ color: ink, opacity: 0.7 }}>
              {t('chat.attachment.pdfSize', { size: formatFileSize(file.sizeBytes, t) })}
            </Text>
          </View>
        </Touchable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  file: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 200,
  },
  fileIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: {
    flex: 1,
  },
});
