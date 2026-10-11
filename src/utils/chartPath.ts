/** геометрия линейных графиков: общая для графика баланса и графиков Crypto */

export type ChartPoint = { x: number; y: number };

/** переводит ряд значений в точки, растянутые на всю ширину; `padY` — поля сверху и снизу */
export function toPoints(data: number[], width: number, height: number, padY = 12): ChartPoint[] {
  if (data.length < 2 || width <= 0) return [];
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  return data.map((value, index) => ({
    x: index * step,
    y: padY + (1 - (value - min) / range) * (height - padY * 2),
  }));
}

/** сглаженная кривая: catmull-rom, переведённый в кубические безье */
export function smoothPath(points: ChartPoint[]): string {
  if (points.length < 2) return '';
  let d = `M${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

/** длина ломаной — достаточно точная оценка для анимации прорисовки */
export function polylineLength(points: ChartPoint[]): number {
  let length = 0;
  for (let i = 1; i < points.length; i += 1) {
    length += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return length * 1.05;
}
