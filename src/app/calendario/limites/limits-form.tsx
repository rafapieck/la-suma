"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveLimits, type LimitsState } from "./actions";

const inputClass =
  "w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-lg dark:border-zinc-700 dark:bg-zinc-900";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="mt-1 text-sm text-red-600">{messages[0]}</p>;
}

export type LimitsFormValues = NonNullable<LimitsState["values"]>;

export function LimitsForm({ initial, today }: { initial: LimitsFormValues; today: string }) {
  const [state, formAction, pending] = useActionState<LimitsState, FormData>(saveLimits, {});
  const v = state.values ?? initial;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-lg font-semibold">Mi límite por quincena</legend>
        <label htmlFor="ceiling_per_quincena" className="text-sm text-zinc-600 dark:text-zinc-400">
          Si escribes una cantidad, verás una línea punteada en tu calendario. Déjalo vacío para no
          tener límite.
        </label>
        <input id="ceiling_per_quincena" name="ceiling_per_quincena" type="number"
          inputMode="decimal" step="0.01" min="0" placeholder="Ej. 2000"
          defaultValue={v.ceiling_per_quincena} className={inputClass} />
        <FieldError messages={state.errors?.ceiling_per_quincena} />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-lg font-semibold">Pausa (opcional)</legend>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Mientras dure, “¿Y si compro algo más?” te mostrará primero tu propia nota. Siempre podrás
          continuar.
        </p>
        <label htmlFor="pause_until_date" className="font-medium">Pausa hasta</label>
        <input id="pause_until_date" name="pause_until_date" type="date" min={today}
          defaultValue={v.pause_until_date} className={inputClass} />
        <FieldError messages={state.errors?.pause_until_date} />
        <label htmlFor="note_to_self" className="mt-2 font-medium">Nota para mí</label>
        <textarea id="note_to_self" name="note_to_self" rows={3} maxLength={200}
          placeholder="Ej. Esperar a que termine lo de la lavadora"
          defaultValue={v.note_to_self} className={inputClass} />
        <p className="text-xs text-zinc-500">Hasta 200 letras.</p>
        <FieldError messages={state.errors?.note_to_self} />
      </fieldset>

      {state.message && (
        <p aria-live="polite" className="rounded-xl bg-red-50 p-3 text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.message}
        </p>
      )}

      <button type="submit" disabled={pending}
        className="rounded-xl bg-zinc-900 px-6 py-4 text-lg font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-zinc-900">
        {pending ? "Guardando…" : "Guardar"}
      </button>
      <Link href="/calendario" className="py-3 text-center underline">
        Volver al calendario
      </Link>
    </form>
  );
}
