import * as Haptics from 'expo-haptics';
import { useIsFocused } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { type SharedValue, useSharedValue } from 'react-native-reanimated';

import type { CryptoWidget } from '@/api';
import { useTheme } from '@/theme';
import { useAccessibilityFlags } from '@/ui';

import { cellSize, gridRows, moveItem, packGrid } from './gridLayout';
import type { CryptoSection } from './cryptoSections';
import { WIDGET_REGISTRY } from './widgets/registry';
import { type TileRect, WidgetTile } from './WidgetTile';

export type WidgetGridProps = {
  widgets: CryptoWidget[];
  editing: boolean;
  /** новая раскладка после перетаскивания или удаления — её нужно сохранить */
  onChange: (widgets: CryptoWidget[]) => void;
  onEnterEdit: () => void;
  /** пока виджет под пальцем, прокрутка экрана выключена; ставится прямо из жеста */
  scrollLock: SharedValue<boolean>;
  /** тап по виджету открывает связанный раздел */
  onOpenSection: (section: CryptoSection) => void;
};

/**
 * рабочий стол из 2 колонок: квадратные ячейки, виджеты укладываются по
 * порядку (`packGrid`), при перетаскивании соседи раздвигаются на лету
 */
export function WidgetGrid({
  widgets,
  editing,
  onChange,
  onEnterEdit,
  scrollLock,
  onOpenSection,
}: WidgetGridProps) {
  const theme = useTheme();
  const { reduceMotion } = useAccessibilityFlags();
  const focused = useIsFocused();
  const [width, setWidth] = useState(0);

  // локальный порядок меняется под пальцем, а наружу уходит, когда виджет отпустили
  const [items, setItems] = useState(widgets);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const dragging = useRef(false);

  useEffect(() => {
    if (!dragging.current) setItems(widgets);
  }, [widgets]);

  const gap = theme.spacing.lg;
  const cell = cellSize(width, gap);

  const packed = useMemo(() => packGrid(items), [items]);
  const rects = useMemo<TileRect[]>(
    () =>
      packed.map((slot) => ({
        id: slot.id,
        x: slot.col * (cell + gap),
        y: slot.row * (cell + gap),
        w: slot.w * cell + (slot.w - 1) * gap,
        h: slot.h * cell + (slot.h - 1) * gap,
      })),
    [cell, gap, packed],
  );
  const rows = gridRows(packed);

  const slots = useSharedValue<TileRect[]>([]);
  useEffect(() => {
    slots.value = rects;
  }, [rects, slots]);

  const handleDragStart = () => {
    dragging.current = true;
  };

  const handleHover = (draggedId: string, targetId: string) => {
    const current = itemsRef.current;
    const from = current.findIndex((item) => item.id === draggedId);
    const to = current.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0 || from === to) return;
    void Haptics.selectionAsync();
    setItems(moveItem(current, from, to));
  };

  const handleDragEnd = () => {
    dragging.current = false;
    const next = itemsRef.current;
    if (next.some((item, index) => item.id !== widgets[index]?.id)) onChange(next);
  };

  const handleRemove = (id: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(itemsRef.current.filter((item) => item.id !== id));
  };

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{ height: rows > 0 ? rows * cell + (rows - 1) * gap : 0 }}
    >
      {width > 0
        ? items.map((widget, index) => {
            const rect = rects[index];
            if (!rect) return null;
            return (
              <WidgetTile
                key={widget.id}
                widget={widget}
                rect={rect}
                editing={editing}
                jiggle={focused && !reduceMotion}
                slots={slots}
                scrollLock={scrollLock}
                onEnterEdit={onEnterEdit}
                onDragStart={handleDragStart}
                onHover={handleHover}
                onDragEnd={handleDragEnd}
                onRemove={handleRemove}
                onOpen={
                  WIDGET_REGISTRY[widget.kind].section
                    ? () => onOpenSection(WIDGET_REGISTRY[widget.kind].section ?? 'desktop')
                    : undefined
                }
              />
            );
          })
        : null}
    </View>
  );
}
