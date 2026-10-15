import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/");

  // RLS returns only this user's rows.
  const { count, error } = await supabase
    .from("commitments")
    .select("id", { count: "exact", head: true });

  if (error) {
    return <p className="text-red-600">No pudimos leer tus pagos. Intenta de nuevo.</p>;
  }

  return (
    <section className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
      <h2 className="text-lg font-semibold">Tus próximas 6 quincenas</h2>
      {count ? (
        <p className="mt-2">Tienes {count} pago(s) guardado(s).</p>
      ) : (
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Tu calendario está vacío. Pronto podrás agregar tus pagos.
        </p>
      )}
      <p className="mt-4 text-sm text-zinc-500">
        Sesión: {String(claims.claims.email ?? "")}
      </p>
    </section>
  );
}
