"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { addCommitment, type AddCommitmentState } from "./actions";

const inputClass =
  "w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-lg disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="mt-1 text-sm text-red-600">{messages[0]}</p>;
}

export function AddForm() {
  const [state, formAction, pending] = useActionState<AddCommitmentState, FormData>(
    addCommitment,
    {},
  );
  const v = state.values;
  const [dateUnknown, setDateUnknown] = useState(false);
  const [paymentsUnknown, setPaymentsUnknown] = useState(false);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <div>
        <label htmlFor="lender" className="mb-1 block font-medium">
          ¿Con quién es el pago?
        </label>
        <input id="lender" name="lender" maxLength={60} placeholder="Ej. Coppel"
          defaultValue={v?.lender} className={inputClass} />
        <FieldError messages={state.errors?.lender} />
      </div>

      <div>
        <label htmlFor="label" className="mb-1 block font-medium">
          ¿Qué compraste? <span className="font-normal text-zinc-500">(opcional)</span>
        </label>
        <input id="label" name="label" placeholder="Ej. Refrigerador"
          defaultValue={v?.label} className={inputClass} />
        <FieldError messages={state.errors?.label} />
      </div>

      <div>
        <label htmlFor="amount" className="mb-1 block font-medium">
          ¿Cuánto pagas cada vez? (pesos)
        </label>
        <input id="amount" name="amount" type="number" inputMode="decimal" step="0.01" min="0"
          placeholder="Ej. 450" defaultValue={v?.amount} className={inputClass} />
        <FieldError messages={state.errors?.amount} />
      </div>

      <div>
        <label htmlFor="frequency" className="mb-1 block font-medium">
          ¿Cada cuánto pagas?
        </label>
        <select id="frequency" name="frequency" defaultValue={v?.frequency ?? ""}
          className={inputClass}>
          <option value="" disabled>Elige una opción</option>
          <option value="semanal">Cada semana</option>
          <option value="quincenal">Cada quincena</option>
          <option value="mensual">Cada mes</option>
        </select>
        <FieldError messages={state.errors?.frequency} />
      </div>

      <div>
        <label htmlFor="next_due_date" className="mb-1 block font-medium">
          ¿Cuándo es tu próximo pago?
        </label>
        <input id="next_due_date" name="next_due_date" type="date" disabled={dateUnknown}
          defaultValue={v?.next_due_date ?? ""} className={inputClass} />
        <label className="mt-2 flex items-center gap-3 py-2">
          <input type="checkbox" name="next_due_date_unknown" checked={dateUnknown}
            onChange={(e) => setDateUnknown(e.target.checked)} className="h-6 w-6" />
          No sé
        </label>
        <FieldError messages={state.errors?.next_due_date} />
      </div>

      <div>
        <label htmlFor="payments_left" className="mb-1 block font-medium">
          ¿Cuántos pagos te faltan?
        </label>
        <input id="payments_left" name="payments_left" type="number" inputMode="numeric"
          step="1" min="1" disabled={paymentsUnknown} defaultValue={v?.payments_left ?? ""}
          className={inputClass} />
        <label className="mt-2 flex items-center gap-3 py-2">
          <input type="checkbox" name="payments_left_unknown" checked={paymentsUnknown}
            onChange={(e) => setPaymentsUnknown(e.target.checked)} className="h-6 w-6" />
          No sé
        </label>
        <FieldError messages={state.errors?.payments_left} />
      </div>

      {state.message && (
        <p aria-live="polite" className="rounded-xl bg-red-50 p-3 text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.message}
        </p>
      )}

      <button type="submit" disabled={pending}
        className="rounded-xl bg-zinc-900 px-6 py-4 text-lg font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-zinc-900">
        {pending ? "Guardando…" : "Guardar pago"}
      </button>
      <Link href="/calendario" className="py-3 text-center underline">
        Cancelar
      </Link>
    </form>
  );
}
