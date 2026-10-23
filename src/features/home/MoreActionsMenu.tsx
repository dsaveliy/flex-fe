import { useState } from 'react';
import type { SFSymbol } from 'sf-symbols-typescript';

import { ActionCircle, MenuSheet } from '@/ui';

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
 * web/Android: круг «Ещё» открывает шторку со списком действий.
 * на iOS — `MoreActionsMenu.ios.tsx` с нативным стеклянным меню.
 */
export function MoreActionsMenu({ label, cancelLabel, actions }: MoreActionsMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ActionCircle icon="more" label={label} onPress={() => setOpen(true)} />
      <MenuSheet
        visible={open}
        onClose={() => setOpen(false)}
        title={label}
        cancelLabel={cancelLabel}
        items={actions}
      />
    </>
  );
}
