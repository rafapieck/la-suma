import { describe, expect, it } from "vitest";
import type { CalendarCommitment } from "@/lib/calendar/build-calendar";
import { buildPreview, previewInputSchema, toAddFormQuery } from "./preview";

const existing: CalendarCommitment[] = [
  {
    id: "a", lender: "Coppel", label: null, amount: 300, frequency: "semanal",
    next_due_date: "2026-11-03", payments_left: 50,
  },
];

const hypo = previewInputSchema.parse({
  lender: "", label: "Celular", amount: "400", frequency: "quincenal",
  next_due_date: "2026-11-05", payments_left: "6",
});

describe("buildPreview", () => {
  it("adds a $400 quincenal installment to every 'after' quincena", () => {
    const { rows } = buildPreview(existing, hypo, "2026-11-01");
    expect(rows.map((r) => r.before)).toEqual([600, 600, 900, 600, 600, 600]);
    expect(rows.map((r) => r.after)).toEqual([1000, 1000, 1300, 1000, 1000, 1000]);
    expect(rows.every((r) => r.difference === 400)).toBe(true);
  });

  it("only changes quincenas where the new payments land", () => {
    const short = { ...hypo, payments_left: 2 };
    const { rows } = buildPreview(existing, short, "2026-11-01");
    expect(rows.map((r) => r.difference)).toEqual([400, 400, 0, 0, 0, 0]);
  });

  it("does not modify the commitments passed in", () => {
    const copy = structuredClone(existing);
    buildPreview(existing, hypo, "2026-11-01");
    expect(existing).toEqual(copy);
  });

  it("works with no existing commitments", () => {
    const { rows } = buildPreview([], hypo, "2026-11-01");
    expect(rows.map((r) => r.before)).toEqual([0, 0, 0, 0, 0, 0]);
    expect(rows[0].after).toBe(400);
  });
});

describe("limit in the preview", () => {
  it("reports how far 'after' goes past her own limit, only where it does", () => {
    // before: 600 600 900 600 600 600 → after: 1000 1000 1300 1000 1000 1000
    const { rows } = buildPreview(existing, hypo, "2026-11-01", 1100);
    expect(rows.map((r) => r.afterAboveLimit)).toEqual([null, null, 200, null, null, null]);
  });

  it("never labels anything when she set no limit", () => {
    const { rows } = buildPreview(existing, hypo, "2026-11-01");
    expect(rows.every((r) => r.afterAboveLimit === null)).toBe(true);
  });

  it("does not label a total exactly at the limit", () => {
    const { rows } = buildPreview(existing, hypo, "2026-11-01", 1000);
    expect(rows.map((r) => r.afterAboveLimit)).toEqual([null, null, 300, null, null, null]);
  });
});

describe("previewInputSchema", () => {
  it("defaults an empty store name", () => {
    expect(hypo.lender).toBe("Compra nueva");
  });

  it("requires a first payment date", () => {
    const r = previewInputSchema.safeParse({ ...hypo, amount: "400", next_due_date: null });
    expect(r.success).toBe(false);
  });

  it("rejects a negative amount", () => {
    const r = previewInputSchema.safeParse({ ...hypo, amount: "-400" });
    expect(r.success).toBe(false);
  });
});

describe("toAddFormQuery", () => {
  it("carries every field and marks unknown payments as 'nose'", () => {
    const q = new URLSearchParams(toAddFormQuery({ ...hypo, payments_left: null }));
    expect(Object.fromEntries(q)).toEqual({
      lender: "Compra nueva", label: "Celular", amount: "400", frequency: "quincenal",
      next_due_date: "2026-11-05", payments_left: "nose",
    });
  });
});
