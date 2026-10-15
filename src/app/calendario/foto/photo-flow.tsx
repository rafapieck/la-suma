"use client";

import { useState } from "react";
import {
  IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  type ExtractResult,
} from "@/lib/commitments/extraction";
import { AddForm, type AddFormValues } from "../agregar/add-form";

function toFormValues({ fields }: ExtractResult): AddFormValues {
  return {
    lender: fields.lender ?? "",
    label: fields.label ?? "",
    amount: fields.amount === null ? "" : String(fields.amount),
    frequency: fields.frequency ?? "",
    next_due_date: fields.next_due_date,
    payments_left: fields.payments_left === null ? null : String(fields.payments_left),
  };
}

export function PhotoFlow() {
  const [result, setResult] = useState<ExtractResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function upload(file: File | undefined) {
    setError("");
    if (!file) return;
    if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) {
      setError("La foto debe ser JPG o PNG.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("La foto pesa más de 4 MB. Intenta con una más ligera.");
      return;
    }
    setLoading(true);
    try {
      const body = new FormData();
      body.set("image", file);
      const res = await fetch("/api/extract", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "No pudimos leer la foto. Intenta de nuevo.");
      } else {
        setResult(json as ExtractResult);
      }
    } catch {
      setError("No pudimos enviar la foto. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="flex flex-col gap-5">
        <p
          className={
            result.simulated
              ? "rounded-xl bg-amber-100 p-3 font-semibold text-amber-900 dark:bg-amber-900 dark:text-amber-100"
              : "rounded-xl bg-teal-50 p-3 font-semibold text-teal-900 dark:bg-teal-950 dark:text-teal-100"
          }
        >
          {result.simulated ? "⚠️ Simulado — revisa cada campo" : "Leído por IA — revisa cada campo"}
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Nada se guarda hasta que toques “Confirmar”. Lo que no se pudo leer quedó vacío o en “No sé”.
        </p>
        <AddForm
          initial={toFormValues(result)}
          source="photo"
          submitLabel="Confirmar"
        />
        <button type="button" onClick={() => setResult(null)} className="py-3 underline">
          Usar otra foto
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="rounded-xl bg-amber-50 p-4 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
        Tu foto se envía a Google Gemini solo para leerla. En esta versión de prueba no subas
        documentos reales.
      </p>
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl bg-teal-800 px-6 py-4 text-center text-lg font-semibold text-white dark:bg-teal-400 dark:text-zinc-900">
        {loading ? "Leyendo tu foto…" : "📷 Elegir o tomar foto"}
        <input
          type="file"
          accept="image/jpeg,image/png"
          className="sr-only"
          disabled={loading}
          onChange={(e) => upload(e.target.files?.[0])}
        />
      </label>
      <p className="text-sm text-zinc-500">JPG o PNG, máximo 4 MB.</p>
      {error && <p className="text-red-600">{error}</p>}
      <p className="text-sm">
        ¿Quieres probar?{" "}
        <a href="/ticket-ejemplo.png" download className="underline">
          Descarga este ticket de ejemplo (Datos inventados)
        </a>{" "}
        y súbelo.
      </p>
    </div>
  );
}
