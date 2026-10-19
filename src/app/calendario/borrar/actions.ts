"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type DeleteAllState = { message?: string };

/** Deletes every row the user owns in both tables. RLS also limits this to her rows. */
export async function deleteAllMyData(): Promise<DeleteAllState> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/");

  const [commitments, limits] = await Promise.all([
    supabase.from("commitments").delete().eq("user_id", userId),
    supabase.from("limits").delete().eq("user_id", userId),
  ]);
  if (commitments.error || limits.error) {
    return { message: "No pudimos borrar todo. Intenta de nuevo." };
  }

  redirect("/calendario");
}
