import { GoogleGenAI } from "@google/genai";
import { NextResponse, type NextRequest } from "next/server";
import {
  EXTRACTION_JSON_SCHEMA,
  EXTRACTION_PROMPT,
  IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  SIMULATED_EXTRACTION,
  sanitizeExtraction,
  type ExtractResult,
} from "@/lib/commitments/extraction";
import { withTimeoutRetry } from "@/lib/retry";
import { createClient } from "@/lib/supabase/server";

// Current free-tier Gemini Flash model that reads images. Override with GEMINI_MODEL.
const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
// Gemini sometimes takes longer than usual: 25 s per try, one retry, then the simulated
// fallback. maxDuration leaves room for both tries on Vercel.
const TIMEOUT_MS = 25_000;
export const maxDuration = 60;

const simulated = () => NextResponse.json<ExtractResult>({ simulated: true, fields: SIMULATED_EXTRACTION });

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) {
    return NextResponse.json({ error: "Inicia sesión para continuar." }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Elige una foto." }, { status: 400 });
  }
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return NextResponse.json({ error: "La foto debe ser JPG o PNG." }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "La foto pesa más de 4 MB." }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return simulated();

  try {
    const ai = new GoogleGenAI({ apiKey });
    const data = Buffer.from(await file.arrayBuffer()).toString("base64");
    const raw = await withTimeoutRetry(
      async (abortSignal) => {
        const response = await ai.models.generateContent({
          model: MODEL,
          contents: [
            {
              role: "user",
              parts: [{ inlineData: { mimeType: file.type, data } }, { text: EXTRACTION_PROMPT }],
            },
          ],
          config: {
            responseMimeType: "application/json",
            responseJsonSchema: EXTRACTION_JSON_SCHEMA,
            temperature: 0,
            abortSignal,
          },
        });
        // Parse inside the retry so a cut-off or malformed reply also gets a second try.
        return JSON.parse(response.text ?? "null") as unknown;
      },
      { timeoutMs: TIMEOUT_MS },
    );
    const fields = sanitizeExtraction(raw);
    return NextResponse.json<ExtractResult>({ simulated: false, fields });
  } catch (error) {
    console.error("Gemini extraction failed after retry:", error instanceof Error ? error.message : error);
    return simulated();
  }
}
