import { Suspense } from "react";
import Link from "next/link";
import { buildCalendar, todayInMexico } from "@/lib/calendar/build-calendar";
import { getMyCommitments, getMyLimits } from "@/lib/commitments/queries";
import { formatFrequency, formatMoney } from "@/lib/format";
import { CalendarCard } from "./calendar-card";

export default function CalendarioPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">La Suma</h1>
        <form action="/auth/signout" method="post">
          <button type="submit" className="rounded-lg px-4 py-3 text-sm underline">
            Salir
          </button>
        </form>
      </header>
      <p className="text-sm text-zinc-500">Datos inventados · versión de prueba</p>
      <Suspense fallback={<p>Cargando tu calendario…</p>}>
        <Calendario />
      </Suspense>
    </main>
  );
}

async function Calendario() {
  const [{ commitments, email }, limits] = await Promise.all([getMyCommitments(), getMyLimits()]);
  if (!commitments) {
    return <p className="text-red-600">No pudimos leer tus pagos. Intenta de nuevo.</p>;
  }

  const calendar = buildCalendar(commitments, todayInMexico());

  return (
    <section className="flex flex-col gap-4">
      <CalendarCard calendar={calendar} ceiling={limits?.ceiling_per_quincena ?? null} />
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/calendario/foto"
          className="rounded-full bg-teal-800 px-4 py-4 text-center text-lg font-semibold text-white dark:bg-teal-400 dark:text-zinc-900"
        >
          📷 Agregar con foto
        </Link>
        <Link
          href="/calendario/agregar"
          className="rounded-full bg-teal-800 px-4 py-4 text-center text-lg font-semibold text-white dark:bg-teal-400 dark:text-zinc-900"
        >
          + Agregar a mano
        </Link>
      </div>
      <Link
        href="/calendario/preview"
        className="mx-auto rounded-full bg-zinc-200 px-6 py-3 text-center font-medium dark:bg-zinc-800"
      >
        ¿Y si compro algo más?
      </Link>
      <Link href="/calendario/limites" className="py-2 text-center underline">
        Mis límites
      </Link>

      {calendar.incomplete.length > 0 && (
        <div className="rounded-2xl border border-amber-200 p-5 dark:border-amber-900">
          <h2 className="text-lg font-semibold">Pagos con información faltante</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {calendar.incomplete.map(({ commitment: c, missing }) => (
              <li key={c.id}>
                <span className="font-medium">{c.lender}</span>
                {c.label ? ` · ${c.label}` : ""}: falta {missing.join(" y ")}.
                {missing.includes("fecha") && " No se suma en ninguna quincena."}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">Tus pagos</h2>
        {commitments.length === 0 ? (
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Todavía no agregas pagos. Agrega el primero.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-zinc-200 dark:divide-zinc-800">
            {commitments.map((c) => (
              <li key={c.id} className="py-3">
                <p className="font-medium">
                  {c.lender}
                  {c.label ? ` · ${c.label}` : ""}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {formatMoney(c.amount)} {formatFrequency(c.frequency)} · próximo pago:{" "}
                  {c.next_due_date ?? "No sé"} · faltan: {c.payments_left ?? "No sé"}
                </p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-sm text-zinc-500">
          Sesión: {email}
        </p>
      </div>
    </section>
  );
}
