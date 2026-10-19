"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { z } from "zod";
import {
  commitmentInputSchema,
  readCommitmentForm,
  type CommitmentField,
} from "@/lib/commitments/schema";
import { addCommitment, type AddCommitmentState } from "./actions";

const inputClass = "w-full rounded-xl border px-4 py-3 text-lg disabled:opacity-50";
const okBorder = "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900";
const errorBorder =
  "border-2 border-red-600 bg-red-50 outline-red-600 dark:border-red-500 dark:bg-red-950 dark:outline-red-500";

function FieldError({ id, messages }: { id: string; messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <p id={`${id}-error`} className="mt-1 text-sm font-medium text-red-600">
      {messages[0]}
    </p>
  );
}

export type AddFormValues = AddCommitmentState["values"];
type Errors = NonNullable<AddCommitmentState["errors"]>;

const FREQUENCY_OPTIONS = [
  { value: "semanal", label: "Cada semana" },
  { value: "quincenal", label: "Cada quincena" },
  { value: "mensual", label: "Cada mes" },
] as const;

type AddFormProps = {
  /** Prefilled values, e.g. what the AI read from a photo. null date/payments = "No sé". */
  initial?: AddFormValues;
  source?: "manual" | "photo";
  submitLabel?: string;
  cancelHref?: string;
};

export function AddForm({
  initial,
  source = "manual",
  submitLabel = "Guardar pago",
  cancelHref = "/calendario",
}: AddFormProps) {
  const [state, formAction, pending] = useActionState<AddCommitmentState, FormData>(
    addCommitment,
    {},
  );
  const v = state.values ?? initial;
  const formRef = useRef<HTMLFormElement>(null);
  // Errors found in the browser before sending. Server errors (state.errors) still apply
  // when the browser check is skipped or bypassed.
  const [clientErrors, setClientErrors] = useState<Errors | null>(null);
  const errors = clientErrors ?? state.errors;
  const message = clientErrors ? "Revisa los campos marcados." : state.message;

  // Same Zod schema as the server: block the save in the browser too.
  function checkBeforeSend(event: FormEvent<HTMLFormElement>) {
    const parsed = commitmentInputSchema.safeParse(readCommitmentForm(new FormData(event.currentTarget)));
    if (parsed.success) {
      setClientErrors(null);
      return;
    }
    event.preventDefault();
    setClientErrors(z.flattenError(parsed.error).fieldErrors);
  }

  // Marks a field red and links it to its message.
  const invalidField = (name: CommitmentField) => Boolean(errors?.[name]?.length);
  const field = (name: CommitmentField) => {
    const invalid = invalidField(name);
    return {
      className: `${inputClass} ${invalid ? errorBorder : okBorder}`,
      "aria-invalid": invalid || undefined,
      "aria-describedby": invalid ? `${name}-error` : undefined,
    };
  };

  // After a rejected save, move to the first field that needs fixing.
  useEffect(() => {
    formRef.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
  }, [errors]);
  const [dateUnknown, setDateUnknown] = useState(initial?.next_due_date === null);
  const [paymentsUnknown, setPaymentsUnknown] = useState(initial?.payments_left === null);

  return (
    <form ref={formRef} action={formAction} onSubmit={checkBeforeSend} noValidate
      className="flex flex-col gap-5">
      <input type="hidden" name="source" value={source} />
      <div>
        <label htmlFor="lender" className="mb-1 block font-medium">
          ¿Con quién es el pago?
        </label>
        <input id="lender" name="lender" maxLength={60} placeholder="Ej. Coppel"
          defaultValue={v?.lender} {...field("lender")} />
        <FieldError id="lender" messages={errors?.lender} />
      </div>

      <div>
        <label htmlFor="label" className="mb-1 block font-medium">
          ¿Qué compraste? <span className="font-normal text-zinc-500">(opcional)</span>
        </label>
        <input id="label" name="label" placeholder="Ej. Refrigerador"
          defaultValue={v?.label} {...field("label")} />
        <FieldError id="label" messages={errors?.label} />
      </div>

      <div>
        <label htmlFor="amount" className="mb-1 block font-medium">
          ¿Cuánto pagas cada vez? (pesos)
        </label>
        <input id="amount" name="amount" type="number" inputMode="decimal" step="0.01" min="0"
          placeholder="Ej. 450" defaultValue={v?.amount} {...field("amount")} />
        <FieldError id="amount" messages={errors?.amount} />
      </div>

      {/* Big radio buttons instead of a dropdown: nothing is chosen until she taps one.
          A phone's dropdown picker can pick the first option on its own. */}
      <fieldset
        aria-describedby={invalidField("frequency") ? "frequency-error" : undefined}
        className={`rounded-xl p-3 ${invalidField("frequency") ? errorBorder : "border border-transparent"}`}
      >
        <legend className="mb-1 px-1 font-medium">¿Cada cuánto pagas?</legend>
        <div className="grid gap-2">
          {FREQUENCY_OPTIONS.map((o, i) => (
            <label
              key={o.value}
              className="flex items-center gap-3 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-lg has-checked:border-teal-800 has-checked:bg-teal-50 dark:border-zinc-700 dark:bg-zinc-900 dark:has-checked:border-teal-300 dark:has-checked:bg-teal-950"
            >
              <input
                type="radio"
                name="frequency"
                value={o.value}
                defaultChecked={v?.frequency === o.value}
                aria-invalid={(i === 0 && invalidField("frequency")) || undefined}
                onChange={() =>
                  setClientErrors((e) => (e ? { ...e, frequency: undefined } : e))
                }
                className="h-6 w-6"
              />
              {o.label}
            </label>
          ))}
        </div>
        <FieldError id="frequency" messages={errors?.frequency} />
      </fieldset>

      <div>
        <label htmlFor="next_due_date" className="mb-1 block font-medium">
          ¿Cuándo es tu próximo pago?
        </label>
        <input id="next_due_date" name="next_due_date" type="date" disabled={dateUnknown}
          defaultValue={v?.next_due_date ?? ""} {...field("next_due_date")} />
        <label className="mt-2 flex items-center gap-3 py-2">
          <input type="checkbox" name="next_due_date_unknown" checked={dateUnknown}
            onChange={(e) => setDateUnknown(e.target.checked)} className="h-6 w-6" />
          No sé
        </label>
        <FieldError id="next_due_date" messages={errors?.next_due_date} />
      </div>

      <div>
        <label htmlFor="payments_left" className="mb-1 block font-medium">
          ¿Cuántos pagos te faltan?
        </label>
        <input id="payments_left" name="payments_left" type="number" inputMode="numeric"
          step="1" min="1" disabled={paymentsUnknown} defaultValue={v?.payments_left ?? ""}
          {...field("payments_left")} />
        <label className="mt-2 flex items-center gap-3 py-2">
          <input type="checkbox" name="payments_left_unknown" checked={paymentsUnknown}
            onChange={(e) => setPaymentsUnknown(e.target.checked)} className="h-6 w-6" />
          No sé
        </label>
        <FieldError id="payments_left" messages={errors?.payments_left} />
      </div>

      {message && (
        <p aria-live="polite" className="rounded-xl bg-red-50 p-3 text-red-700 dark:bg-red-950 dark:text-red-300">
          {message}
        </p>
      )}

      <button type="submit" disabled={pending}
        className="rounded-xl bg-zinc-900 px-6 py-4 text-lg font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-zinc-900">
        {pending ? "Guardando…" : submitLabel}
      </button>
      <Link href={cancelHref} className="py-3 text-center underline">
        Cancelar
      </Link>
    </form>
  );
}
