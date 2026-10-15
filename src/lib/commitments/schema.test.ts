import { describe, expect, it } from "vitest";
import { commitmentInputSchema, readCommitmentForm } from "./schema";

const valid = {
  lender: "Coppel",
  label: "Refrigerador",
  amount: "450.50",
  frequency: "quincenal",
  next_due_date: "2026-11-01",
  payments_left: "12",
};

function errorsFor(input: Record<string, unknown>) {
  const result = commitmentInputSchema.safeParse(input);
  return result.success ? {} : result.error.flatten().fieldErrors;
}

describe("commitmentInputSchema", () => {
  it("accepts a complete commitment", () => {
    const result = commitmentInputSchema.parse(valid);
    expect(result).toEqual({
      lender: "Coppel",
      label: "Refrigerador",
      amount: 450.5,
      frequency: "quincenal",
      next_due_date: "2026-11-01",
      payments_left: 12,
    });
  });

  it("saves 'No sé' as null for date and payments left", () => {
    const result = commitmentInputSchema.parse({ ...valid, next_due_date: null, payments_left: null });
    expect(result.next_due_date).toBeNull();
    expect(result.payments_left).toBeNull();
  });

  it("treats an empty label as null", () => {
    expect(commitmentInputSchema.parse({ ...valid, label: "" }).label).toBeNull();
  });

  it("rejects a negative amount with a clear message", () => {
    expect(errorsFor({ ...valid, amount: "-100" }).amount).toEqual(["El monto debe ser mayor que 0."]);
  });

  it("rejects zero, empty and non-numeric amounts", () => {
    expect(errorsFor({ ...valid, amount: "0" }).amount).toBeDefined();
    expect(errorsFor({ ...valid, amount: "" }).amount).toBeDefined();
    expect(errorsFor({ ...valid, amount: "abc" }).amount).toBeDefined();
  });

  it("rejects an empty or blank lender", () => {
    expect(errorsFor({ ...valid, lender: "" }).lender).toEqual(["Escribe con quién es el pago."]);
    expect(errorsFor({ ...valid, lender: "   " }).lender).toEqual(["Escribe con quién es el pago."]);
  });

  it("rejects a 500-character label", () => {
    expect(errorsFor({ ...valid, label: "a".repeat(500) }).label).toEqual([
      "La descripción puede tener hasta 80 letras.",
    ]);
  });

  it("asks for a date or 'No sé' when the date is empty", () => {
    expect(errorsFor({ ...valid, next_due_date: "" }).next_due_date).toBeDefined();
  });

  it("rejects an unknown frequency", () => {
    expect(errorsFor({ ...valid, frequency: "diario" }).frequency).toEqual(["Elige cada cuánto pagas."]);
  });

  it("drops unknown fields instead of failing", () => {
    const result = commitmentInputSchema.parse({ ...valid, user_id: "someone-else", source: "photo" });
    expect(result).not.toHaveProperty("user_id");
    expect(result).not.toHaveProperty("source");
  });
});

describe("readCommitmentForm", () => {
  it("turns the 'No sé' checkboxes into null", () => {
    const form = new FormData();
    Object.entries(valid).forEach(([k, v]) => form.set(k, v));
    form.set("next_due_date_unknown", "on");
    form.set("payments_left_unknown", "on");
    const result = commitmentInputSchema.parse(readCommitmentForm(form));
    expect(result.next_due_date).toBeNull();
    expect(result.payments_left).toBeNull();
  });

  it("reads missing fields as empty text, which fails validation", () => {
    const result = commitmentInputSchema.safeParse(readCommitmentForm(new FormData()));
    expect(result.success).toBe(false);
  });
});
