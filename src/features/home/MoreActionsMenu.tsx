import { Alert } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import { ActionCircle } from '@/ui';

export type MoreAction = {
  id: string;
  label: string;
  /** иконка системного меню на iOS */
  systemImage: SFSymbol;
  onPress: () => void;
};

export type MoreActionsMenuProps = {
  label: string;
  cancelLabel: string;
  actions: MoreAction[];
};

/**
 * web/Android: круг «Ещё» открывает системный диалог со списком действий.
 * на iOS — `MoreActionsMenu.ios.tsx` с нативным стеклянным меню.
 */
export function MoreActionsMenu({ label, cancelLabel, actions }: MoreActionsMenuProps) {
  return (
    <ActionCircle
      icon="more"
      label={label}
      onPress={() =>
        Alert.alert(label, undefined, [
          ...actions.map((action) => ({ text: action.label, onPress: action.onPress })),
          { text: cancelLabel, style: 'cancel' as const },
        ])
      }
    />
  );
}
