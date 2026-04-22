// Voice-to-text transcription via Lovable AI Gateway (Gemini multimodal).
// Accepts a base64 audio data URL and returns plain text.
//
// We deliberately route through the gateway (not a direct STT provider) so the
// project stays inside the LOVABLE_API_KEY budget — no extra secrets needed.

import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const MAX_AUDIO_BYTES = 8 * 1024 * 1024; // 8 MB hard ceiling for safety

interface Body {
  audio: string;       // data URL: data:audio/webm;base64,...
  mimeHint?: string;   // optional override (e.g. "audio/mp4")
  language?: string;   // optional ISO hint, e.g. "en"
}

const ok = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const fail = (message: string, status = 400, extra?: Record<string, unknown>) =>
  ok({ error: message, ...extra }, status);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.method !== "POST") return fail("Use POST", 405);

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }

  const audio = (body?.audio ?? "").toString();
  if (!audio.startsWith("data:")) {
    return fail("Field 'audio' must be a data URL (data:audio/...;base64,...)");
  }

  // Parse data URL → mime + base64
  const match = audio.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return fail("Malformed audio data URL");
  const detectedMime = match[1];
  const base64 = match[2];
  const mime = body.mimeHint ?? detectedMime;

  // Approx byte length: base64 length * 3/4 (minus padding)
  const approxBytes = Math.floor((base64.length * 3) / 4);
  if (approxBytes > MAX_AUDIO_BYTES) {
    return fail("Audio is too long. Voice memos must be under ~60s.", 413);
  }

  // Gemini accepts wav/mp3 reliably via OpenAI-compatible input_audio.
  // Browsers usually capture audio/webm or audio/mp4. We pass the raw bytes
  // through and let the gateway format-detect; Gemini handles webm/ogg too.
  // We map only the "format" hint to wav/mp3 to keep the OpenAI shape happy.
  const fmt: "wav" | "mp3" =
    /mpeg|mp3/i.test(mime) ? "mp3" : "wav"; // wav as a safe default label

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return fail("LOVABLE_API_KEY is not configured", 500);

  const language = body.language?.trim();
  const systemPrompt =
    "You are a precise transcription engine. Output only the verbatim spoken " +
    "words from the audio in clean, properly punctuated prose. No preamble, " +
    "no commentary, no quotes, no labels. If the audio is silent or " +
    "unintelligible, return an empty string." +
    (language ? ` The expected language is ${language}.` : "");

  let upstream: Response;
  try {
    upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Transcribe this audio." },
              { type: "input_audio", input_audio: { data: base64, format: fmt } },
            ],
          },
        ],
      }),
    });
  } catch (err) {
    console.error("Gateway fetch failed:", err);
    return fail("Transcription service is unreachable. Try again.", 502);
  }

  if (upstream.status === 429) {
    return fail(
      "We're receiving too many requests right now. Please try again in a moment.",
      429
    );
  }
  if (upstream.status === 402) {
    return fail(
      "AI transcription credits are exhausted. Add funds to keep voice-to-text working.",
      402
    );
  }
  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    console.error("Gateway error:", upstream.status, detail);
    return fail("Transcription failed. You can still keep the voice memo as-is.", 500);
  }

  const data = await upstream.json();
  const text = (data?.choices?.[0]?.message?.content ?? "").toString().trim();

  return ok({ text });
});
