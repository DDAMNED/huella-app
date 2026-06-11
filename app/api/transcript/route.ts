import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface VexaSegment {
  text: string;
  speaker?: string;
  absolute_start_time?: string;
  absolute_end_time?: string;
}

interface HuellaLine {
  id: number;
  speaker: string;
  spIdx: number;
  time: string;
  text: string;
}

/**
 * Convierte un timestamp ISO 8601 en formato MM:SS relativo al primero de la lista.
 */
function toRelativeTime(isoStr: string, baseMs: number): string {
  const ms = new Date(isoStr).getTime() - baseMs;
  const secs = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/**
 * Mapea segmentos de Vexa al formato LINES que espera HUELLA.
 * - Agrupa segmentos consecutivos del mismo hablante
 * - Asigna spIdx 0/1/2 rotando por hablante
 */
function mapSegmentsToLines(segments: VexaSegment[]): HuellaLine[] {
  const sorted = [...segments]
    .filter((s) => s.absolute_start_time && s.text?.trim())
    .sort((a, b) => a.absolute_start_time!.localeCompare(b.absolute_start_time!));

  if (!sorted.length) return [];

  const baseMs = new Date(sorted[0].absolute_start_time!).getTime();
  const speakerMap: Record<string, number> = {};
  let nextIdx = 0;

  // Agrupar segmentos consecutivos del mismo hablante
  const groups: { speaker: string; text: string; startTime: string }[] = [];
  for (const seg of sorted) {
    const speaker = seg.speaker || "Desconocido";
    const last = groups[groups.length - 1];
    if (last && last.speaker === speaker) {
      last.text += " " + seg.text.trim();
    } else {
      groups.push({ speaker, text: seg.text.trim(), startTime: seg.absolute_start_time! });
    }
  }

  return groups.map((g, i) => {
    if (!(g.speaker in speakerMap)) {
      speakerMap[g.speaker] = nextIdx % 3;
      nextIdx++;
    }
    return {
      id: i + 1,
      speaker: g.speaker.toUpperCase(),
      spIdx: speakerMap[g.speaker],
      time: toRelativeTime(g.startTime, baseMs),
      text: g.text,
    };
  });
}

/**
 * GET /api/transcript?platform=google_meet&nativeId=abc-defg-hij
 * Obtiene la transcripción actual de Vexa y la mapea al formato HUELLA.
 */
export async function GET(request: Request) {
  const vexaKey = process.env.VEXA_API_KEY;
  const vexaHost = process.env.VEXA_HOST ?? "https://api.cloud.vexa.ai";

  if (!vexaKey) {
    return NextResponse.json({ error: "VEXA_API_KEY no configurada." }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform");
  const nativeId = searchParams.get("nativeId");

  if (!platform || !nativeId) {
    return NextResponse.json({ error: "platform y nativeId requeridos." }, { status: 422 });
  }

  try {
    const res = await fetch(
      `${vexaHost}/transcripts/${platform}/${encodeURIComponent(nativeId)}`,
      { headers: { "X-API-Key": vexaKey } }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: data?.detail ?? "Error obteniendo transcripción." },
        { status: res.status }
      );
    }

    const data = await res.json();
    const segments: VexaSegment[] = data.segments ?? [];
    const lines = mapSegmentsToLines(segments);

    return NextResponse.json({ lines, total: lines.length });
  } catch (err: any) {
    console.error("Vexa transcript error:", err?.message);
    return NextResponse.json({ error: "Error de conexión con Vexa." }, { status: 502 });
  }
}
