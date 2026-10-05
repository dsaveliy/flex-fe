import { MOCK_FAILURE_RATE, MOCK_LATENCY } from '../config';
import { ApiError } from '../client';

function randomLatency(): number {
  const { min, max } = MOCK_LATENCY;
  return min + Math.random() * (max - min);
}

export function delay(ms = randomLatency()): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** оборачивает fixture в имитацию задержки (и, при необходимости, имитацию сбоев) */
export async function respond<T>(data: T): Promise<T> {
  await delay();

  if (MOCK_FAILURE_RATE > 0 && Math.random() < MOCK_FAILURE_RATE) {
    throw new ApiError({
      status: 503,
      code: 'mock_failure',
      message: 'Simulated network failure',
    });
  }

  return data;
}
