/**
 * Runs `task` with a fresh timeout signal; if it fails (timeout, network or API error),
 * tries once more. Throws the last error if every attempt fails.
 */
export async function withTimeoutRetry<T>(
  task: (signal: AbortSignal) => Promise<T>,
  { attempts = 2, timeoutMs }: { attempts?: number; timeoutMs: number },
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await task(AbortSignal.timeout(timeoutMs));
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}
