import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { openDirectChat } from '@/api';
import { OperationSheet } from '@/features/operations/OperationSheet';
import { operationErrorMessage } from '@/features/operations/operationErrors';
import { TextField } from '@/ui';

/** «Новый чат»: клиент Flex по номеру телефона, как при переводе; уже переписывались — та же комната */
export function NewChatSheet() {
  const { t } = useTranslation();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!phone.trim()) return setError(t('operations.errors.phoneRequired'));
    setError(null);
    setPending(true);
    openDirectChat({ phone }).then(
      (room) => {
        // шторка закрывается, а чат открывается поверх списка
        router.dismiss();
        router.push({ pathname: '/messages/[roomId]', params: { roomId: room.id } });
      },
      (failure: unknown) => {
        setPending(false);
        setError(operationErrorMessage(failure, t));
      },
    );
  };

  return (
    <OperationSheet
      title={t('chat.newChat.title')}
      subtitle={t('chat.newChat.subtitle')}
      submitLabel={t('chat.newChat.submit')}
      onSubmit={submit}
      pending={pending}
      error={error}
    >
      <TextField
        label={t('chat.newChat.phone')}
        placeholder={t('operations.transfer.phonePlaceholder')}
        value={phone}
        onChangeText={setPhone}
        icon="user"
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        autoFocus
        returnKeyType="done"
        onSubmitEditing={submit}
      />
    </OperationSheet>
  );
}
