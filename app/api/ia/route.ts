import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * POST /api/ia
 * Proxy seguro hacia OpenAI — la API key nunca sale del servidor.
 *
 * Body: { type: "chat" | "quiz", messages: [{role, content}] }
 * Response: { content: [{type: "text", text: "..."}] }  ← mismo formato que Anthropic
 */
export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY no configurada." }, { status: 500 });
  }

  let body: { type: string; messages: { role: string; content: string }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const { type, messages } = body;
  if (!messages?.length) {
    return NextResponse.json({ error: "messages requerido." }, { status: 422 });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: type === "quiz" ? 1200 : 800,
      messages: messages.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
    });

    const text = completion.choices[0]?.message?.content ?? "";

    // Devolver en formato Anthropic para que el frontend no necesite cambios
    return NextResponse.json({
      content: [{ type: "text", text }],
    });
  } catch (err: any) {
    console.error("OpenAI error:", err?.message);
    return NextResponse.json({ error: err?.message ?? "Error OpenAI" }, { status: 502 });
  }
}
