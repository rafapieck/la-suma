import { Suspense } from "react";
import { AddForm, type AddFormValues } from "./add-form";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function AgregarPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold">Agregar un pago</h1>
      <p className="text-sm text-zinc-500">
        Datos inventados · versión de prueba. Si no sabes un dato, marca “No sé”.
      </p>
      <Suspense fallback={<AddForm />}>
        <PrefilledForm searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

/** Prefills the form when coming from "¿Y si compro algo más?" → "Agregarlo". */
async function PrefilledForm({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const get = (key: string) => {
    const v = params[key];
    return typeof v === "string" ? v.slice(0, 200) : "";
  };
  if (!get("amount")) return <AddForm />;

  const initial: AddFormValues = {
    lender: get("lender"),
    label: get("label"),
    amount: get("amount"),
    frequency: get("frequency"),
    next_due_date: get("next_due_date") || null,
    payments_left: get("payments_left") === "nose" ? null : get("payments_left"),
  };
  return <AddForm initial={initial} />;
}
