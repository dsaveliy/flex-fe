/**
 * Deterministic pseudo-random sparkline generator, so mock charts do not
 * flicker between renders.
 */
function seededRandom(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

export function makeSeries(options: {
  seed: number;
  points?: number;
  start?: number;
  drift?: number;
  volatility?: number;
}): number[] {
  const { seed, points = 24, start = 100, drift = 0, volatility = 2 } = options;
  const random = seededRandom(seed);
  const series: number[] = [];
  let value = start;

  for (let index = 0; index < points; index += 1) {
    const noise = (random() - 0.5) * volatility;
    value = value + noise + drift;
    series.push(Number(value.toFixed(2)));
  }

  return series;
}
