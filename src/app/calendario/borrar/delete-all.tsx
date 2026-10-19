"use client";

import { useActionState, useState } from "react";
import { deleteAllMyData, type DeleteAllState } from "./actions";

export function DeleteAll() {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState<DeleteAllState>(deleteAllMyData, {});

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="w-full rounded-xl border border-red-300 px-6 py-4 text-lg font-semibold text-red-700 dark:border-red-800 dark:text-red-300"
      >
        Borrar todos mis datos
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-2xl border border-red-300 p-5 dark:border-red-800">
      <p className="text-lg font-semibold">¿Borrar todos tus datos?</p>
      <p>
        Se borran todos tus pagos, tu límite y tu pausa. No se puede deshacer.
      </p>
      {state.message && <p aria-live="polite" className="text-red-600">{state.message}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-red-700 px-6 py-4 text-lg font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Borrando…" : "Sí, borrar todo"}
      </button>
      <button type="button" onClick={() => setConfirming(false)} className="py-3 underline">
        Cancelar
      </button>
    </form>
  );
}
