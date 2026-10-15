import { describe, expect, it } from "vitest";
import { buildCalendar, todayInMexico, type CalendarCommitment } from "./build-calendar";

function commitment(overrides: Partial<CalendarCommitment>): CalendarCommitment {
  return {
    id: "c1",
    lender: "Coppel",
    label: null,
    amount: 300,
    frequency: "semanal",
    next_due_date: "2026-11-03",
    payments_left: 50,
    ...overrides,
  };
}

const totals = (c: ReturnType<typeof buildCalendar>) => c.quincenas.map((q) => q.total);
const labels = (c: ReturnType<typeof buildCalendar>) => c.quincenas.map((q) => q.label);

describe("buildCalendar windows", () => {
  it("starts at today's quincena and covers 6 quincenas", () => {
    const cal = buildCalendar([], "2026-11-20");
    expect(labels(cal)).toEqual(["16–30 nov", "1–15 dic", "16–31 dic", "1–15 ene", "16–31 ene", "1–15 feb"]);
    expect(cal.quincenas[3].start).toBe("2027-01-01");
    expect(totals(cal)).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it("handles February's second quincena", () => {
    expect(buildCalendar([], "2027-02-16").quincenas[0]).toMatchObject({ start: "2027-02-16", end: "2027-02-28" });
  });
});

describe("weekly payments", () => {
  it("lands a $300 weekly payment from Nov 3 in the right quincenas", () => {
    const cal = buildCalendar([commitment({})], "2026-11-01");
    // Nov 3, 10 | 17, 24 | Dec 1, 8, 15 | 22, 29 | Jan 5, 12 | 19, 26
    expect(cal.quincenas[0].payments.map((p) => p.date)).toEqual(["2026-11-03", "2026-11-10"]);
    expect(cal.quincenas[2].payments.map((p) => p.date)).toEqual(["2026-12-01", "2026-12-08", "2026-12-15"]);
    expect(totals(cal)).toEqual([600, 600, 900, 600, 600, 600]);
    expect(cal.incomplete).toEqual([]);
  });
});

describe("monthly payments", () => {
  it("puts a day-31 monthly payment on Nov 30, in Q2 of a 30-day month", () => {
    const cal = buildCalendar([commitment({ frequency: "mensual", amount: 1000, next_due_date: "2026-10-31" })], "2026-11-01");
    expect(cal.quincenas[1]).toMatchObject({ label: "16–30 nov", total: 1000 });
    expect(cal.quincenas[1].payments[0].date).toBe("2026-11-30");
    // Back to day 31 in December, not stuck on 30.
    expect(cal.quincenas[3].payments[0].date).toBe("2026-12-31");
    expect(totals(cal)).toEqual([0, 1000, 0, 1000, 0, 1000]);
  });
});

describe("quincenal payments", () => {
  it("pays once per quincena on the same position", () => {
    const cal = buildCalendar([commitment({ frequency: "quincenal", amount: 400, next_due_date: "2026-11-05" })], "2026-11-01");
    expect(cal.quincenas.map((q) => q.payments.map((p) => p.date))).toEqual([
      ["2026-11-05"], ["2026-11-20"], ["2026-12-05"], ["2026-12-20"], ["2027-01-05"], ["2027-01-20"],
    ]);
  });

  it("keeps a month-end payment on the last day of each month", () => {
    const cal = buildCalendar([commitment({ frequency: "quincenal", next_due_date: "2026-11-30" })], "2026-11-16");
    expect(cal.quincenas.flatMap((q) => q.payments.map((p) => p.date))).toEqual([
      "2026-11-30", "2026-12-15", "2026-12-31", "2027-01-15", "2027-01-31", "2027-02-15",
    ]);
  });
});

describe("payments_left", () => {
  it("stops when payments run out mid-window", () => {
    const cal = buildCalendar([commitment({ payments_left: 3 })], "2026-11-01");
    expect(totals(cal)).toEqual([600, 300, 0, 0, 0, 0]);
  });

  it("counts payments due before the window against payments_left", () => {
    // Due Oct 20 and 27 already passed; 3 left means only Nov 3 remains.
    const cal = buildCalendar([commitment({ next_due_date: "2026-10-20", payments_left: 3 })], "2026-11-01");
    expect(totals(cal)).toEqual([300, 0, 0, 0, 0, 0]);
  });
});

describe("incomplete commitments", () => {
  it("a null date adds nothing and marks every quincena as missing info", () => {
    const missing = commitment({ id: "x", next_due_date: null });
    const cal = buildCalendar([missing, commitment({ payments_left: 1 })], "2026-11-01");
    expect(totals(cal)).toEqual([300, 0, 0, 0, 0, 0]);
    expect(cal.quincenas.map((q) => q.missingInfoCount)).toEqual([1, 1, 1, 1, 1, 1]);
    expect(cal.incomplete).toEqual([{ commitment: missing, missing: ["fecha"] }]);
  });

  it("null payments_left continues through the window and is flagged where it lands", () => {
    const c = commitment({ frequency: "mensual", next_due_date: "2026-11-20", payments_left: null });
    const cal = buildCalendar([c], "2026-11-01");
    expect(totals(cal)).toEqual([0, 300, 0, 300, 0, 300]);
    expect(cal.quincenas.map((q) => q.missingInfoCount)).toEqual([0, 1, 0, 1, 0, 1]);
    expect(cal.incomplete).toEqual([{ commitment: c, missing: ["pagos restantes"] }]);
  });
});

describe("totals", () => {
  it("adds cents without floating-point drift", () => {
    const cal = buildCalendar(
      [commitment({ id: "a", amount: 0.1, payments_left: 1 }), commitment({ id: "b", amount: 0.2, payments_left: 1 })],
      "2026-11-01",
    );
    expect(cal.quincenas[0].total).toBe(0.3);
  });
});

describe("todayInMexico", () => {
  it("uses Mexico City time, not UTC", () => {
    // 03:00 UTC on Nov 16 is still Nov 15 in Mexico City (UTC-6).
    expect(todayInMexico(new Date("2026-11-16T03:00:00Z"))).toBe("2026-11-15");
  });
});
