"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import type { CalendarCommitment } from "@/lib/calendar/build-calendar";
import { readCommitmentForm } from "@/lib/commitments/schema";
import { formatMoney } from "@/lib/format";
import {
  buildPreview,
  previewInputSchema,
  toAddFormQuery,
  type Preview,
  type PreviewInput,
} from "@/lib/preview/preview";

const inputClass =
  "w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-lg disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900";

type Errors = Partial<Record<keyof PreviewInput, string[]>>;

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="mt-1 text-sm text-red-600">{messages[0]}</p>;
}

export function PreviewTool({
  commitments,
  today,
  pauseNote = null,
  ceiling = null,
}: {
  commitments: CalendarCommitment[];
  today: string;
  /** Her own limit per quincena, or null if she never set one. */
  ceiling?: number | null;
  /** Her own pause note. Shown first, never blocks: "Continuar" always opens the preview. */
  pauseNote?: string | null;
}) {
  const [continued, setContinued] = useState(false);
  if (pauseNote && !continued) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-teal-200 p-5 dark:border-teal-900">
        <p className="text-lg">{pauseNote}</p>
        <button
          type="button"
          onClick={() => setContinued(true)}
          className="rounded-xl bg-zinc-900 px-6 py-4 text-lg font-semibold text-white dark:bg-white dark:text-zinc-900"
        >
          Continuar
        </button>
        <Link href="/calendario" className="py-3 text-center underline">
          Volver al calendario
        </Link>
      </div>
    );
  }
  return <PreviewForm commitments={commitments} today={today} ceiling={ceiling} />;
}

function PreviewForm({
  commitments,
  today,
  ceiling,
}: {
  commitments: CalendarCommitment[];
  today: string;
  ceiling: number | null;
}) {
  const [errors, setErrors] = useState<Errors>({});
  const [paymentsUnknown, setPaymentsUnknown] = useState(false);
  const [result, setResult] = useState<{ input: PreviewInput; preview: Preview } | null>(null);

  // Runs only in the browser: nothing is sent to the server or saved.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const raw = readCommitmentForm(new FormData(event.currentTarget));
    const parsed = previewInputSchema.safeParse(raw);
    if (!parsed.success) {
      setErrors(z.flattenError(parsed.error).fieldErrors);
      setResult(null);
      return;
    }
    setErrors({});
    setResult({ input: parsed.data, preview: buildPreview(commitments, parsed.data, today, ceiling) });
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <div>
          <label htmlFor="label" className="mb-1 block font-medium">
            ¿Qué quieres comprar? <span className="font-normal text-zinc-500">(opcional)</span>
          </label>
          <input id="label" name="label" placeholder="Ej. Celular" className={inputClass} />
          <FieldError messages={errors.label} />
        </div>
        <div>
          <label htmlFor="lender" className="mb-1 block font-medium">
            ¿Dónde? <span className="font-normal text-zinc-500">(opcional)</span>
          </label>
          <input id="lender" name="lender" placeholder="Ej. Tienda" className={inputClass} />
          <FieldError messages={errors.lender} />
        </div>
        <div>
          <label htmlFor="amount" className="mb-1 block font-medium">
            ¿Cuánto pagarías cada vez? (pesos)
          </label>
          <input id="amount" name="amount" type="number" inputMode="decimal" step="0.01"
            min="0" placeholder="Ej. 400" className={inputClass} />
          <FieldError messages={errors.amount} />
        </div>
        <div>
          <label htmlFor="frequency" className="mb-1 block font-medium">
            ¿Cada cuánto pagarías?
          </label>
          <select id="frequency" name="frequency" defaultValue="" className={inputClass}>
            <option value="" disabled>Elige una opción</option>
            <option value="semanal">Cada semana</option>
            <option value="quincenal">Cada quincena</option>
            <option value="mensual">Cada mes</option>
          </select>
          <FieldError messages={errors.frequency} />
        </div>
        <div>
          <label htmlFor="next_due_date" className="mb-1 block font-medium">
            ¿Cuándo sería el primer pago?
          </label>
          <input id="next_due_date" name="next_due_date" type="date" className={inputClass} />
          <FieldError messages={errors.next_due_date} />
        </div>
        <div>
          <label htmlFor="payments_left" className="mb-1 block font-medium">
            ¿Cuántos pagos serían? <span className="font-normal">(pagos, no meses)</span>
          </label>
          <input id="payments_left" name="payments_left" type="number" inputMode="numeric"
            step="1" min="1" disabled={paymentsUnknown} className={inputClass} />
          <label className="mt-2 flex items-center gap-3 py-2">
            <input type="checkbox" name="payments_left_unknown" checked={paymentsUnknown}
              onChange={(e) => setPaymentsUnknown(e.target.checked)} className="h-6 w-6" />
            No sé
          </label>
          <FieldError messages={errors.payments_left} />
        </div>
        <button type="submit"
          className="rounded-xl bg-zinc-900 px-6 py-4 text-lg font-semibold text-white dark:bg-white dark:text-zinc-900">
          Ver cómo cambia
        </button>
      </form>

      {result && <Comparison {...result} ceiling={ceiling} />}

      {!result && (
        <Link href="/calendario" className="py-3 text-center underline">
          Volver al calendario
        </Link>
      )}
    </div>
  );
}

function Comparison({
  input,
  preview,
  ceiling,
}: {
  input: PreviewInput;
  preview: Preview;
  ceiling: number | null;
}) {
  const max = Math.max(...preview.rows.map((r) => Math.max(r.before, r.after)), ceiling ?? 0);
  const pct = (n: number) => (max > 0 ? (n / max) * 100 : 0);

  // Both bars are neutral greys: color must not read as "yes" or "no".
  const Bar = ({ value, className }: { value: number; className: string }) => (
    <div className="relative h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
      <div className={`h-2 rounded-full ${className}`} style={{ width: `${pct(value)}%` }} />
      {ceiling !== null && (
        <span
          aria-hidden
          className="absolute -top-1 h-4 border-l-2 border-dashed border-teal-900 dark:border-teal-200"
          style={{ left: `calc(${pct(ceiling)}% - 1px)` }}
        />
      )}
    </div>
  );

  return (
    <section
      aria-live="polite"
      ref={(el) => el?.scrollIntoView({ behavior: "smooth", block: "start" })}
      className="flex flex-col gap-4"
    >
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="border-b border-zinc-200 px-5 py-4 text-xl font-semibold dark:border-zinc-800">
          Antes y después
        </h2>
        <p className="mx-5 mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Vista previa: no se guardó nada. Solo incluye lo que tú agregaste.
        </p>
        {ceiling !== null && (
          <p className="mx-5 mt-3 flex items-center gap-2 text-sm text-teal-900 dark:text-teal-200">
            <span className="inline-block w-6 border-t-2 border-dashed border-teal-900 dark:border-teal-200" />
            Tu límite: {formatMoney(ceiling)}
          </p>
        )}
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-5 pt-4 text-sm text-zinc-500">
          <span>Quincena</span>
          <span className="w-24 text-right">Antes</span>
          <span className="w-24 text-right">Después</span>
        </div>
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {preview.rows.map((r) => (
            <li key={r.label} className="px-5 py-3">
              <div className="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-4">
                <span className="text-lg">{r.label}</span>
                <span className="w-24 text-right text-zinc-600 dark:text-zinc-400">
                  {formatMoney(r.before)}
                </span>
                <span className="w-24 text-right font-semibold">{formatMoney(r.after)}</span>
              </div>
              {(r.difference !== 0 || r.afterAboveLimit !== null) && (
                <p className="text-right text-sm text-zinc-600 dark:text-zinc-400">
                  {r.difference !== 0 && <>+{formatMoney(r.difference)} con la compra</>}
                  {r.difference !== 0 && r.afterAboveLimit !== null && " · "}
                  {r.afterAboveLimit !== null && (
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {formatMoney(r.afterAboveLimit)} arriba de tu límite
                    </span>
                  )}
                </p>
              )}
              <div className="mt-2 flex flex-col gap-1">
                <Bar value={r.before} className="bg-zinc-300 dark:bg-zinc-600" />
                <Bar value={r.after} className="bg-zinc-700 dark:bg-zinc-300" />
              </div>
            </li>
          ))}
        </ul>
        <p className="px-5 pb-4 text-xs text-zinc-500">
          Barra clara: antes. Barra oscura: después.
          {ceiling !== null && " Línea punteada: tu límite."}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Link
          href={`/calendario/agregar?${toAddFormQuery(input)}`}
          className="rounded-full bg-zinc-200 px-4 py-4 text-center text-lg font-semibold dark:bg-zinc-800"
        >
          Agregarlo
        </Link>
        <Link
          href="/calendario"
          className="rounded-full bg-zinc-200 px-4 py-4 text-center text-lg font-semibold dark:bg-zinc-800"
        >
          No agregar
        </Link>
      </div>
    </section>
  );
}
