import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * POST /api/bots-stop
 * Detiene el bot HUELLA de la reunión.
 *
 * Body: { platform: string, nativeId: string }
 */
export async function POST(request: Request) {
  const vexaKey = process.env.VEXA_API_KEY;
  const vexaHost = process.env.VEXA_HOST ?? "https://api.cloud.vexa.ai";

  if (!vexaKey) {
    return NextResponse.json({ error: "VEXA_API_KEY no configurada." }, { status: 500 });
  }

  let body: { platform: string; nativeId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const { platform, nativeId } = body;
  if (!platform || !nativeId) {
    return NextResponse.json({ error: "platform y nativeId requeridos." }, { status: 422 });
  }

  try {
    const res = await fetch(`${vexaHost}/bots/${platform}/${nativeId}`, {
      method: "DELETE",
      headers: { "X-API-Key": vexaKey },
    });

    if (!res.ok && res.status !== 404) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: data?.detail ?? "Error al detener el bot." },
        { status: res.status }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Vexa /bots DELETE error:", err?.message);
    return NextResponse.json({ error: "Error de conexión con Vexa." }, { status: 502 });
  }
}
