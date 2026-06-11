import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Extrae platform y native_meeting_id de un enlace de reunión.
 * Soporta Google Meet y Microsoft Teams.
 */
function parseMeetingUrl(url: string): { platform: string; nativeId: string; passcode?: string } | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.toLowerCase();

    // Google Meet: https://meet.google.com/abc-defg-hij
    if (host === "meet.google.com") {
      const code = u.pathname.replace(/^\//, "").split("/")[0];
      if (!code) return null;
      return { platform: "google_meet", nativeId: code };
    }

    // Microsoft Teams (live): https://teams.live.com/meet/1234567890123?p=XYZ
    if (host.includes("teams.live.com") || host.includes("teams.microsoft.com")) {
      // Extraer ID de la ruta
      const parts = u.pathname.replace(/^\/meet\//, "").split("/");
      const nativeId = parts[0] || parts[1];
      const passcode = u.searchParams.get("p") ?? undefined;
      if (!nativeId) return null;
      return { platform: "teams", nativeId, passcode };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * POST /api/bots
 * Envía el bot HUELLA a la reunión indicada por URL.
 *
 * Body: { meetingUrl: string, language?: string }
 * Response: { platform, nativeId, meetingId, status }
 */
export async function POST(request: Request) {
  const vexaKey = process.env.VEXA_API_KEY;
  const vexaHost = process.env.VEXA_HOST ?? "https://api.cloud.vexa.ai";

  if (!vexaKey) {
    return NextResponse.json({ error: "VEXA_API_KEY no configurada." }, { status: 500 });
  }

  let body: { meetingUrl: string; language?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const parsed = parseMeetingUrl(body.meetingUrl);
  if (!parsed) {
    return NextResponse.json(
      { error: "URL no reconocida. Usa un enlace de Google Meet o Microsoft Teams." },
      { status: 422 }
    );
  }

  const { platform, nativeId, passcode } = parsed;

  const vexaBody: Record<string, unknown> = {
    platform,
    native_meeting_id: nativeId,
    bot_name: "HUELLA",
    language: body.language ?? "es",
    transcribe_enabled: true,
    transcription_tier: "realtime",
  };
  if (passcode) vexaBody.passcode = passcode;

  try {
    const res = await fetch(`${vexaHost}/bots`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": vexaKey,
      },
      body: JSON.stringify(vexaBody),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.detail ?? "Error al enviar el bot." },
        { status: res.status }
      );
    }

    // RGPD: el bot enviará un mensaje al chat de la reunión (si Vexa lo soporta)
    // Vexa Interactive Bots API permite escribir en el chat
    try {
      await fetch(`${vexaHost}/bots/${platform}/${nativeId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": vexaKey },
        body: JSON.stringify({
          text: "Hola, soy HUELLA 📝 Esta sesión está siendo transcrita automáticamente para generar un resumen. Si no deseas participar, puedes abandonar la reunión.",
        }),
      });
    } catch {
      // El mensaje de consentimiento es best-effort; no bloqueamos si falla
    }

    return NextResponse.json({
      platform,
      nativeId,
      meetingId: data.id,
      status: data.status,
    });
  } catch (err: any) {
    console.error("Vexa /bots error:", err?.message);
    return NextResponse.json({ error: "Error de conexión con Vexa." }, { status: 502 });
  }
}
