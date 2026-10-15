import type { Calendar } from "@/lib/calendar/build-calendar";
import { formatMoney } from "@/lib/format";

export function CalendarCard({
  calendar,
  ceiling = null,
}: {
  calendar: Calendar;
  /** The user's own limit per quincena, drawn as a dashed line. null = no line. */
  ceiling?: number | null;
}) {
  const max = Math.max(...calendar.quincenas.map((q) => q.total), ceiling ?? 0);
  const pct = (n: number) => (max > 0 ? (n / max) * 100 : 0);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="border-b border-zinc-200 px-5 py-4 text-xl font-semibold dark:border-zinc-800">
        Tus próximas 6 quincenas
      </h2>
      <p className="mx-5 mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
        Este total puede estar incompleto: solo incluye lo que tú agregaste.
      </p>
      {ceiling !== null && (
        <p className="mx-5 mt-3 flex items-center gap-2 text-sm text-teal-900 dark:text-teal-200">
          <span className="inline-block w-6 border-t-2 border-dashed border-teal-900 dark:border-teal-200" />
          Tu límite: {formatMoney(ceiling)}
        </p>
      )}
      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {calendar.quincenas.map((q) => (
          <li key={q.start} className="px-5 py-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-lg">{q.label}</span>
              <span className="text-lg font-semibold text-teal-800 dark:text-teal-300">
                {formatMoney(q.total)}
              </span>
            </div>
            {q.missingInfoCount > 0 && (
              <span className="mt-1 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-900 dark:bg-amber-900 dark:text-amber-100">
                Falta información de {q.missingInfoCount} pago(s)
              </span>
            )}
            <div className="relative mt-2 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-2 rounded-full bg-teal-800 dark:bg-teal-400"
                style={{ width: `${pct(q.total)}%` }}
              />
              {ceiling !== null && (
                <span
                  aria-hidden
                  className="absolute -top-2 h-6 border-l-2 border-dashed border-teal-900 dark:border-teal-200"
                  style={{ left: `calc(${pct(ceiling)}% - 1px)` }}
                />
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
