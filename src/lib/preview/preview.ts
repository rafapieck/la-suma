import { z } from "zod";
import {
  buildCalendar,
  type Calendar,
  type CalendarCommitment,
} from "@/lib/calendar/build-calendar";
import { commitmentInputSchema } from "@/lib/commitments/schema";

export const HYPOTHETICAL_ID = "hipotetico";
export const DEFAULT_PREVIEW_LENDER = "Compra nueva";

// Same rules as a real commitment, except the store is optional and the first
// payment date is required: without a date there is nothing to place on the calendar.
export const previewInputSchema = commitmentInputSchema.extend({
  lender: z
    .string()
    .trim()
    .max(60, "El nombre puede tener hasta 60 letras.")
    .transform((v) => v || DEFAULT_PREVIEW_LENDER),
  next_due_date: z
    .iso.date({ error: "Elige la fecha del primer pago." })
    .refine((d) => d >= "2000-01-01" && d <= "2100-12-31", "Revisa la fecha."),
});

export type PreviewInput = z.infer<typeof previewInputSchema>;

export type PreviewRow = {
  label: string;
  before: number;
  after: number;
  difference: number;
  /** How far "after" goes past HER limit. null when she set no limit or it stays at/below it. */
  afterAboveLimit: number | null;
};

export type Preview = {
  before: Calendar;
  after: Calendar;
  rows: PreviewRow[];
};

/** Before/after calendars for a purchase that is NOT saved anywhere. */
export function buildPreview(
  commitments: CalendarCommitment[],
  hypothetical: PreviewInput,
  today: string,
  ceiling: number | null = null,
): Preview {
  const before = buildCalendar(commitments, today);
  const after = buildCalendar(
    [...commitments, { ...hypothetical, id: HYPOTHETICAL_ID }],
    today,
  );
  const rows = before.quincenas.map((q, i) => {
    const a = after.quincenas[i].total;
    return {
      label: q.label,
      before: q.total,
      after: a,
      difference: round(a - q.total),
      afterAboveLimit: ceiling !== null && a > ceiling ? round(a - ceiling) : null,
    };
  });
  return { before, after, rows };
}

const round = (n: number) => Math.round(n * 100) / 100;

/** Query string that prefills the manual form with the previewed purchase. */
export function toAddFormQuery(input: PreviewInput): string {
  const params = new URLSearchParams({
    lender: input.lender,
    label: input.label ?? "",
    amount: String(input.amount),
    frequency: input.frequency,
    next_due_date: input.next_due_date,
    payments_left: input.payments_left === null ? "nose" : String(input.payments_left),
  });
  return params.toString();
}
