import type { TFunction } from 'i18next';
import { useCallback, useRef, useState } from 'react';

import { api, type ChatAttachment, type ChatMessage, type ChatUploadFile, isApiError } from '@/api';

/** как на сервере: до 10 файлов в сообщении, каждый до 10 МБ */
export const MAX_ATTACHMENTS = 10;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_FILES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

export function formatFileSize(bytes: number, t: TFunction): string {
  if (bytes < 1024 * 1024) return t('chat.attachment.kb', { value: Math.max(1, Math.round(bytes / 1024)) });
  return t('chat.attachment.mb', { value: (bytes / (1024 * 1024)).toFixed(1).replace('.', ',') });
}

/** подпись сообщения без текста: в списке чатов, в цитате и для экранного диктора */
export function attachmentSummary(message: Pick<ChatMessage, 'text' | 'attachments'>, t: TFunction): string {
  if (message.text) return message.text;
  const images = message.attachments.filter((item) => item.kind === 'image');
  const file = message.attachments.find((item) => item.kind === 'file');
  if (file && images.length === 0) return t('chat.attachment.filePreview', { name: file.name });
  if (images.length > 1) return t('chat.attachment.photosPreview', { count: images.length });
  if (images.length === 1) return t('chat.attachment.photoPreview');
  return t('chat.attachment.generic');
}

export type AttachmentDraft = {
  key: string;
  file: ChatUploadFile;
  status: 'uploading' | 'ready' | 'failed';
  /** код ошибки для `chat.errors.*` */
  error?: string;
  attachment?: ChatAttachment;
};

let draftSeq = 0;

/**
 * файлы, выбранные для следующего сообщения: каждый сразу загружается на сервер,
 * а в `send` уходят id готовых. пикеры подключаются лениво: в сборке приложения
 * без этих нативных модулей экран чата работает, просто без вложений
 */
export function useAttachmentDraft() {
  const [drafts, setDrafts] = useState<AttachmentDraft[]>([]);
  const [unavailable, setUnavailable] = useState(false);
  const count = useRef(0);
  count.current = drafts.length;

  const patch = (key: string, next: Partial<AttachmentDraft>) =>
    setDrafts((list) => list.map((draft) => (draft.key === key ? { ...draft, ...next } : draft)));

  const upload = useCallback((draft: AttachmentDraft) => {
    api.uploadChatAttachment(draft.file).then(
      (attachment) => patch(draft.key, { status: 'ready', attachment, error: undefined }),
      (error: unknown) =>
        patch(draft.key, { status: 'failed', error: isApiError(error) ? error.code : 'default' }),
    );
  }, []);

  const add = useCallback(
    (files: ChatUploadFile[]) => {
      const room = Math.max(0, MAX_ATTACHMENTS - count.current);
      const next = files.slice(0, room).map((file): AttachmentDraft => {
        const tooLarge = (file.sizeBytes ?? 0) > MAX_FILE_BYTES;
        draftSeq += 1;
        return {
          key: `draft-${draftSeq}`,
          file,
          status: tooLarge ? 'failed' : 'uploading',
          error: tooLarge ? 'FILE_TOO_LARGE' : undefined,
        };
      });
      setDrafts((list) => [...list, ...next]);
      for (const draft of next) if (draft.status === 'uploading') upload(draft);
    },
    [upload],
  );

  const pickPhotos = useCallback(async () => {
    try {
      const ImagePicker = await import('expo-image-picker');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: Math.max(1, MAX_ATTACHMENTS - count.current),
        // HEIC с iPhone — в JPEG: сервер принимает JPEG, PNG и WebP
        preferredAssetRepresentationMode:
          ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
        quality: 0.85,
      });
      if (result.canceled) return;
      add(
        result.assets.map((asset, index) => ({
          uri: asset.uri,
          name: asset.fileName ?? `photo-${index + 1}.jpg`,
          mimeType: asset.mimeType ?? 'image/jpeg',
          sizeBytes: asset.fileSize ?? null,
          file: asset.file,
        })),
      );
    } catch {
      setUnavailable(true);
    }
  }, [add]);

  const pickFiles = useCallback(async () => {
    try {
      const DocumentPicker = await import('expo-document-picker');
      const result = await DocumentPicker.getDocumentAsync({
        type: ACCEPTED_FILES,
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      add(
        result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType ?? 'application/pdf',
          sizeBytes: asset.size ?? null,
          file: asset.file,
        })),
      );
    } catch {
      setUnavailable(true);
    }
  }, [add]);

  const remove = useCallback((key: string) => {
    setDrafts((list) => list.filter((draft) => draft.key !== key));
  }, []);

  const retry = useCallback(
    (key: string) => {
      const draft = drafts.find((item) => item.key === key);
      if (!draft || draft.error === 'FILE_TOO_LARGE' || draft.error === 'FILE_TYPE_NOT_ALLOWED') return;
      patch(key, { status: 'uploading', error: undefined });
      upload(draft);
    },
    [drafts, upload],
  );

  const clear = useCallback(() => setDrafts([]), []);

  return {
    drafts,
    ready: drafts.flatMap((draft) => (draft.status === 'ready' && draft.attachment ? [draft.attachment] : [])),
    busy: drafts.some((draft) => draft.status === 'uploading'),
    unavailable,
    dismissUnavailable: () => setUnavailable(false),
    pickPhotos,
    pickFiles,
    remove,
    retry,
    clear,
  };
}

export type AttachmentDraftState = ReturnType<typeof useAttachmentDraft>;
