import type { CryptoWidget, CryptoWidgetParams, WidgetKind, WidgetSize } from '@/api';

import { AssetRateWidget } from './AssetRateWidget';
import { ConvertWidget } from './ConvertWidget';
import { FearGreedWidget } from './FearGreedWidget';
import { MoversWidget } from './MoversWidget';
import { NewsWidget } from './NewsWidget';
import { PortfolioWidget } from './PortfolioWidget';
import type { WidgetDefinition } from './types';
import { WatchlistWidget } from './WatchlistWidget';

/**
 * пул виджетов, из которого пользователь собирает рабочий стол. новый виджет —
 * одна запись здесь плюс его `kind` в `WidgetKind` (и в валидации на бэкенде).
 * порядок записей — порядок в галерее
 */
export const WIDGET_REGISTRY: Record<WidgetKind, WidgetDefinition> = {
  assetRate: {
    kind: 'assetRate',
    icon: 'bitcoin',
    sizes: ['small', 'medium', 'large'],
    nameKey: 'crypto.widgets.assetRate.name',
    descriptionKey: 'crypto.widgets.assetRate.description',
    defaultParams: { assetId: 'btc' },
    options: ['asset'],
    section: 'rates',
    Component: AssetRateWidget,
  },
  portfolio: {
    kind: 'portfolio',
    icon: 'pie',
    sizes: ['medium', 'large'],
    nameKey: 'crypto.widgets.portfolio.name',
    descriptionKey: 'crypto.widgets.portfolio.description',
    section: 'portfolio',
    Component: PortfolioWidget,
  },
  movers: {
    kind: 'movers',
    icon: 'chart',
    sizes: ['medium', 'large'],
    nameKey: 'crypto.widgets.movers.name',
    descriptionKey: 'crypto.widgets.movers.description',
    defaultParams: { direction: 'gainers' },
    options: ['direction'],
    section: 'rates',
    Component: MoversWidget,
  },
  watchlist: {
    kind: 'watchlist',
    icon: 'star',
    sizes: ['large'],
    nameKey: 'crypto.widgets.watchlist.name',
    descriptionKey: 'crypto.widgets.watchlist.description',
    defaultParams: { assetIds: ['btc', 'eth', 'sol', 'usdt'] },
    section: 'rates',
    Component: WatchlistWidget,
  },
  news: {
    kind: 'news',
    icon: 'news',
    sizes: ['medium', 'large'],
    nameKey: 'crypto.widgets.news.name',
    descriptionKey: 'crypto.widgets.news.description',
    section: 'news',
    Component: NewsWidget,
  },
  convert: {
    kind: 'convert',
    icon: 'swap',
    sizes: ['small'],
    nameKey: 'crypto.widgets.convert.name',
    descriptionKey: 'crypto.widgets.convert.description',
    defaultParams: { from: 'btc', to: 'usdt' },
    options: ['pair'],
    section: 'convert',
    Component: ConvertWidget,
  },
  fearGreed: {
    kind: 'fearGreed',
    icon: 'gauge',
    sizes: ['small'],
    nameKey: 'crypto.widgets.fearGreed.name',
    descriptionKey: 'crypto.widgets.fearGreed.description',
    section: 'rates',
    Component: FearGreedWidget,
  },
};

export const WIDGET_KINDS = Object.keys(WIDGET_REGISTRY) as WidgetKind[];

/** новый экземпляр виджета с уникальным id */
export function createWidget(
  kind: WidgetKind,
  size: WidgetSize,
  params?: CryptoWidgetParams,
): CryptoWidget {
  const definition = WIDGET_REGISTRY[kind];
  return {
    id: `w-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    kind,
    size: definition.sizes.includes(size) ? size : (definition.sizes[0] ?? 'small'),
    params: params ?? definition.defaultParams,
  };
}
