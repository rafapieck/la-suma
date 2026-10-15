// Pure calendar logic: no I/O, no clock. Dates are "YYYY-MM-DD" strings handled in UTC
// so the result never depends on the server's time zone.

export type Frequency = "semanal" | "quincenal" | "mensual";

export type CalendarCommitment = {
  id: string;
  lender: string;
  label: string | null;
  amount: number;
  frequency: Frequency;
  next_due_date: string | null;
  payments_left: number | null;
};

export type CalendarPayment = {
  commitmentId: string;
  date: string;
  amount: number;
};

export type Quincena = {
  start: string;
  end: string;
  label: string; // e.g. "1–15 nov"
  total: number;
  payments: CalendarPayment[];
  /** Commitments whose missing data could change this quincena's total. */
  missingInfoCount: number;
};

export type IncompleteCommitment = {
  commitment: CalendarCommitment;
  missing: ("fecha" | "pagos restantes")[];
};

export type Calendar = {
  quincenas: Quincena[];
  incomplete: IncompleteCommitment[];
};

export const QUINCENAS = 6;
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

type Ymd = { y: number; m: number; d: number }; // m is 0-11

function parse(date: string): Ymd {
  const [y, m, d] = date.split("-").map(Number);
  return { y, m: m - 1, d };
}

function format({ y, m, d }: Ymd): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
}

/** Same month offset, day clamped to that month's last day (31 → 30 in November). */
function addMonths(y: number, m: number, months: number, day: number): Ymd {
  const total = y * 12 + m + months;
  const ny = Math.floor(total / 12);
  const nm = total - ny * 12;
  return { y: ny, m: nm, d: Math.min(day, daysInMonth(ny, nm)) };
}

function addDays(date: string, days: number): string {
  const { y, m, d } = parse(date);
  const t = new Date(Date.UTC(y, m, d + days));
  return format({ y: t.getUTCFullYear(), m: t.getUTCMonth(), d: t.getUTCDate() });
}

/** The quincena containing `date`, then the following ones. */
function quincenaWindows(today: string, count: number) {
  const { y, m, d } = parse(today);
  let cursor = { y, m, half: d <= 15 ? 0 : 1 };
  const windows: { start: string; end: string; label: string }[] = [];
  for (let i = 0; i < count; i++) {
    const last = daysInMonth(cursor.y, cursor.m);
    const [from, to] = cursor.half === 0 ? [1, 15] : [16, last];
    windows.push({
      start: format({ y: cursor.y, m: cursor.m, d: from }),
      end: format({ y: cursor.y, m: cursor.m, d: to }),
      label: `${from}–${to} ${MONTHS[cursor.m]}`,
    });
    cursor =
      cursor.half === 0
        ? { ...cursor, half: 1 }
        : cursor.m === 11
          ? { y: cursor.y + 1, m: 0, half: 0 }
          : { y: cursor.y, m: cursor.m + 1, half: 0 };
  }
  return windows;
}

/**
 * Payment dates from `first`, in order, until `until` (inclusive).
 * - semanal: every 7 days.
 * - quincenal: once per quincena on the same "position" (day 5 → 5 and 20;
 *   day 15 → 15 and month end when the first is the last day of the month).
 * - mensual: same day each month, clamped to shorter months.
 */
function paymentDates(first: string, frequency: Frequency, until: string): string[] {
  const dates: string[] = [];
  if (frequency === "semanal") {
    for (let date = first; date <= until; date = addDays(date, 7)) dates.push(date);
    return dates;
  }

  const start = parse(first);
  if (frequency === "mensual") {
    for (let i = 0; ; i++) {
      const date = format(addMonths(start.y, start.m, i, start.d));
      if (date > until) return dates;
      dates.push(date);
    }
  }

  // quincenal
  const monthEnd = start.d === daysInMonth(start.y, start.m);
  const q1Day = monthEnd ? 15 : Math.min(start.d <= 15 ? start.d : start.d - 15, 15);
  const q2Day = (y: number, m: number) =>
    monthEnd ? daysInMonth(y, m) : Math.min(q1Day + 15, daysInMonth(y, m));
  for (let i = 0; ; i++) {
    const { y, m } = addMonths(start.y, start.m, i, 1);
    for (const date of [format({ y, m, d: q1Day }), format({ y, m, d: q2Day(y, m) })]) {
      if (date < first) continue;
      if (date > until) return dates;
      dates.push(date);
    }
  }
}

const toCents = (n: number) => Math.round(n * 100);

/**
 * Builds the 6-quincena calendar starting with the quincena that contains `today`.
 *
 * - Payments are generated from `next_due_date` by frequency until `payments_left`
 *   runs out or the window ends. Payments that fell before the window still use up
 *   `payments_left` (they were already due).
 * - No date: the commitment cannot be placed, so it adds nothing to any total and
 *   counts as missing info in every quincena.
 * - Date but no `payments_left`: assumed to continue through the window, and flagged
 *   as missing info in each quincena where it adds a payment.
 */
export function buildCalendar(commitments: CalendarCommitment[], today: string): Calendar {
  const windows = quincenaWindows(today, QUINCENAS);
  const windowStart = windows[0].start;
  const windowEnd = windows[windows.length - 1].end;

  const quincenas: Quincena[] = windows.map((w) => ({
    ...w,
    total: 0,
    payments: [],
    missingInfoCount: 0,
  }));
  const incomplete: IncompleteCommitment[] = [];
  const cents = quincenas.map(() => 0);

  for (const c of commitments) {
    const missing: IncompleteCommitment["missing"] = [];
    if (c.next_due_date === null) missing.push("fecha");
    if (c.payments_left === null) missing.push("pagos restantes");
    if (missing.length) incomplete.push({ commitment: c, missing });

    if (c.next_due_date === null) {
      quincenas.forEach((q) => q.missingInfoCount++);
      continue;
    }

    let dates = paymentDates(c.next_due_date, c.frequency, windowEnd);
    if (c.payments_left !== null) dates = dates.slice(0, c.payments_left);

    const flagged = new Set<number>();
    for (const date of dates) {
      if (date < windowStart) continue;
      const i = quincenas.findIndex((q) => date >= q.start && date <= q.end);
      quincenas[i].payments.push({ commitmentId: c.id, date, amount: c.amount });
      cents[i] += toCents(c.amount);
      if (c.payments_left === null) flagged.add(i);
    }
    flagged.forEach((i) => quincenas[i].missingInfoCount++);
  }

  quincenas.forEach((q, i) => {
    q.total = cents[i] / 100;
    q.payments.sort((a, b) => a.date.localeCompare(b.date));
  });

  return { quincenas, incomplete };
}

/** Today's date in Mexico City as "YYYY-MM-DD". */
export function todayInMexico(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(now);
}
