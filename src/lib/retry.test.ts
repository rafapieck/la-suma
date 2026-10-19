import { describe, expect, it, vi } from "vitest";
import { withTimeoutRetry } from "./retry";

const aborted = () => Object.assign(new Error("This operation was aborted"), { name: "AbortError" });

describe("withTimeoutRetry", () => {
  it("returns the first success without retrying", async () => {
    const task = vi.fn().mockResolvedValue("ok");
    await expect(withTimeoutRetry(task, { timeoutMs: 1000 })).resolves.toBe("ok");
    expect(task).toHaveBeenCalledTimes(1);
  });

  it("retries once after a timeout and returns the second result", async () => {
    const task = vi.fn().mockRejectedValueOnce(aborted()).mockResolvedValueOnce("ok");
    await expect(withTimeoutRetry(task, { timeoutMs: 1000 })).resolves.toBe("ok");
    expect(task).toHaveBeenCalledTimes(2);
  });

  it("gives up after two failures and throws the last error", async () => {
    const task = vi.fn().mockRejectedValueOnce(aborted()).mockRejectedValueOnce(new Error("503"));
    await expect(withTimeoutRetry(task, { timeoutMs: 1000 })).rejects.toThrow("503");
    expect(task).toHaveBeenCalledTimes(2);
  });

  it("gives each attempt its own timeout signal", async () => {
    const signals: AbortSignal[] = [];
    const task = vi.fn(async (signal: AbortSignal) => {
      signals.push(signal);
      if (signals.length === 1) throw aborted();
      return "ok";
    });
    await withTimeoutRetry(task, { timeoutMs: 1000 });
    expect(signals[0]).not.toBe(signals[1]);
    expect(signals[1].aborted).toBe(false);
  });

  it("actually times out a slow attempt", async () => {
    const slow = (signal: AbortSignal) =>
      new Promise((_, reject) => signal.addEventListener("abort", () => reject(signal.reason)));
    await expect(withTimeoutRetry(slow, { timeoutMs: 20 })).rejects.toBeDefined();
  });
});
