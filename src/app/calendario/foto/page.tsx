import Link from "next/link";
import { PhotoFlow } from "./photo-flow";

export default function FotoPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold">Agregar con foto</h1>
      <p className="text-sm text-zinc-500">Datos inventados · versión de prueba</p>
      <PhotoFlow />
      <Link href="/calendario" className="py-3 text-center underline">
        Volver al calendario
      </Link>
    </main>
  );
}
