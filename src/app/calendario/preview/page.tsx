import { Suspense } from "react";
import { todayInMexico } from "@/lib/calendar/build-calendar";
import { getMyCommitments } from "@/lib/commitments/queries";
import { PreviewTool } from "./preview-tool";

export default function PreviewPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold">¿Y si compro algo más?</h1>
      <p className="text-sm text-zinc-500">
        Datos inventados · versión de prueba. Esta vista previa no guarda nada.
      </p>
      <Suspense fallback={<p>Cargando tus pagos…</p>}>
        <Preview />
      </Suspense>
    </main>
  );
}

async function Preview() {
  const { commitments } = await getMyCommitments();
  if (!commitments) {
    return <p className="text-red-600">No pudimos leer tus pagos. Intenta de nuevo.</p>;
  }
  return <PreviewTool commitments={commitments} today={todayInMexico()} />;
}
