import "server-only";
import { redirect } from "next/navigation";
import type { CalendarCommitment } from "@/lib/calendar/build-calendar";
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
