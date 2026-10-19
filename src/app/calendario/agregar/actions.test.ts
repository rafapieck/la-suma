import { beforeEach, describe, expect, it, vi } from "vitest";

// Fake Supabase: records inserts so we can prove nothing reaches the database.
const insert = vi.fn().mockResolvedValue({ error: null });
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims: async () => ({ data: { claims: { sub: "user-1" } } }) },
    from: () => ({ insert }),
  }),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));

const { addCommitment } = await import("./actions");

function form(fields: Record<string, string>) {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

// Rafael's live case: lender + amount, frequency left on "Elige una opción", "No sé" for the rest.
const noFrequency = {
  source: "manual",
  lender: "prueba",
  amount: "100",
  next_due_date_unknown: "on",
  payments_left_unknown: "on",
};

describe("addCommitment (server)", () => {
  beforeEach(() => insert.mockClear());

  it("rejects a form with no frequency chosen and saves nothing", async () => {
    const state = await addCommitment({}, form(noFrequency));
    expect(state.errors?.frequency).toEqual(["Elige cada cuánto pagas."]);
    expect(insert).not.toHaveBeenCalled();
  });

  it("rejects an empty or made-up frequency value", async () => {
    for (const frequency of ["", "diario", "Elige una opción"]) {
      const state = await addCommitment({}, form({ ...noFrequency, frequency }));
      expect(state.errors?.frequency).toBeDefined();
    }
    expect(insert).not.toHaveBeenCalled();
  });

  it("saves once a frequency is chosen", async () => {
    await expect(addCommitment({}, form({ ...noFrequency, frequency: "semanal" }))).rejects.toThrow(
      "REDIRECT /calendario",
    );
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ lender: "prueba", frequency: "semanal", next_due_date: null, payments_left: null, source: "manual" }),
    );
  });
});
