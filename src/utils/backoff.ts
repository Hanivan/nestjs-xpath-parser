/** Exponential backoff in ms for a zero-based retry attempt, capped at 10s. */
export function backoffMs(attempt: number): number {
  return Math.min(1000 * Math.pow(2, attempt), 10000);
}
