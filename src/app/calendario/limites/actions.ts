"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { todayInMexico } from "@/lib/calendar/build-calendar";
import {
  limitsInputSchema,
  pauseEndTimestamp,
  readLimitsForm,
  type LimitsInput,
} from "@/lib/limits/limits";
import { createClient } from "@/lib/supabase/server";

export type LimitsState = {
  errors?: Partial<Record<keyof LimitsInput, string[]>>;
  message?: string;
  values?: ReturnType<typeof readLimitsForm>;
};

async function requireUser() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/");
  return { supabase, userId };
}

export async function saveLimits(_prev: LimitsState, formData: FormData): Promise<LimitsState> {
  const values = readLimitsForm(formData);
  const parsed = limitsInputSchema.safeParse(values);
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, message: "Revisa los campos marcados.", values };
  }
  const { ceiling_per_quincena, pause_until_date, note_to_self } = parsed.data;
  if (pause_until_date && pause_until_date < todayInMexico()) {
    return { errors: { pause_until_date: ["Elige hoy o una fecha después de hoy."] }, values };
  }

  const { supabase, userId } = await requireUser();
  const { error } = await supabase.from("limits").upsert({
    user_id: userId,
    ceiling_per_quincena,
    pause_until: pause_until_date ? pauseEndTimestamp(pause_until_date) : null,
    // A note only makes sense with a pause.
    note_to_self: pause_until_date ? note_to_self : null,
  });
  if (error) return { message: "No pudimos guardar. Intenta de nuevo.", values };

  redirect("/calendario");
}

/** Ends the pause now. Only the user can do this; the app never ends it on its own. */
export async function endPause() {
  const { supabase, userId } = await requireUser();
  await supabase
    .from("limits")
    .update({ pause_until: null, note_to_self: null })
    .eq("user_id", userId);
  redirect("/calendario/limites");
}
