import { z } from "zod";

export const FREQUENCIES = ["semanal", "quincenal", "mensual"] as const;

const emptyToUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);

// What the user typed. "No sé" fields arrive as null and are always allowed.
export const commitmentInputSchema = z.object({
  lender: z
    .string({ error: "Escribe con quién es el pago." })
    .trim()
    .min(1, "Escribe con quién es el pago.")
    .max(60, "El nombre puede tener hasta 60 letras."),
  label: z
    .string()
    .trim()
    .max(80, "La descripción puede tener hasta 80 letras.")
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .default(null),
  amount: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ error: "Escribe el monto con números." })
      .positive("El monto debe ser mayor que 0.")
      .max(10_000_000, "El monto es demasiado grande.")
      .refine((n) => Math.round(n * 100) === n * 100, "Usa máximo 2 decimales."),
  ),
  frequency: z.enum(FREQUENCIES, { error: "Elige cada cuánto pagas." }),
  next_due_date: z
    .iso.date({ error: "Elige una fecha o marca “No sé”." })
    .refine((d) => d >= "2000-01-01" && d <= "2100-12-31", "Revisa la fecha.")
    .nullable(),
  payments_left: z
    .preprocess(
      emptyToUndefined,
      z.coerce
        .number({ error: "Escribe cuántos pagos faltan o marca “No sé”." })
        .int("Escribe un número entero de pagos.")
        .min(1, "Debe faltar al menos 1 pago.")
        .max(1000, "Revisa el número de pagos."),
    )
    .nullable(),
});

export type CommitmentInput = z.infer<typeof commitmentInputSchema>;
export type CommitmentField = keyof CommitmentInput;

export function readCommitmentForm(formData: FormData) {
  const text = (name: string) => {
    const v = formData.get(name);
    return typeof v === "string" ? v : "";
  };
  const unknown = (name: string) => formData.get(`${name}_unknown`) === "on";
  return {
    lender: text("lender"),
    label: text("label"),
    amount: text("amount"),
    frequency: text("frequency"),
    next_due_date: unknown("next_due_date") ? null : text("next_due_date"),
    payments_left: unknown("payments_left") ? null : text("payments_left"),
  };
}
