import { SignInButton } from "./sign-in-button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <h1 className="text-5xl font-bold tracking-tight">La Suma</h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">
        Datos inventados · versión de prueba
      </p>
      <p className="max-w-sm text-base">
        Todos tus abonos en un solo calendario de quincenas.
      </p>
      <SignInButton />
    </main>
  );
}
