/**
 * Single switch between mock data and the real backend.
 * The FastAPI service is not ready yet, so mocks are the default.
 */
export const USE_MOCK_API = true;

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

/** Simulated network latency range for mocks (ms). */
export const MOCK_LATENCY = { min: 300, max: 700 } as const;

/** Set to a 0..1 value to exercise error states while developing. */
export const MOCK_FAILURE_RATE = 0;
