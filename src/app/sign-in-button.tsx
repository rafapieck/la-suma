"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export function SignInButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function signIn() {
    setLoading(true);
    setError("");
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError("No pudimos abrir Google. Intenta de nuevo.");
      setLoading(false);
    }
  }

  if (!hasSupabaseEnv) {
    return (
      <p className="text-sm text-zinc-500">
        El inicio de sesión todavía no está configurado.
      </p>
    );
  }

  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-2">
      <button
        type="button"
        onClick={signIn}
        disabled={loading}
        className="w-full rounded-xl bg-zinc-900 px-6 py-4 text-lg font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-zinc-900"
      >
        {loading ? "Abriendo Google…" : "Entrar con Google"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
