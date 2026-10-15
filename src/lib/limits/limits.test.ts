import { describe, expect, it } from "vitest";
import {
  formatDateEs,
  isPauseActive,
  limitsInputSchema,
  pauseEndDate,
  pauseEndTimestamp,
  pauseMessage,
  readLimitsForm,
} from "./limits";

describe("limitsInputSchema", () => {
  it("an empty form means no limit and no pause (no defaults)", () => {
    const parsed = limitsInputSchema.parse(readLimitsForm(new FormData()));
    expect(parsed).toEqual({ ceiling_per_quincena: null, pause_until_date: null, note_to_self: null });
  });

  it("accepts a ceiling, a pause date and a note", () => {
    expect(
      limitsInputSchema.parse({ ceiling_per_quincena: "2000", pause_until_date: "2026-10-22", note_to_self: " Esperar al aguinaldo " }),
    ).toEqual({ ceiling_per_quincena: 2000, pause_until_date: "2026-10-22", note_to_self: "Esperar al aguinaldo" });
  });

  it("rejects a zero or negative ceiling", () => {
    expect(limitsInputSchema.safeParse({ ceiling_per_quincena: "0" }).success).toBe(false);
    expect(limitsInputSchema.safeParse({ ceiling_per_quincena: "-5" }).success).toBe(false);
  });

  it("rejects a note over 200 characters", () => {
    const r = limitsInputSchema.safeParse({ note_to_self: "a".repeat(201) });
    expect(r.success).toBe(false);
    expect(limitsInputSchema.safeParse({ note_to_self: "a".repeat(200) }).success).toBe(true);
  });
});

describe("pause", () => {
  const limits = { ceiling_per_quincena: null, pause_until: pauseEndTimestamp("2026-10-22"), note_to_self: "Esperar al aguinaldo" };

  it("lasts through the end of the chosen day in Mexico City", () => {
    expect(isPauseActive(limits, new Date("2026-10-22T23:00:00-06:00"))).toBe(true);
    expect(isPauseActive(limits, new Date("2026-10-23T00:00:01-06:00"))).toBe(false);
    expect(pauseEndDate(limits.pause_until)).toBe("2026-10-22");
  });

  it("is inactive with no row or no date", () => {
    expect(isPauseActive(null)).toBe(false);
    expect(isPauseActive({ ...limits, pause_until: null })).toBe(false);
  });

  it("shows her own note back to her", () => {
    expect(pauseMessage(limits)).toBe("Te pediste una pausa hasta 22 de octubre de 2026: “Esperar al aguinaldo”");
    expect(pauseMessage({ ...limits, note_to_self: null })).toBe("Te pediste una pausa hasta 22 de octubre de 2026.");
  });

  it("formats dates in Spanish", () => {
    expect(formatDateEs("2026-01-05")).toBe("5 de enero de 2026");
  });
});
