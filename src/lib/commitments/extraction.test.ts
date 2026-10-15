import { describe, expect, it } from "vitest";
import { commitmentInputSchema } from "./schema";
import { SIMULATED_EXTRACTION, sanitizeExtraction } from "./extraction";

const allNull = {
  lender: null, label: null, amount: null, frequency: null, next_due_date: null, payments_left: null,
};

describe("sanitizeExtraction", () => {
  it("keeps valid fields", () => {
    const fields = {
      lender: "Mueblería Fantasía", label: "Lavadora", amount: 350, frequency: "semanal",
      next_due_date: "2026-10-22", payments_left: 18,
    };
    expect(sanitizeExtraction(fields)).toEqual(fields);
  });

  it("turns an unreadable (all-null) reading into nulls", () => {
    expect(sanitizeExtraction(allNull)).toEqual(allNull);
  });

  it("turns garbage, wrong types and bad values into null field by field", () => {
    expect(
      sanitizeExtraction({
        lender: "x".repeat(200), label: "", amount: -5, frequency: "diario",
        next_due_date: "22/10/2026", payments_left: 2.5,
      }),
    ).toEqual(allNull);
    expect(sanitizeExtraction({ amount: "350" }).amount).toBeNull();
  });

  it("handles non-object responses", () => {
    expect(sanitizeExtraction(null)).toEqual(allNull);
    expect(sanitizeExtraction("hola")).toEqual(allNull);
    expect(sanitizeExtraction([1, 2])).toEqual(allNull);
  });

  it("drops unexpected fields", () => {
    expect(sanitizeExtraction({ ...allNull, user_id: "x", source: "manual" })).toEqual(allNull);
  });

  it("rounds amounts to cents", () => {
    expect(sanitizeExtraction({ amount: 350.456 }).amount).toBe(350.46);
  });

  it("simulated sample is labeled as invented and saves once confirmed", () => {
    expect(SIMULATED_EXTRACTION.lender).toContain("Datos inventados");
    const parsed = commitmentInputSchema.safeParse({
      ...SIMULATED_EXTRACTION,
      amount: String(SIMULATED_EXTRACTION.amount),
    });
    expect(parsed.success).toBe(true);
  });
});
