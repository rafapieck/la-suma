"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  commitmentInputSchema,
  readCommitmentForm,
  type CommitmentField,
} from "@/lib/commitments/schema";
import { createClient } from "@/lib/supabase/server";

export type AddCommitmentState = {
  errors?: Partial<Record<CommitmentField, string[]>>;
  message?: string;
  values?: ReturnType<typeof readCommitmentForm>;
};

export async function addCommitment(
  _prev: AddCommitmentState,
  formData: FormData,
): Promise<AddCommitmentState> {
  const values = readCommitmentForm(formData);
  const parsed = commitmentInputSchema.safeParse(values);
  if (!parsed.success) {
    return {
      errors: z.flattenError(parsed.error).fieldErrors,
      message: "Revisa los campos marcados.",
      values,
    };
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/");

  const { error } = await supabase.from("commitments").insert({
    ...parsed.data,
    user_id: userId,
    source: "manual",
    confirmed: true,
  });
  if (error) {
    return { message: "No pudimos guardar el pago. Intenta de nuevo.", values };
  }

  redirect("/calendario");
}
