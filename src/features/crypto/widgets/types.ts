import type { ComponentType } from 'react';

import type { CryptoWidget, CryptoWidgetParams, WidgetKind, WidgetSize } from '@/api';
import type { IconName } from '@/ui';

import type { CryptoSection } from '../cryptoSections';

export type WidgetRenderProps = {
  widget: CryptoWidget;
  /** размер, под который виджет выбирает вёрстку */
  size: WidgetSize;
  /** размер плитки в точках, уже посчитанный сеткой */
  width: number;
  height: number;
};

/** что можно настроить у виджета в галерее */
export type WidgetOption = 'asset' | 'direction' | 'pair';

/** описание виджета из пула: всё, что нужно сетке и галерее */
export type WidgetDefinition = {
  kind: WidgetKind;
  icon: IconName;
  /** размеры, в которых виджет умеет рисоваться; первый — по умолчанию */
  sizes: WidgetSize[];
  nameKey: string;
  descriptionKey: string;
  defaultParams?: CryptoWidgetParams;
  /** настройки, которые галерея предлагает перед добавлением */
  options?: WidgetOption[];
  /** раздел, который открывается по тапу на виджет */
  section?: CryptoSection;
  Component: ComponentType<WidgetRenderProps>;
};
