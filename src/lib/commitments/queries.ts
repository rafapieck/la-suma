import "server-only";
import { redirect } from "next/navigation";
import type { CalendarCommitment } from "@/lib/calendar/build-calendar";
import type { Limits } from "@/lib/limits/limits";
import { createClient } from "@/lib/supabase/server";

/** The signed-in user's commitments (RLS limits rows to theirs). Redirects if signed out. */
export async function getMyCommitments() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/");

  const { data, error } = await supabase
    .from("commitments")
    .select("id, lender, label, amount, frequency, next_due_date, payments_left")
    .order("created_at", { ascending: false });

  const commitments: CalendarCommitment[] | null = error
    ? null
    : data.map((c) => ({ ...c, amount: Number(c.amount) }));
  return { commitments, email: String(claims.claims.email ?? "") };
}

/** The signed-in user's own limits row, or null if she never set any. */
export async function getMyLimits(): Promise<Limits | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("limits")
    .select("ceiling_per_quincena, pause_until, note_to_self")
    .maybeSingle();
  if (!data) return null;
  return {
    ceiling_per_quincena:
      data.ceiling_per_quincena === null ? null : Number(data.ceiling_per_quincena),
    pause_until: data.pause_until,
    note_to_self: data.note_to_self,
  };
}
