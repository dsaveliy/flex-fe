import { seededRandom } from './frost';

export type Point = { x: number; y: number };

/**
 * один анимируемый штрих узора. может состоять из нескольких подпутей:
 * штрих (dash) начинается заново в каждом подпути, поэтому все лучи или
 * веточки одной снежинки прорастают одновременно — узлов анимации немного.
 */
export type FrostStroke = {
  d: string;
  /** длина самого длинного подпути — под неё настраивается штрих */
  length: number;
  /** начало и длительность прорисовки в долях общего прогресса 0..1 */
  start: number;
  span: number;
  width: number;
  opacity: number;
};

export type FrostPattern = {
  strokes: FrostStroke[];
  /** кончики лучей — места для искорок */
  tips: Point[];
};

const fmt = (n: number) => n.toFixed(1);

function polyline(points: Point[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${fmt(p.x)} ${fmt(p.y)}`).join(' ');
}

function segment(from: Point, to: Point): string {
  return `M${fmt(from.x)} ${fmt(from.y)} L${fmt(to.x)} ${fmt(to.y)}`;
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function step(from: Point, angle: number, length: number): Point {
  return { x: from.x + Math.cos(angle) * length, y: from.y + Math.sin(angle) * length };
}

/** длительность роста лучей одной снежинки в долях прогресса */
const ARM_SPAN = 0.32;
/** сколько снежинок пытаемся разместить на карте */
const FLAKES = 14;

/**
 * морозный узор из снежинок, который сходится со всех сторон: снежинки у
 * краёв (часть уходит за край) зарождаются первыми, ближе к центру — позже,
 * поэтому лёд «наползает» от краёв к середине. у каждой снежинки сначала
 * шестиугольник в центре, потом шесть лучей, потом веточки под 60°.
 * узор детерминирован по seed (id карты): у каждой карты свой, но постоянный.
 */
export function buildFrostPattern(seed: string, width: number, height: number): FrostPattern {
  const rand = seededRandom(`flakes-${seed}`);
  const strokes: FrostStroke[] = [];
  const tips: Point[] = [];
  const base = Math.min(width, height);

  const flakes: (Point & { r: number })[] = [];
  for (let attempt = 0; attempt < 600 && flakes.length < FLAKES; attempt++) {
    const r = base * (0.11 + rand() * 0.13);
    const candidate = {
      x: -r * 0.25 + rand() * (width + r * 0.5),
      y: -r * 0.25 + rand() * (height + r * 0.5),
      r,
    };
    if (flakes.every((other) => distance(other, candidate) > (other.r + r) * 0.8)) {
      flakes.push(candidate);
    }
  }

  // насколько снежинка далека от ближайшего края: 0 — на краю, 1 — в центре
  const depth = (p: Point) =>
    Math.max(0, Math.min(p.x, width - p.x, p.y, height - p.y)) / (base / 2);

  for (const flake of flakes) {
    const born = depth(flake) * 0.55 + rand() * 0.06;
    const rotation = rand() * (Math.PI / 3);
    const direction = (arm: number) => rotation + arm * (Math.PI / 3);

    const plate = flake.r * 0.12;
    strokes.push({
      d: polyline(Array.from({ length: 7 }, (_, arm) => step(flake, direction(arm), plate))),
      length: plate * 6,
      start: born,
      span: ARM_SPAN * 0.4,
      width: 0.8,
      opacity: 0.8,
    });

    const arms: string[] = [];
    for (let arm = 0; arm < 6; arm++) {
      const tip = step(flake, direction(arm), flake.r);
      arms.push(segment(flake, tip));
      tips.push(tip);
    }
    strokes.push({
      d: arms.join(' '),
      length: flake.r,
      start: born + 0.03,
      span: ARM_SPAN,
      width: 1.1,
      opacity: 0.9,
    });

    // по три пары веточек на каждом луче, к концу луча короче
    [0.35, 0.58, 0.8].forEach((at, ring) => {
      const twig = flake.r * (0.3 - ring * 0.08) * (0.85 + rand() * 0.3);
      const parts: string[] = [];
      for (let arm = 0; arm < 6; arm++) {
        const from = step(flake, direction(arm), flake.r * at);
        for (const side of [-1, 1]) {
          parts.push(segment(from, step(from, direction(arm) + side * (Math.PI / 3), twig)));
        }
      }
      strokes.push({
        d: parts.join(' '),
        length: twig,
        start: born + 0.03 + at * ARM_SPAN,
        span: ARM_SPAN * 0.5,
        width: 0.7,
        opacity: 0.75,
      });
    });
  }

  // растягиваем расписание так, чтобы последняя веточка дорисовалась ровно к концу
  const end = Math.max(...strokes.map((stroke) => stroke.start + stroke.span));
  return {
    strokes: strokes.map((stroke) => ({
      ...stroke,
      start: stroke.start / end,
      span: stroke.span / end,
    })),
    tips,
  };
}
