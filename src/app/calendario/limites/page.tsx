import { Suspense } from "react";
import { todayInMexico } from "@/lib/calendar/build-calendar";
import { getMyLimits } from "@/lib/commitments/queries";
import { isPauseActive, pauseEndDate, pauseMessage } from "@/lib/limits/limits";
import { endPause } from "./actions";
import { LimitsForm } from "./limits-form";

export default function LimitesPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold">Mis límites</h1>
      <p className="text-sm text-zinc-500">
        Datos inventados · versión de prueba. Solo tú decides si pones un límite o una pausa.
      </p>
      <Suspense fallback={<p>Cargando…</p>}>
        <Limites />
      </Suspense>
    </main>
  );
}

async function Limites() {
  const limits = await getMyLimits();
  const active = isPauseActive(limits);

  return (
    <>
      {active && limits && (
        <div className="flex flex-col gap-3 rounded-2xl border border-teal-200 p-4 dark:border-teal-900">
          <p>{pauseMessage(limits)}</p>
          <form action={endPause}>
            <button type="submit" className="w-full rounded-xl bg-zinc-200 px-6 py-3 font-semibold dark:bg-zinc-800">
              Terminar pausa ahora
            </button>
          </form>
        </div>
      )}
      <LimitsForm
        today={todayInMexico()}
        initial={{
          ceiling_per_quincena:
            limits?.ceiling_per_quincena == null ? "" : String(limits.ceiling_per_quincena),
          pause_until_date: active && limits?.pause_until ? pauseEndDate(limits.pause_until) : "",
          note_to_self: active ? (limits?.note_to_self ?? "") : "",
        }}
      />
    </>
  );
}
