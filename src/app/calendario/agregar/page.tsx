import { AddForm } from "./add-form";

export default function AgregarPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold">Agregar un pago</h1>
      <p className="text-sm text-zinc-500">
        Datos inventados · versión de prueba. Si no sabes un dato, marca “No sé”.
      </p>
      <AddForm />
    </main>
  );
}
