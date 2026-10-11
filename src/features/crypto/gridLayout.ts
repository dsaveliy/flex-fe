import type { CryptoWidget, WidgetSize } from '@/api';

/** колонок на рабочем столе, как у виджетов iPhone */
export const GRID_COLUMNS = 2;

/** размер виджета в ячейках сетки */
export const WIDGET_SPAN: Record<WidgetSize, { w: number; h: number }> = {
  small: { w: 1, h: 1 },
  medium: { w: 2, h: 1 },
  large: { w: 2, h: 2 },
};

export type GridSlot = { id: string; col: number; row: number; w: number; h: number };

/**
 * укладывает виджеты по порядку в первую свободную позицию (first-fit), как
 * делает iOS: маленький виджет после широкого заполняет дыру слева, а не
 * начинает новый ряд за ним
 */
export function packGrid(widgets: CryptoWidget[], columns = GRID_COLUMNS): GridSlot[] {
  const taken: boolean[][] = [];
  const isFree = (row: number, col: number) => !taken[row]?.[col];

  return widgets.map((widget) => {
    const { w, h } = WIDGET_SPAN[widget.size];
    for (let row = 0; ; row++) {
      for (let col = 0; col + w <= columns; col++) {
        let fits = true;
        for (let dy = 0; dy < h && fits; dy++) {
          for (let dx = 0; dx < w && fits; dx++) fits = isFree(row + dy, col + dx);
        }
        if (!fits) continue;
        for (let dy = 0; dy < h; dy++) {
          taken[row + dy] ??= [];
          for (let dx = 0; dx < w; dx++) taken[row + dy]![col + dx] = true;
        }
        return { id: widget.id, col, row, w, h };
      }
    }
  });
}

/** сторона квадратной ячейки при ширине сетки `width` и зазоре `gap` */
export function cellSize(width: number, gap: number, columns = GRID_COLUMNS): number {
  return width > 0 ? (width - gap * (columns - 1)) / columns : 0;
}

/** размер виджета в точках */
export function widgetPixelSize(size: WidgetSize, cell: number, gap: number) {
  const { w, h } = WIDGET_SPAN[size];
  return { width: w * cell + (w - 1) * gap, height: h * cell + (h - 1) * gap };
}

/** число занятых рядов — по нему считается высота сетки */
export function gridRows(slots: GridSlot[]): number {
  return slots.reduce((max, slot) => Math.max(max, slot.row + slot.h), 0);
}

/** переставляет элемент `from` на место `to`, остальные сдвигаются */
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  const next = items.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as T);
  return next;
}
