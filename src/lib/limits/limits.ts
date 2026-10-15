import { z } from "zod";

export type Limits = {
  ceiling_per_quincena: number | null;
  pause_until: string | null; // timestamptz from the database
  note_to_self: string | null;
};

const emptyToNull = (v: unknown) => (v === "" || v === undefined ? null : v);

// Everything is optional: an empty form means "no limit, no pause".
export const limitsInputSchema = z.object({
  ceiling_per_quincena: z.preprocess(
    emptyToNull,
    z.coerce
      .number({ error: "Escribe el límite con números." })
      .positive("El límite debe ser mayor que 0.")
      .max(10_000_000, "El límite es demasiado grande.")
      .refine((n) => Math.round(n * 100) === n * 100, "Usa máximo 2 decimales.")
      .nullable(),
  ),
  pause_until_date: z.preprocess(
    emptyToNull,
    z.iso.date({ error: "Revisa la fecha de la pausa." }).nullable(),
  ),
  note_to_self: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z
      .string()
      .max(200, "La nota puede tener hasta 200 letras.")
      .transform((v) => v || null)
      .nullable()
      .default(null),
  ),
});

export type LimitsInput = z.infer<typeof limitsInputSchema>;

export function readLimitsForm(formData: FormData) {
  const text = (name: string) => {
    const v = formData.get(name);
    return typeof v === "string" ? v : "";
  };
  return {
    ceiling_per_quincena: text("ceiling_per_quincena"),
    pause_until_date: text("pause_until_date"),
    note_to_self: text("note_to_self"),
  };
}

/** A pause "until Oct 22" lasts through the end of Oct 22 in Mexico City (UTC-6, no DST). */
export function pauseEndTimestamp(date: string): string {
  return `${date}T23:59:59-06:00`;
}

/** The pause end as a "YYYY-MM-DD" date in Mexico City. */
export function pauseEndDate(pauseUntil: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(
    new Date(pauseUntil),
  );
}

export function isPauseActive(limits: Limits | null, now: Date = new Date()): boolean {
  if (!limits?.pause_until) return false;
  return new Date(limits.pause_until).getTime() > now.getTime();
}

/** "22 de octubre de 2026" */
export function formatDateEs(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** The text shown before the preview while a pause is active. */
export function pauseMessage(limits: Limits): string {
  const date = formatDateEs(pauseEndDate(limits.pause_until!));
  return limits.note_to_self
    ? `Te pediste una pausa hasta ${date}: “${limits.note_to_self}”`
    : `Te pediste una pausa hasta ${date}.`;
}
