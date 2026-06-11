import { useState, useRef, useEffect, useCallback, useMemo } from "react";

/* ════════════════════════════════════════════════════════════════
   HUELLA SUITE
   · Arranca en HUELLA clásico (cristal líquido)
   · Ajustes → Estilo: Cristal ⇄ Slawn (street-art)
   · PRO MAX bajo contraseña 🔒
   ════════════════════════════════════════════════════════════════ */

const PRO_PASSWORD = "1234";   // ← cambia aquí la contraseña de PRO MAX

const RED = "#FF4655";

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = x => Math.round(255 * x).toString(16).padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

const THEMES = {
  indigo:    { name:"Índigo",    p:"#2B5BFF", hi:"#5E85FF", deep:"#1838B8", sp:["#A06BFF","#00E8A2","#FF7A3D"] },
  synthwave: { name:"Synthwave", p:"#FF2BD6", hi:"#FF6BE8", deep:"#A60F8C", sp:["#00E5FF","#FFE545","#9D5CFF"] },
  matrix:    { name:"Matrix",    p:"#00E87A", hi:"#5CFFAE", deep:"#00A356", sp:["#B6FF5C","#00E5FF","#7CFFC8"] },
  solar:     { name:"Solar",     p:"#FF8A00", hi:"#FFB35C", deep:"#C26400", sp:["#FF4655","#FFE545","#FF7EB6"] },
  sakura:    { name:"Sakura",    p:"#FF7EB6", hi:"#FFA8CE", deep:"#D14E88", sp:["#C8A8FF","#8AF5C8","#FFB88A"] },
  oceano:    { name:"Océano",    p:"#00C2D9", hi:"#5CE0F0", deep:"#008CA3", sp:["#5E85FF","#00E8A2","#A8E8FF"] },
  oro:       { name:"Oro",       p:"#E9B949", hi:"#F5D77E", deep:"#B8892B", sp:["#FF9E5C","#E8E0C8","#D17A4E"] },
  fantasma:  { name:"Fantasma",  p:"#C8C8DC", hi:"#FFFFFF", deep:"#8A8AA3", sp:["#E6E6F0","#AAAAC2","#88889E"] },
  rubi:      { name:"Rubí",      p:"#FF3D5A", hi:"#FF7186", deep:"#C21834", sp:["#FF8A5C","#FF7EB6","#C86BFF"] },
};

const DEFAULTS = {
  themeKey:"indigo", customHue:230, customSat:85,
  textMode:"claro", blur:38, density:1, specular:true,
  radius:18, width:340, spacing:"normal", fontScale:1,
  showTimes:true, showAvatars:true,
  floating:true, speed:1, glow:1, waveStyle:"barras",
  caos:false,
};

const PRESETS = {
  "Sutil":   { density:0.5, blur:22, glow:0.5, radius:12, floating:false, waveStyle:"linea",  specular:false },
  "Vivo":    { density:1.3, blur:44, glow:1.7, radius:22, floating:true,  waveStyle:"barras", themeKey:"synthwave", specular:true },
  "Estudio": { density:0.9, blur:34, glow:0.7, radius:14, floating:false, waveStyle:"barras", themeKey:"fantasma" },
  "Brutal":  { density:1.8, blur:30, glow:1.2, radius:4,  floating:false, waveStyle:"barras" },
  "Cristal": { density:0.35,blur:58, glow:1.1, radius:26, floating:true,  waveStyle:"puntos", specular:true },
};

const SPACING = { compacto:0.72, normal:1, amplio:1.32 };
const GLASS_SEG  = { fino:{ density:0.55, blur:24 }, medio:{ density:1, blur:38 }, denso:{ density:1.6, blur:46 } };
const RADIUS_SEG = { nitido:8, suave:18, capsula:28 };

const DEMO_LINES = [
  { id:1, speaker:"ANA",    spIdx:0, time:"00:03", text:"Buenos días, empecemos con el avance del sprint." },
  { id:2, speaker:"CARLOS", spIdx:1, time:"00:14", text:"El módulo principal está al 80%, sin bloqueos críticos." },
  { id:3, speaker:"MARÍA",  spIdx:2, time:"00:29", text:"Necesito una hora extra el viernes para integraciones." },
  { id:4, speaker:"ANA",    spIdx:0, time:"00:43", text:"Perfecto, coordinamos con el cliente hoy mismo." },
];

const ACTAS = [
  { done:false, text:"Carlos coordina llamada con cliente hoy",        who:"CARLOS", spIdx:1 },
  { done:false, text:"María finaliza integraciones antes del viernes", who:"MARÍA",  spIdx:2 },
  { done:true,  text:"Revisión módulo principal — 80% completado",     who:"ANA",    spIdx:0 },
];

const RESUMEN_ROWS = [
  { k:"TEMA",    v:"Avance del proyecto y planificación de entrega" },
  { k:"EQUIPO",  v:"Ana · Carlos · María" },
  { k:"ACUERDO", v:"Llamada con el cliente este viernes" },
];

const LIVE_PHRASES = [
  "Analizando audio en tiempo real…",
  "Detectando hablantes…",
  "Sí, confirmo la entrega para el viernes…",
  "Generando resumen inteligente…",
];

const CHAT_SUGGESTIONS = ["¿Qué se acordó?", "¿Qué pidió María?", "Resúmelo en una frase"];


const fold = s => Array.from(s).map(c => c.normalize("NFD")[0].toLowerCase()).join("");

/* ─── paleta Slawn ───────────────────────────────────────────── */
const INK = "#101010", PAPER = "#FFFDF4";
const S_RED = "#E8302A", S_YEL = "#FFD21F", S_BLU = "#1B57E0", S_GRN = "#1FA84C", S_PNK = "#FF5CA8";
const S_SPEAKERS = [S_BLU, S_GRN, S_RED];
const WOBBLE = [
  "255px 15px 225px 15px / 15px 225px 15px 255px",
  "15px 225px 15px 255px / 255px 15px 225px 15px",
  "225px 15px 255px 15px / 15px 255px 15px 225px",
  "15px 255px 15px 225px / 225px 15px 255px 15px",
];
const canvasCard = (i = 0, rot = 0) => ({
  background:PAPER, border:`3px solid ${INK}`,
  borderRadius:WOBBLE[i % WOBBLE.length],
  boxShadow:`4px 5px 0 ${INK}`, transform:`rotate(${rot}deg)`,
});
const MARKER = "'Permanent Marker', 'Marker Felt', 'Comic Sans MS', cursive";
const HAND   = "'Patrick Hand', 'Chalkboard', 'Comic Sans MS', cursive";

/* ════════ hooks ════════ */
function useMicrophone(active) {
  const [level, setLevel] = useState(0);
  const [bands, setBands] = useState(Array(26).fill(0));
  const [isReal, setIsReal] = useState(false);
  const ctxRef = useRef(null), streamRef = useRef(null), rafRef = useRef(null);
  useEffect(() => {
    if (!active) {
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      ctxRef.current?.close().catch(() => {});
      ctxRef.current = null; streamRef.current = null;
      setLevel(0); setBands(Array(26).fill(0)); setIsReal(false);
      return;
    }
    let stopped = false;
    navigator.mediaDevices?.getUserMedia({ audio:true })
      .then(stream => {
        if (stopped) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        ctxRef.current = ctx;
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128; analyser.smoothingTimeConstant = 0.75;
        src.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        setIsReal(true);
        const tick = () => {
          analyser.getByteFrequencyData(data);
          const step = Math.floor(data.length / 26);
          const next = Array.from({ length:26 }, (_, i) => {
            let sum = 0;
            for (let j = 0; j < step; j++) sum += data[i*step + j];
            return (sum / step) / 255;
          });
          setBands(next);
          setLevel(next.reduce((a,b) => a+b, 0) / 26);
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      })
      .catch(() => {
        if (stopped) return;
        setIsReal(false);
        let t = 0;
        const sim = () => {
          t += 0.06;
          const next = Array.from({ length:26 }, (_, i) => {
            const env = Math.sin(t*3 + i*0.55) * Math.sin(t*2.1 + i*0.2);
            return Math.abs(env) * 0.55 + Math.random() * 0.12;
          });
          setBands(next);
          setLevel(next.reduce((a,b) => a+b, 0) / 26);
          rafRef.current = requestAnimationFrame(sim);
        };
        sim();
      });
    return () => {
      stopped = true;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      ctxRef.current?.close().catch(() => {});
      ctxRef.current = null; streamRef.current = null;
    };
  }, [active]);
  return { level, bands, isReal };
}

function useDrag() {
  const [pos, setPos] = useState({ x:0, y:0 });
  const posRef = useRef(pos);
  useEffect(() => { posRef.current = pos; }, [pos]);
  const onPointerDown = useCallback(e => {
    if (e.target.closest("button") || e.target.closest("input")) return;
    const startX = e.clientX, startY = e.clientY;
    const base = { ...posRef.current };
    const move = ev => setPos({ x: base.x + ev.clientX - startX, y: base.y + ev.clientY - startY });
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }, []);
  return { pos, onPointerDown };
}

/* ════════ controles glass ════════ */
function Slider({ label, value, min, max, step = 1, onChange, T, K, suffix = "", track }) {
  return (
    <div style={{ marginBottom:11 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
        <span style={{ fontSize:11, fontWeight:600, color:K.tx(0.7) }}>{label}</span>
        <span style={{ fontSize:11, fontWeight:800, color:T.hi, fontVariantNumeric:"tabular-nums" }}>
          {typeof value === "number" ? (Number.isInteger(step) ? value : value.toFixed(2)) : value}{suffix}
        </span>
      </div>
      <input type="range" className="pro-slider"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{
          width:"100%",
          background: track || `linear-gradient(to right, ${T.p} 0%, ${T.p} ${((value-min)/(max-min))*100}%, rgba(128,128,150,0.25) ${((value-min)/(max-min))*100}%, rgba(128,128,150,0.25) 100%)`,
        }}/>
    </div>
  );
}

function Toggle({ label, value, onChange, T, K }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"9px 11px", borderRadius:11, width:"100%",
      border:"1px solid rgba(128,128,150,0.15)",
      background:"transparent", cursor:"pointer", fontFamily:"inherit", marginBottom:7,
    }}>
      <span style={{ fontSize:11.5, fontWeight:600, color:K.tx(0.75) }}>{label}</span>
      <div style={{
        width:34, height:20, borderRadius:999, position:"relative", flexShrink:0,
        background: value ? `linear-gradient(145deg, ${T.hi}, ${T.p})` : "rgba(128,128,150,0.25)",
        boxShadow: value ? `0 2px 8px ${T.p}59, 0 1px 1px rgba(255,255,255,0.3) inset` : "0 1px 2px rgba(0,0,0,0.2) inset",
        transition:"background .25s",
      }}>
        <div style={{
          position:"absolute", top:2, left: value ? 16 : 2,
          width:16, height:16, borderRadius:"50%", background:"#fff",
          boxShadow:"0 1px 4px rgba(0,0,0,0.3)",
          transition:"left .25s cubic-bezier(.34,1.3,.64,1)",
        }}/>
      </div>
    </button>
  );
}

function Segment({ options, value, onChange, T, K }) {
  return (
    <div style={{ display:"flex", gap:5, marginBottom:7 }}>
      {options.map(([k,label]) => (
        <button key={k} onClick={() => onChange(k)} style={{
          flex:1, padding:"7px 0", borderRadius:10,
          border: value===k ? `1px solid ${T.p}66` : "1px solid rgba(128,128,150,0.18)",
          background: value===k ? `linear-gradient(145deg, ${T.p}38, ${T.p}1C)` : "transparent",
          color: value===k ? K.tx(0.95) : K.tx(0.45),
          fontSize:10.5, fontWeight:700, fontFamily:"inherit",
          cursor:"pointer", transition:"all .2s ease",
        }}>{label}</button>
      ))}
    </div>
  );
}

function Section({ title, open, onToggle, children, T, K }) {
  return (
    <div style={{ border:"1px solid rgba(128,128,150,0.14)", borderRadius:14, overflow:"hidden", marginBottom:8 }}>
      <button onClick={onToggle} style={{
        width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"10px 12px", border:"none", cursor:"pointer",
        background: open ? `${T.p}14` : "transparent", fontFamily:"inherit",
      }}>
        <span style={{ fontSize:10, fontWeight:800, letterSpacing:"0.18em", textTransform:"uppercase", color: open ? T.hi : K.tx(0.5) }}>{title}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={K.tx(0.5)} strokeWidth="3" strokeLinecap="round"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition:"transform .25s" }}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      {open && <div style={{ padding:"11px 12px 6px" }}>{children}</div>}
    </div>
  );
}

/* ════════ piezas glass ════════ */
function Waveform({ bands, active, T, style, glow }) {
  if (style === "linea") {
    const W = 160, H = 22;
    const pts = bands.map((v,i) => `${(i/(bands.length-1))*W},${H - 2 - (active ? v*(H-4) : 1)}`).join(" ");
    return (
      <svg width={W} height={H} style={{ display:"block" }}>
        <polyline points={pts} fill="none"
          stroke={active ? T.hi : "rgba(128,128,150,0.3)"}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ filter: active ? `drop-shadow(0 0 ${4*glow}px ${T.p})` : "none" }}/>
      </svg>
    );
  }
  if (style === "puntos") {
    return (
      <div style={{ display:"flex", alignItems:"center", gap:3.5, height:22 }}>
        {bands.map((v,i) => (
          <div key={i} style={{
            width:4, height:4, borderRadius:"50%",
            background: active ? T.hi : "rgba(128,128,150,0.3)",
            transform:`translateY(${active ? -v*8 : 0}px) scale(${active ? 0.7 + v*1.2 : 0.7})`,
            boxShadow: active && v > 0.2 ? `0 0 ${5*glow}px ${T.p}` : "none",
            transition:"transform .07s ease-out",
          }}/>
        ))}
      </div>
    );
  }
  return (
    <div style={{ display:"flex", alignItems:"center", gap:2, height:22 }}>
      {bands.map((v,i) => (
        <div key={i} style={{
          width:2, borderRadius:2,
          height: active ? 3 + v * 16 : 3,
          background: active ? `linear-gradient(to top, ${T.p}, ${T.hi})` : "rgba(128,128,150,0.3)",
          boxShadow: active && v > 0.25 ? `0 0 ${6*glow}px ${T.p}` : "none",
          transition:"height 0.07s ease-out",
        }}/>
      ))}
    </div>
  );
}

function LiveTyping({ active, K }) {
  const [phrase, setPhrase] = useState(0);
  const [chars, setChars] = useState(0);
  useEffect(() => {
    if (!active) { setChars(0); setPhrase(0); return; }
    const id = setInterval(() => {
      setChars(c => {
        if (c >= LIVE_PHRASES[phrase].length + 14) {
          setPhrase(p => (p+1) % LIVE_PHRASES.length);
          return 0;
        }
        return c + 1;
      });
    }, 55);
    return () => clearInterval(id);
  }, [active, phrase]);
  if (!active) return null;
  return (
    <div style={{ fontSize:11, color:K.tx(0.55), fontWeight:500, height:14, overflow:"hidden", fontVariantNumeric:"tabular-nums" }}>
      {LIVE_PHRASES[phrase].slice(0, chars)}
      <span style={{ display:"inline-block", width:1.5, height:11, background:"currentColor", marginLeft:1, verticalAlign:"middle", animation:"blink 0.9s step-start infinite" }}/>
    </div>
  );
}

function RecordButton({ recording, level, onToggle, T, glow }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div style={{ position:"relative", flexShrink:0, width:54, height:54 }}>
      {recording && (
        <div style={{
          position:"absolute", inset:-4 - level*10, borderRadius:"50%",
          border:`1.5px solid rgba(255,70,85,${0.3 + level*0.6})`,
          transition:"inset 0.08s ease-out", pointerEvents:"none",
        }}/>
      )}
      {recording && [0, 0.45].map((d,i) => (
        <div key={i} style={{
          position:"absolute", inset:-6, borderRadius:"50%",
          border:"1.5px solid rgba(255,70,85,0.5)",
          animation:`ring 1.6s ${d}s cubic-bezier(0,0.4,0.6,1) infinite`,
        }}/>
      ))}
      <div style={{
        position:"absolute", inset:-10, borderRadius:"50%",
        background: recording
          ? `radial-gradient(circle, rgba(255,70,85,${(0.3 + level*0.4)*glow}), transparent 70%)`
          : `radial-gradient(circle, ${T.p}59, transparent 70%)`,
        filter:"blur(8px)", transition:"background .15s ease", pointerEvents:"none",
        opacity: Math.min(1, glow),
      }}/>
      <button
        onClick={onToggle}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        aria-label={recording ? "Detener grabación" : "Iniciar grabación"}
        style={{
          position:"relative", width:54, height:54, borderRadius:"50%", border:"none",
          background: recording
            ? `linear-gradient(145deg, ${RED}, #C81E2E)`
            : `linear-gradient(145deg, ${T.hi}, ${T.p} 60%, ${T.deep})`,
          boxShadow: [
            "0 1px 1px rgba(255,255,255,0.45) inset",
            "0 -2px 4px rgba(0,0,0,0.35) inset",
            recording ? `0 4px ${24*glow}px rgba(255,70,85,0.55)` : `0 4px ${24*glow}px ${T.p}8C`,
          ].join(", "),
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer",
          transform: pressed ? "scale(0.92)" : "scale(1)",
          transition:"transform .15s cubic-bezier(.34,1.56,.64,1), background .4s ease, box-shadow .4s ease",
        }}
      >
        <div style={{
          width: recording ? 15 : 16, height: recording ? 15 : 16,
          background:"#fff", borderRadius: recording ? 4 : "50%",
          boxShadow:"0 1px 3px rgba(0,0,0,0.3)",
          transition:"border-radius .35s cubic-bezier(.34,1.56,.64,1), width .35s, height .35s",
        }}/>
      </button>
    </div>
  );
}

function TabIcon({ name, color }) {
  const s = { fill:"none", stroke:color, strokeWidth:2, strokeLinecap:"round", strokeLinejoin:"round" };
  switch (name) {
    case "live":    return <svg width="15" height="15" viewBox="0 0 24 24"><path {...s} d="M2 12h2l2-6 3 12 3-16 3 14 2-8 2 4h3"/></svg>;
    case "chat":    return <svg width="15" height="15" viewBox="0 0 24 24"><path {...s} d="M21 11.5a8.5 8.5 0 0 1-12.4 7.5L3 21l2-5.6A8.5 8.5 0 1 1 21 11.5Z"/><path {...s} strokeWidth="1.8" d="M12 8.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9Z"/></svg>;
    case "voces":   return <svg width="15" height="15" viewBox="0 0 24 24"><path {...s} d="M5 20v-7M12 20V4M19 20v-11"/></svg>;
    case "buscar":  return <svg width="15" height="15" viewBox="0 0 24 24"><circle {...s} cx="11" cy="11" r="7"/><path {...s} d="m20 20-3.5-3.5"/></svg>;
    case "actas":   return <svg width="15" height="15" viewBox="0 0 24 24"><rect {...s} x="4" y="4" width="16" height="16" rx="4"/><path {...s} d="m8.5 12 2.5 2.5 4.5-5"/></svg>;
    case "resumen": return <svg width="15" height="15" viewBox="0 0 24 24"><path {...s} d="M5 6h14M5 10h14M5 14h9M5 18h6"/></svg>;
    case "clase":   return <svg width="15" height="15" viewBox="0 0 24 24"><path {...s} d="M2 12h2l2-6 3 12 3-16 3 14 2-8 2 4h3"/></svg>;
    case "lista":   return <svg width="15" height="15" viewBox="0 0 24 24"><rect {...s} x="5" y="3" width="14" height="18" rx="3"/><path {...s} d="M9 8h6M9 12h6M9 16h4"/></svg>;
    case "participa": return <svg width="15" height="15" viewBox="0 0 24 24"><path {...s} d="M7 11V6a2 2 0 1 1 4 0v4M11 10V4.5a2 2 0 1 1 4 0V10M15 10V6a2 2 0 1 1 4 0v6c0 5-3 9-8 9-4 0-6-2-8-6l-1.5-3a1.8 1.8 0 0 1 3-2L7 12"/></svg>;
    case "timer":   return <svg width="15" height="15" viewBox="0 0 24 24"><circle {...s} cx="12" cy="13" r="8"/><path {...s} d="M12 9v4l2.5 2.5M9 2h6"/></svg>;
    case "quiz":    return <svg width="15" height="15" viewBox="0 0 24 24"><circle {...s} cx="12" cy="12" r="9"/><path {...s} d="M9.5 9.3a2.6 2.6 0 0 1 5 .9c0 1.7-2.5 2-2.5 3.6"/><circle cx="12" cy="17" r="0.9" fill={color} stroke="none"/></svg>;
    case "notas":   return <svg width="15" height="15" viewBox="0 0 24 24"><path {...s} d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>;
    default: return null;
  }
}

function Tabs({ tabs, tab, setTab, T, K, glow }) {
  return (
    <div style={{ ...K.glass(0.07), borderRadius:999, padding:4, display:"flex", gap:3 }}>
      {tabs.map(({ k, label }) => {
        const active = tab === k;
        return (
          <button key={k} onClick={() => setTab(k)} aria-label={label} style={{
            display:"flex", alignItems:"center", justifyContent:"center", gap:6,
            height:36, borderRadius:999, border:"none", cursor:"pointer",
            fontFamily:"inherit", overflow:"hidden",
            flex: active ? "1 1 auto" : "0 0 36px",
            padding: active ? "0 10px" : 0,
            background: active ? `linear-gradient(145deg, ${T.hi}, ${T.p})` : "transparent",
            boxShadow: active
              ? ["0 1px 1px rgba(255,255,255,0.4) inset","0 -1px 2px rgba(0,0,0,0.3) inset",`0 3px ${14*glow}px ${T.p}80`].join(", ")
              : "none",
            transition:"all .32s cubic-bezier(.34,1.2,.64,1)",
          }}>
            <span style={{ flexShrink:0, display:"flex" }}><TabIcon name={k} color={active ? "#fff" : K.tx(0.45)}/></span>
            <span style={{
              maxWidth: active ? 80 : 0, opacity: active ? 1 : 0,
              overflow:"hidden", whiteSpace:"nowrap",
              color:"#fff", fontSize:11.5, fontWeight:700,
              transition:"max-width .32s cubic-bezier(.34,1.2,.64,1), opacity .25s",
            }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ════════ pestañas PRO ════════ */
function VocesTab({ T, K, r, fz, sp, glow, lines }) {
  const stats = useMemo(() => {
    const by = {};
    lines.forEach(l => {
      const w = l.text.trim().split(/\s+/).length;
      if (!by[l.speaker]) by[l.speaker] = { words:0, turns:0, spIdx:l.spIdx };
      by[l.speaker].words += w; by[l.speaker].turns += 1;
    });
    const total = Object.values(by).reduce((a,b) => a + b.words, 0);
    return Object.entries(by)
      .map(([name, d]) => ({ name, ...d, pct: Math.round((d.words/total)*100) }))
      .sort((a,b) => b.pct - a.pct);
  }, []);
  const [grown, setGrown] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGrown(true), 80); return () => clearTimeout(t); }, []);
  const totalWords = stats.reduce((a,s) => a + s.words, 0);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:sp(8) }}>
      <div style={{ ...K.glass(0.06), borderRadius:r(16), padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:10, fontWeight:800, letterSpacing:"0.16em", textTransform:"uppercase", color:K.tx(0.4) }}>Reparto de la palabra</span>
        <span style={{ fontSize:11, fontWeight:700, color:K.tx(0.6), fontVariantNumeric:"tabular-nums" }}>{totalWords} palabras</span>
      </div>
      {stats.map((s, i) => {
        const col = T.sp[s.spIdx];
        return (
          <div key={s.name} style={{
            ...K.glass(0.085), borderRadius:r(18), padding:`${sp(13)}px ${sp(15)}px`,
            animation:`rise .45s ${i*0.07}s cubic-bezier(.2,.8,.3,1) both`,
            position:"relative", overflow:"hidden",
          }}>
            <div style={{
              position:"absolute", left:-30, top:"50%", transform:"translateY(-50%)",
              width:100, height:100, borderRadius:"50%",
              background:col, opacity:0.10, filter:"blur(32px)", pointerEvents:"none",
            }}/>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
                  style={{ filter:`drop-shadow(0 0 ${5*glow}px ${col}88)` }}>
                  <circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>
                </svg>
                <span style={{ color:`${col}dd`, fontSize:fz(11), fontWeight:800, letterSpacing:"0.12em" }}>{s.name}</span>
                {i === 0 && (
                  <span style={{
                    fontSize:8.5, fontWeight:900, letterSpacing:"0.1em", color:"#fff",
                    background:`linear-gradient(145deg, ${col}, ${col}aa)`,
                    borderRadius:999, padding:"2px 7px", boxShadow:`0 2px ${8*glow}px ${col}59`,
                  }}>LÍDER</span>
                )}
              </div>
              <span style={{ color:K.tx(0.95), fontSize:fz(16), fontWeight:900, fontVariantNumeric:"tabular-nums" }}>
                {s.pct}<span style={{ fontSize:10, fontWeight:700, color:K.tx(0.4) }}>%</span>
              </span>
            </div>
            <div style={{ height:7, borderRadius:4, background:"rgba(128,128,150,0.16)", overflow:"hidden", marginBottom:7 }}>
              <div style={{
                height:"100%", borderRadius:4,
                width: grown ? `${s.pct}%` : "0%",
                background:`linear-gradient(90deg, ${col}, ${col}88)`,
                boxShadow:`0 0 ${8*glow}px ${col}66`,
                transition:`width .9s ${0.15 + i*0.12}s cubic-bezier(.2,.8,.3,1)`,
              }}/>
            </div>
            <div style={{ display:"flex", gap:14 }}>
              <span style={{ fontSize:10.5, color:K.tx(0.45) }}><b style={{ color:K.tx(0.75) }}>{s.turns}</b> intervenciones</span>
              <span style={{ fontSize:10.5, color:K.tx(0.45) }}><b style={{ color:K.tx(0.75) }}>{s.words}</b> palabras</span>
              <span style={{ fontSize:10.5, color:K.tx(0.45) }}><b style={{ color:K.tx(0.75) }}>{Math.round(s.words/s.turns)}</b> por turno</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function highlightText(text, q, col) {
  if (!q.trim()) return text;
  const f = fold(text), fq = fold(q.trim());
  const out = []; let i = 0, key = 0;
  while (true) {
    const idx = f.indexOf(fq, i);
    if (idx === -1) { out.push(text.slice(i)); break; }
    if (idx > i) out.push(text.slice(i, idx));
    out.push(<mark key={key++} style={{ background:`${col}40`, color:"inherit", borderRadius:4, padding:"0 2px", boxShadow:`0 0 0 1px ${col}59` }}>{text.slice(idx, idx + fq.length)}</mark>);
    i = idx + fq.length;
  }
  return out;
}

function BuscarTab({ T, K, r, fz, sp, query, setQuery, who, setWho, lines }) {
  const speakers = ["TODOS", ...new Set(lines.map(l => l.speaker))];
  const results = lines.filter(l => {
    const okWho = who === "TODOS" || l.speaker === who;
    const okQ = !query.trim() || fold(l.text).includes(fold(query.trim())) || fold(l.speaker).includes(fold(query.trim()));
    return okWho && okQ;
  });
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:sp(8) }}>
      <div style={{ ...K.glass(0.09), borderRadius:r(16), padding:"10px 14px", display:"flex", alignItems:"center", gap:10 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={K.tx(0.4)} strokeWidth="2.2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
        </svg>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar en la transcripción…"
          style={{ flex:1, background:"transparent", border:"none", outline:"none", color:K.tx(0.92), fontSize:fz(13), fontFamily:"inherit" }}/>
        {query && (
          <button onClick={() => setQuery("")} aria-label="Limpiar" style={{
            border:"none", background:"rgba(128,128,150,0.2)", borderRadius:"50%",
            width:18, height:18, cursor:"pointer", color:K.tx(0.6),
            fontSize:11, lineHeight:1, display:"flex", alignItems:"center", justifyContent:"center",
          }}>×</button>
        )}
      </div>
      <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
        {speakers.map(name => {
          const active = who === name;
          const col = name === "TODOS" ? T.p : T.sp[lines.find(l => l.speaker === name)?.spIdx ?? 0];
          return (
            <button key={name} onClick={() => setWho(name)} style={{
              padding:"5px 11px", borderRadius:999,
              border: active ? `1px solid ${col}88` : "1px solid rgba(128,128,150,0.2)",
              background: active ? `${col}26` : "transparent",
              color: active ? K.tx(0.95) : K.tx(0.45),
              fontSize:10, fontWeight:800, letterSpacing:"0.08em",
              fontFamily:"inherit", cursor:"pointer", transition:"all .18s",
            }}>{name}</button>
          );
        })}
        <span style={{ marginLeft:"auto", alignSelf:"center", fontSize:10.5, color:K.tx(0.4), fontVariantNumeric:"tabular-nums" }}>
          {results.length} resultado{results.length !== 1 ? "s" : ""}
        </span>
      </div>
      {results.length === 0 ? (
        <div style={{ ...K.glass(0.05), borderRadius:r(16), padding:"22px 16px", textAlign:"center" }}>
          <div style={{ fontSize:20, marginBottom:6 }}>🫧</div>
          <div style={{ fontSize:12, color:K.tx(0.5) }}>Sin coincidencias{query ? ` para “${query}”` : ""}</div>
        </div>
      ) : results.map((line, i) => {
        const col = T.sp[line.spIdx];
        return (
          <div key={line.id} style={{
            ...K.glass(0.085), borderRadius:r(18), padding:"11px 14px",
            animation:`rise .35s ${i*0.05}s cubic-bezier(.2,.8,.3,1) both`,
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
              <span style={{ color:`${col}cc`, fontSize:fz(10), fontWeight:700, letterSpacing:"0.14em" }}>
                {highlightText(line.speaker, query, col)}
              </span>
              <span style={{ color:K.tx(0.32), fontSize:10, fontVariantNumeric:"tabular-nums" }}>{line.time}</span>
            </div>
            <p style={{ color:K.tx(0.88), fontSize:fz(13), lineHeight:1.5, margin:0 }}>
              {highlightText(line.text, query, col)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function ChatTab({ T, K, r, fz, sp, glow, msgs, input, setInput, loading, onSend }) {
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, loading]);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:sp(8) }}>
      <div ref={scrollRef} className="pro-panel" style={{
        ...K.glass(0.06), borderRadius:r(20), padding:"12px",
        height:220, overflowY:"auto", display:"flex", flexDirection:"column", gap:8,
      }}>
        {msgs.length === 0 && !loading && (
          <div style={{ margin:"auto", textAlign:"center", padding:"0 14px" }}>
            <div style={{
              width:40, height:40, borderRadius:"50%", margin:"0 auto 10px",
              background:`linear-gradient(145deg, ${T.hi}, ${T.p})`,
              boxShadow:`0 1px 1px rgba(255,255,255,0.4) inset, 0 4px ${16*glow}px ${T.p}66`,
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l1.5 3.8L17 8.3l-3.5 1.5L12 13.5l-1.5-3.7L7 8.3l3.5-1.5Z"/>
                <path d="M18 14l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8Z"/>
              </svg>
            </div>
            <div style={{ fontSize:fz(13), fontWeight:700, color:K.tx(0.8), marginBottom:4 }}>Pregúntale a la reunión</div>
            <div style={{ fontSize:11, color:K.tx(0.45), lineHeight:1.5 }}>La IA responde usando solo lo que se dijo en la transcripción.</div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth:"85%", animation:"rise .3s ease both" }}>
            <div style={{
              padding:"9px 12px",
              borderRadius: m.role === "user" ? `${r(16)}px ${r(16)}px ${r(5)}px ${r(16)}px` : `${r(16)}px ${r(16)}px ${r(16)}px ${r(5)}px`,
              background: m.role === "user" ? `linear-gradient(145deg, ${T.hi}, ${T.p})` : undefined,
              ...(m.role === "assistant" ? K.glass(0.10) : {}),
              boxShadow: m.role === "user" ? `0 1px 1px rgba(255,255,255,0.35) inset, 0 3px ${12*glow}px ${T.p}59` : undefined,
              color: m.role === "user" ? "#fff" : K.tx(0.88),
              fontSize:fz(12.5), lineHeight:1.5, whiteSpace:"pre-wrap",
            }}>{m.text}</div>
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf:"flex-start", ...K.glass(0.10), borderRadius:r(16), padding:"10px 14px", display:"flex", gap:4 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width:5, height:5, borderRadius:"50%", background:T.hi, animation:`blink 1.1s ${i*0.18}s ease infinite` }}/>
            ))}
          </div>
        )}
      </div>
      {msgs.length === 0 && (
        <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
          {CHAT_SUGGESTIONS.map(q => (
            <button key={q} onClick={() => onSend(q)} disabled={loading} style={{
              padding:"6px 11px", borderRadius:999,
              border:`1px solid ${T.p}4D`, background:`${T.p}14`,
              color:K.tx(0.7), fontSize:10.5, fontWeight:600,
              fontFamily:"inherit", cursor:"pointer",
            }}>{q}</button>
          ))}
        </div>
      )}
      <div style={{ ...K.glass(0.09), borderRadius:999, padding:"6px 6px 6px 16px", display:"flex", alignItems:"center", gap:8 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") onSend(); }}
          placeholder="Escribe tu pregunta…" disabled={loading}
          style={{ flex:1, background:"transparent", border:"none", outline:"none", color:K.tx(0.92), fontSize:fz(13), fontFamily:"inherit" }}/>
        <button onClick={() => onSend()} disabled={loading || !input.trim()} aria-label="Enviar" style={{
          width:34, height:34, borderRadius:"50%", border:"none", flexShrink:0,
          background: input.trim() && !loading ? `linear-gradient(145deg, ${T.hi}, ${T.p})` : "rgba(128,128,150,0.2)",
          boxShadow: input.trim() && !loading ? `0 1px 1px rgba(255,255,255,0.4) inset, 0 3px ${12*glow}px ${T.p}66` : "none",
          cursor: input.trim() && !loading ? "pointer" : "default",
          display:"flex", alignItems:"center", justifyContent:"center", transition:"all .2s",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ════════ piezas Slawn ════════ */
function Drip({ color, left, w = 10 }) {
  return (
    <svg width={w} height={26} viewBox="0 0 10 26" style={{ position:"absolute", bottom:-24, left, zIndex:2 }}>
      <path d="M5 0 C5 0 7 6 7 11 C7 16 6.5 18 6.5 21 A1.8 1.8 0 1 1 3 21 C3 17 3.5 14 3.5 10 C3.5 5 5 0 5 0 Z" fill={color} stroke={INK} strokeWidth="1.4"/>
    </svg>
  );
}

function ScrawlFace({ color, seed = 0, talking = false, size = 38 }) {
  const eyeL = [ [9,13,3.6,4.8], [8,12,4.4,3.4], [10,14,3,5] ][seed % 3];
  const eyeR = [ [24,12,4.6,3.8], [25,14,3.2,4.6], [23,11,5,3.4] ][seed % 3];
  const mouths = ["M10 26 Q17 31 26 25","M11 27 Q17 23 25 28","M10 26 L16 28 L21 25 L26 27"];
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" style={{ overflow:"visible" }}>
      <ellipse cx="18.5" cy="16" rx="15" ry="14" fill={color}/>
      <path d="M17 2 C26 1 32 8 31 17 C30.5 26 25 32 16 31.5 C8 31 2.5 25 3 16 C3.5 8 9 3 17 2 Z"
        fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round"/>
      <ellipse cx={eyeL[0]} cy={eyeL[1]} rx={eyeL[2]} ry={eyeL[3]} fill="#fff" stroke={INK} strokeWidth="2"/>
      <ellipse cx={eyeR[0]} cy={eyeR[1]} rx={eyeR[2]} ry={eyeR[3]} fill="#fff" stroke={INK} strokeWidth="2"/>
      <circle cx={eyeL[0]+1} cy={eyeL[1]+1} r="1.6" fill={INK}/>
      <circle cx={eyeR[0]-1} cy={eyeR[1]+0.5} r="1.6" fill={INK}/>
      {talking
        ? <ellipse cx="18" cy="26" rx="4.5" ry="3.4" fill={INK}/>
        : <path d={mouths[seed % 3]} fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round"/>}
    </svg>
  );
}

function Doodle({ type, style }) {
  const st = { fill:"none", stroke:INK, strokeWidth:2.4, strokeLinecap:"round", strokeLinejoin:"round" };
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" style={{ position:"absolute", pointerEvents:"none", ...style }}>
      {type === "star" && <path d="M15 3 L17.5 11 L26 11.5 L19 16.5 L21.5 25 L15 19.8 L8.5 25 L11 16.5 L4 11.5 L12.5 11 Z" {...st} fill={S_YEL}/>}
      {type === "spiral" && <path d="M15 15 C15 12 18 12 18 15 C18 19 12 19 12 14 C12 8 21 8 21 15 C21 23 9 23 9 13" {...st}/>}
      {type === "cross" && <><path d="M8 8 L22 22" {...st}/><path d="M22 8 L8 22" {...st}/></>}
      {type === "zap" && <path d="M17 2 L8 16 L14 16 L11 28 L23 12 L16 12 Z" {...st} fill={S_PNK}/>}
      {type === "arrow" && <path d="M4 24 C10 20 18 12 24 7 M24 7 L17 8 M24 7 L23 14" {...st}/>}
      {type === "heart" && <path d="M15 25 C8 19 4 14 7 9 C9 6 13 7 15 11 C17 7 21 6 23 9 C26 14 22 19 15 25 Z" {...st} fill={S_RED}/>}
    </svg>
  );
}

function MarkerUnderline({ color = S_YEL, width = 120 }) {
  return (
    <svg width={width} height="10" viewBox={`0 0 ${width} 10`} style={{ display:"block", marginTop:-2 }}>
      <path d={`M3 6 Q ${width*0.3} 2 ${width*0.55} 6 T ${width-4} 5`} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" opacity="0.9"/>
    </svg>
  );
}

/* botón segment slawn */
function SlawnSeg({ options, value, onChange }) {
  return (
    <div style={{ display:"flex", gap:8 }}>
      {options.map(([k, label, col], i) => (
        <button key={k} onClick={() => onChange(k)} style={{
          flex:1, padding:"7px 0", fontFamily:MARKER, fontSize:12,
          background: value===k ? col : PAPER,
          color: value===k ? "#fff" : INK,
          border:`3px solid ${INK}`,
          borderRadius:WOBBLE[(i+1) % WOBBLE.length],
          boxShadow: value===k ? `3px 4px 0 ${INK}` : `2px 2px 0 ${INK}`,
          cursor:"pointer",
          transform: value===k ? "rotate(-1.5deg) translateY(-2px)" : `rotate(${(i-0.5)*1.4}deg)`,
          transition:"all .15s ease",
        }}>{label}</button>
      ))}
    </div>
  );
}

/* ════════ MODAL CONTRASEÑA ════════ */
function PasswordModal({ skin, T, K, onClose, onSuccess }) {
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const trySubmit = () => {
    if (pwd === PRO_PASSWORD) onSuccess();
    else { setError(true); setPwd(""); setTimeout(() => setError(false), 700); }
  };

  const slawn = skin === "slawn";

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:50,
      background:"rgba(0,0,0,0.45)",
      backdropFilter:"blur(6px)", WebkitBackdropFilter:"blur(6px)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:24,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width:280, padding:"22px 20px",
        animation: error ? "shakeX .45s ease" : "pop .3s cubic-bezier(.34,1.4,.64,1) both",
        ...(slawn
          ? { ...canvasCard(1, -1.5), fontFamily:HAND }
          : { ...K.glass(0.14), borderRadius:24 }),
        position:"relative",
      }}>
        {slawn && <Drip color={S_RED} left={40}/>}
        {/* candado */}
        <div style={{
          width:46, height:46, margin:"0 auto 12px",
          display:"flex", alignItems:"center", justifyContent:"center",
          ...(slawn
            ? { background:S_YEL, border:`3px solid ${INK}`, borderRadius:WOBBLE[2], boxShadow:`3px 3px 0 ${INK}` }
            : {
                borderRadius:"50%",
                background:`linear-gradient(145deg, ${T.hi}, ${T.p})`,
                boxShadow:`0 1px 1px rgba(255,255,255,0.4) inset, 0 4px 18px ${T.p}66`,
              }),
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke={slawn ? INK : "#fff"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="11" width="14" height="9" rx="2.5"/>
            <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
          </svg>
        </div>
        <div style={{
          textAlign:"center", marginBottom:4,
          fontFamily: slawn ? MARKER : "inherit",
          fontSize: slawn ? 18 : 15, fontWeight: slawn ? 400 : 800,
          color: slawn ? INK : K.tx(0.95),
        }}>HUELLA PRO MAX</div>
        <div style={{
          textAlign:"center", marginBottom:14,
          fontSize: slawn ? 13 : 11.5,
          color: slawn ? INK : K.tx(0.5),
          opacity: slawn ? 0.65 : 1,
        }}>Introduce la contraseña para entrar</div>

        <input
          ref={inputRef}
          type="password"
          value={pwd}
          onChange={e => setPwd(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") trySubmit(); }}
          placeholder="••••"
          style={{
            width:"100%", boxSizing:"border-box",
            padding:"10px 14px", marginBottom:10,
            textAlign:"center", letterSpacing:"0.3em",
            fontSize:15, fontFamily:"inherit", outline:"none",
            ...(slawn
              ? { background:"#fff", border:`3px solid ${error ? S_RED : INK}`, borderRadius:WOBBLE[0], color:INK }
              : {
                  background:"rgba(128,128,150,0.12)",
                  border:`1px solid ${error ? RED : "rgba(128,128,150,0.3)"}`,
                  borderRadius:14, color:K.tx(0.95),
                }),
            transition:"border-color .2s",
          }}/>
        {error && (
          <div style={{
            textAlign:"center", fontSize:11, marginBottom:8, fontWeight:700,
            color: slawn ? S_RED : RED,
            fontFamily: slawn ? MARKER : "inherit",
          }}>contraseña incorrecta</div>
        )}

        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onClose} style={{
            flex:1, padding:"10px 0", cursor:"pointer", fontFamily: slawn ? MARKER : "inherit",
            fontSize:12, fontWeight:700,
            ...(slawn
              ? { background:PAPER, color:INK, border:`3px solid ${INK}`, borderRadius:WOBBLE[3], boxShadow:`2px 2px 0 ${INK}` }
              : { background:"transparent", color:K.tx(0.55), border:"1px solid rgba(128,128,150,0.25)", borderRadius:13 }),
          }}>Cancelar</button>
          <button onClick={trySubmit} style={{
            flex:1.3, padding:"10px 0", cursor:"pointer", fontFamily: slawn ? MARKER : "inherit",
            fontSize:12, fontWeight:800, color:"#fff", border:"none",
            ...(slawn
              ? { background:S_BLU, border:`3px solid ${INK}`, borderRadius:WOBBLE[1], boxShadow:`3px 3px 0 ${INK}` }
              : {
                  background:`linear-gradient(145deg, ${T.hi}, ${T.p})`,
                  borderRadius:13,
                  boxShadow:`0 1px 1px rgba(255,255,255,0.4) inset, 0 4px 16px ${T.p}66`,
                }),
          }}>Desbloquear 🔓</button>
        </div>
      </div>
    </div>
  );
}

/* ════════ WIDGET SLAWN (clásico, skin street-art) ════════ */
function SlawnWidget({ shared, openSettings, settingsOpen, skin, setSkin, caos, setCaos, askPro, proUnlocked, enterPro, enterProfesor }) {
  const { recording, setRecording, sec, fmt, bands, level, isReal, pos, onPointerDown, handleExport, copied, minimize, toggleRecording, lines, meetingUrl, setMeetingUrl, transcriptCtx } = shared;
  const [tab, setTab] = useState("live");
  const [visible, setVisible] = useState(0);
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => { i+=1; setVisible(i); if (i >= lines.length) clearInterval(id); }, 180);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      width:332, display:"flex", flexDirection:"column", gap:16,
      position:"relative", zIndex:2,
      transform:`translate(${pos.x}px, ${pos.y}px)`,
      fontFamily:HAND,
    }}>
      <Doodle type="star"   style={{ top:-18, right:-14, transform:"rotate(15deg)" }}/>
      <Doodle type="zap"    style={{ bottom:120, left:-26, transform:"rotate(-10deg)" }}/>
      <Doodle type="spiral" style={{ top:160, right:-26 }}/>
      {caos && <>
        <Doodle type="cross" style={{ bottom:-10, right:30, transform:"scale(.7)" }}/>
        <Doodle type="arrow" style={{ top:58, left:-30, transform:"rotate(20deg)" }}/>
        <Doodle type="heart" style={{ top:260, left:-24, transform:"rotate(-12deg) scale(.8)" }}/>
        <Doodle type="star"  style={{ bottom:60, right:-22, transform:"rotate(-20deg) scale(.65)" }}/>
      </>}

      {/* título */}
      <div onPointerDown={onPointerDown} style={{
        cursor:"grab", touchAction:"none", userSelect:"none",
        display:"flex", alignItems:"center", justifyContent:"space-between",
      }}>
        <div>
          <div style={{
            fontFamily:MARKER, fontSize:40, color:INK, lineHeight:1,
            transform:"rotate(-2deg)", textShadow:`3px 3px 0 ${S_YEL}`,
          }}>HUELLA</div>
          <MarkerUnderline color={S_RED} width={150}/>
          <div style={{ fontSize:14, color:INK, opacity:0.65, marginTop:2, transform:"rotate(-1deg)" }}>
            {recording ? (isReal ? "✏ escuchándote de verdad" : "✏ grabando (demo)") : "✏ lista para garabatear"}
          </div>
        </div>
        <div style={{ display:"flex", gap:8, flexShrink:0 }}>
          <button onClick={minimize} aria-label="Minimizar" style={{
            ...canvasCard(0, -3), width:38, height:38,
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", fontFamily:MARKER, fontSize:18, color:INK,
          }}>—</button>
          <button onClick={openSettings} aria-label="Ajustes" style={{
            ...canvasCard(2, 4), width:38, height:38,
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer",
            background: settingsOpen ? S_YEL : PAPER,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>
            </svg>
          </button>
        </div>
      </div>

      {/* AJUSTES slawn */}
      {settingsOpen && (
        <div style={{ ...canvasCard(3, 0.8), padding:"14px 14px 18px", position:"relative", animation:"plop .35s ease both", "--rot":"0.8deg" }}>
          <Drip color={S_GRN} left={50} w={8}/>
          <div style={{ fontFamily:MARKER, fontSize:13, color:INK, marginBottom:8, transform:"rotate(-1deg)" }}>ESTILO →</div>
          <SlawnSeg value={skin} onChange={setSkin}
            options={[["cristal","CRISTAL",S_BLU],["slawn","SLAWN",S_PNK]]}/>
          <div style={{ height:12 }}/>
          <button onClick={() => setCaos(!caos)} style={{
            width:"100%", padding:"8px 12px",
            display:"flex", alignItems:"center", justifyContent:"space-between",
            background:PAPER, border:`3px solid ${INK}`,
            borderRadius:WOBBLE[0], boxShadow:`2px 2px 0 ${INK}`,
            cursor:"pointer", fontFamily:HAND, fontSize:14, color:INK,
          }}>
            <span>+ caos (más garabatos)</span>
            <span style={{ fontFamily:MARKER, fontSize:13, color: caos ? S_GRN : INK, opacity: caos ? 1 : 0.4 }}>
              {caos ? "SÍ!!" : "no"}
            </span>
          </button>
          <div style={{ height:12 }}/>
          {/* modo profesor slawn */}
          <button onClick={enterProfesor} style={{
            width:"100%", padding:"9px 12px",
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            background:S_GRN, color:"#fff", border:`3px solid ${INK}`,
            borderRadius:WOBBLE[0], boxShadow:`3px 3px 0 ${INK}`,
            cursor:"pointer", fontFamily:MARKER, fontSize:13,
          }}>
            🎓 MODO PROFESOR
          </button>
          <div style={{ height:12 }}/>
          {/* PRO lock */}
          <button onClick={() => proUnlocked ? enterPro() : askPro()} style={{
            width:"100%", padding:"9px 12px",
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            background:INK, color:PAPER, border:`3px solid ${INK}`,
            borderRadius:WOBBLE[2], boxShadow:`3px 3px 0 ${S_YEL}`,
            cursor:"pointer", fontFamily:MARKER, fontSize:13,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={PAPER} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              {proUnlocked
                ? <><rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/></>
                : <><rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></>}
            </svg>
            {proUnlocked ? "ENTRAR A PRO MAX" : "PRO MAX 🔒"}
          </button>
        </div>
      )}

      {/* tarjeta grabación */}
      <div style={{
        ...canvasCard(0, -0.8), padding:"16px 16px 18px",
        display:"flex", alignItems:"center", gap:14, position:"relative",
        animation:"plop .4s ease both", "--rot":"-0.8deg",
      }}>
        <Drip color={recording ? S_RED : S_BLU} left={36}/>
        <Drip color={S_YEL} left={250} w={8}/>
        <button onClick={toggleRecording} aria-label={recording ? "Detener" : "Grabar"} style={{
          width:64, height:64, flexShrink:0,
          background:"transparent", border:"none", cursor:"pointer",
          animation: recording ? "shake .4s ease infinite" : "none",
          transform:`scale(${1 + level*0.25})`,
          transition:"transform .1s ease-out",
        }}>
          <ScrawlFace color={recording ? S_RED : S_YEL} seed={0} talking={recording} size={64}/>
        </button>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:MARKER, fontSize:17, color:INK, marginBottom:6, display:"flex", alignItems:"center", gap:8 }}>
            {recording ? "¡HABLA!" : "dale a la carita"}
            {recording && (
              <span style={{
                fontFamily:HAND, fontSize:13, fontWeight:700,
                background:S_RED, color:"#fff", border:`2px solid ${INK}`,
                borderRadius:"60% 40% 55% 45% / 45% 55% 40% 60%",
                padding:"1px 9px", display:"inline-block", transform:"rotate(2deg)",
              }}>{fmt(sec)}</span>
            )}
          </div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:2.5, height:24 }}>
            {bands.slice(0,22).map((v,i) => (
              <div key={i} style={{
                width:3.5,
                height: recording ? 4 + v*19 : 4,
                background: recording ? [S_BLU,S_RED,S_GRN,S_YEL,S_PNK][i % 5] : "#D9D4C2",
                border:`1.5px solid ${INK}`, borderRadius:2,
                transition:"height .07s ease-out",
              }}/>
            ))}
          </div>
          {!recording && (
            <input value={meetingUrl} onChange={e => setMeetingUrl(e.target.value)}
              placeholder="Enlace Meet o Teams (opcional)"
              style={{ marginTop:8, width:"100%", boxSizing:"border-box", padding:"6px 10px",
                background:"#fff", border:`2px solid ${INK}`,
                borderRadius:"8px", fontSize:13, fontFamily:HAND, color:INK, outline:"none" }}/>
          )}
        </div>
      </div>

      {/* tabs pegatinas */}
      <div style={{ display:"flex", gap:8, paddingLeft:4 }}>
        {[["live","EN VIVO",S_BLU],["actas","ACTAS",S_GRN],["resumen","RESUMEN",S_PNK]].map(([k,label,col],i) => (
          <button key={k} onClick={() => setTab(k)} style={{
            flex:1, padding:"8px 0", fontFamily:MARKER, fontSize:13,
            background: tab===k ? col : PAPER,
            color: tab===k ? "#fff" : INK,
            border:`3px solid ${INK}`,
            borderRadius:WOBBLE[(i+1) % WOBBLE.length],
            boxShadow: tab===k ? `3px 4px 0 ${INK}` : `2px 2px 0 ${INK}`,
            cursor:"pointer",
            transform: tab===k ? "rotate(-1.5deg) translateY(-2px)" : `rotate(${(i-1)*1.2}deg)`,
            transition:"all .15s ease",
          }}>{label}</button>
        ))}
      </div>

      {/* contenidos */}
      {tab === "live" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {lines.slice(0, visible).map((line, i) => {
            const col = S_SPEAKERS[line.spIdx];
            const rot = [(-1),(1.2),(-0.6),(0.9)][i % 4];
            return (
              <div key={line.id} style={{
                ...canvasCard(i, rot), padding:"12px 14px",
                display:"flex", gap:12, alignItems:"flex-start", position:"relative",
                animation:`plop .4s ${i*0.07}s ease both${caos ? ", wiggle 3s ease-in-out infinite" : ""}`,
                "--rot":`${rot}deg`,
              }}>
                {i % 2 === 0 && <Drip color={col} left={20 + i*40} w={8}/>}
                <div style={{ flexShrink:0, transform:`rotate(${rot*-2}deg)` }}>
                  <ScrawlFace color={col} seed={line.spIdx} size={42}/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:2 }}>
                    <span style={{
                      fontFamily:MARKER, fontSize:12, color:"#fff",
                      background:col, border:`2px solid ${INK}`,
                      padding:"0px 8px",
                      borderRadius:"55% 45% 60% 40% / 45% 60% 40% 55%",
                      display:"inline-block", transform:"rotate(-1deg)",
                    }}>{line.speaker}</span>
                    <span style={{ fontSize:12, color:INK, opacity:0.5 }}>{line.time}</span>
                  </div>
                  <p style={{ color:INK, fontSize:15.5, lineHeight:1.35, margin:"4px 0 0" }}>{line.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "actas" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {ACTAS.map((item, i) => {
            const col = S_SPEAKERS[item.spIdx];
            const rot = [(-0.8),(1),(-1.2)][i % 3];
            return (
              <div key={i} style={{
                ...canvasCard(i+1, rot), padding:"12px 14px",
                display:"flex", gap:12, alignItems:"center",
                animation:`plop .4s ${i*0.07}s ease both`, "--rot":`${rot}deg`,
                opacity: item.done ? 0.8 : 1, position:"relative",
              }}>
                <svg width="30" height="30" viewBox="0 0 30 30" style={{ flexShrink:0 }}>
                  <path d="M5 6 C12 4 20 4.5 25 6 C26.5 12 26 20 25 25 C18 26.5 11 26 5.5 25 C4 19 4.5 11 5 6 Z"
                    fill={item.done ? col : PAPER} stroke={INK} strokeWidth="2.4" strokeLinejoin="round"/>
                  {item.done && <path d="M8 15 L13 21 L24 7" fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round"/>}
                </svg>
                <div style={{ flex:1 }}>
                  <div style={{
                    color:INK, fontSize:15, lineHeight:1.3,
                    textDecoration: item.done ? "line-through" : "none",
                    textDecorationThickness:"2.5px", textDecorationColor:S_RED,
                  }}>{item.text}</div>
                  <div style={{ fontFamily:MARKER, fontSize:10, color:col, marginTop:2 }}>{item.who}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "resumen" && (
        <div style={{ ...canvasCard(2, 0.6), padding:"16px", animation:"plop .4s ease both", "--rot":"0.6deg", position:"relative" }}>
          <Drip color={S_PNK} left={60} w={8}/>
          <div style={{ display:"flex", gap:10, marginBottom:14, justifyContent:"center" }}>
            {[["4","voces",S_BLU],["1:02","min",S_YEL],["3","tareas",S_GRN]].map(([n,l,col],i) => (
              <div key={l} style={{
                flex:1, textAlign:"center",
                background:col, border:`3px solid ${INK}`,
                borderRadius:WOBBLE[i % WOBBLE.length],
                boxShadow:`3px 3px 0 ${INK}`, padding:"10px 4px",
                transform:`rotate(${(i-1)*2}deg)`,
              }}>
                <div style={{ fontFamily:MARKER, fontSize:24, color: col===S_YEL ? INK : "#fff", lineHeight:1 }}>{n}</div>
                <div style={{ fontSize:12, color: col===S_YEL ? INK : "#fff", fontWeight:700 }}>{l}</div>
              </div>
            ))}
          </div>
          {[
            { k:"TEMA",   v:"avance del proyecto y entrega",   col:S_BLU },
            { k:"EQUIPO", v:"Ana · Carlos · María",            col:S_GRN },
            { k:"TRATO",  v:"llamada con cliente el viernes",  col:S_RED },
          ].map(row => (
            <div key={row.k} style={{ display:"flex", gap:10, alignItems:"baseline", padding:"7px 0" }}>
              <span style={{ fontFamily:MARKER, fontSize:11, color:row.col, flexShrink:0, width:60, transform:"rotate(-1deg)", display:"inline-block" }}>{row.k} →</span>
              <span style={{ color:INK, fontSize:15 }}>{row.v}</span>
            </div>
          ))}
        </div>
      )}

      {/* exportar */}
      <button onClick={handleExport} style={{
        ...canvasCard(1, copied ? 1 : -1),
        padding:"13px 0", width:"100%",
        background: copied ? S_GRN : INK,
        color: copied ? "#fff" : PAPER,
        fontFamily:MARKER, fontSize:16, cursor:"pointer", position:"relative",
        transition:"all .2s ease",
        animation:"plop .4s .15s ease both", "--rot": copied ? "1deg" : "-1deg",
      }}>
        {copied ? "¡COPIADO! ✓" : "EXPORTAR ESTO →"}
        <Drip color={copied ? S_GRN : S_RED} left={48}/>
        <Drip color={S_YEL} left={264} w={7}/>
      </button>

      <div style={{ textAlign:"center", fontFamily:MARKER, fontSize:11, color:INK, opacity:0.45, transform:"rotate(-1deg)" }}>
        huella · pintado a mano, escuchado en vivo
      </div>
    </div>
  );
}

/* ════════ WIDGET GLASS (clásico simple o PRO MAX) ════════ */
function GlassWidget({ pro, shared, S, set, T, K, skin, setSkin, askPro, proUnlocked, enterPro, exitPro, enterProfesor, chat }) {
  const { recording, setRecording, sec, fmt, bands, level, isReal, pos, onPointerDown, handleExport, copied, minimize, toggleRecording, lines, meetingUrl, setMeetingUrl, transcriptCtx } = shared;
  const [tab, setTab] = useState("live");
  const [visible, setVisible] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [section, setSection] = useState("tema");
  const [spec, setSpec] = useState({ x:50, y:50 });
  const [copiedCfg, setCopiedCfg] = useState(false);

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => { i+=1; setVisible(i); if (i >= lines.length) clearInterval(id); }, 180);
    return () => clearInterval(id);
  }, []);

  const r  = useCallback(b => Math.round(b * (S.radius / 18)), [S.radius]);
  const fz = useCallback(b => Math.round(b * S.fontScale * 10) / 10, [S.fontScale]);
  const sp = useCallback(b => Math.round(b * SPACING[S.spacing]), [S.spacing]);
  const dur = useCallback(s => `${(s / S.speed).toFixed(2)}s`, [S.speed]);
  const G = S.glow;

  const glassSegVal = S.density <= 0.7 ? "fino" : S.density >= 1.4 ? "denso" : "medio";
  const radiusSegVal = S.radius <= 12 ? "nitido" : S.radius >= 24 ? "capsula" : "suave";

  const handleSpecular = e => {
    if (!S.specular) return;
    const rc = e.currentTarget.getBoundingClientRect();
    setSpec({ x: ((e.clientX - rc.left) / rc.width) * 100, y: ((e.clientY - rc.top) / rc.height) * 100 });
  };

  const handleCopyConfig = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(S, null, 2));
      setCopiedCfg(true); setTimeout(() => setCopiedCfg(false), 1800);
    } catch {}
  };

  const tabList = pro
    ? [
        { k:"live", label:"En vivo" }, { k:"chat", label:"Chat IA" }, { k:"voces", label:"Voces" },
        { k:"buscar", label:"Buscar" }, { k:"actas", label:"Actas" }, { k:"resumen", label:"Resumen" },
      ]
    : [
        { k:"live", label:"En vivo" }, { k:"actas", label:"Actas" }, { k:"resumen", label:"Resumen" },
      ];

  return (
    <div style={{
      width:S.width, display:"flex", flexDirection:"column", gap:sp(10),
      position:"relative", zIndex:2,
      transform:`translate(${pos.x}px, ${pos.y}px)`,
      animation: S.floating && pos.x === 0 && pos.y === 0 ? `breathe ${dur(6)} ease-in-out infinite` : "none",
    }}>

      {/* encabezado */}
      <div onPointerDown={onPointerDown} style={{
        display:"flex", alignItems:"flex-end", justifyContent:"space-between",
        marginBottom:sp(6), cursor:"grab", touchAction:"none", userSelect:"none",
        animation:`rise ${dur(0.5)} 0.05s cubic-bezier(.2,.8,.3,1) both`,
      }}>
        <div>
          <div style={{
            fontSize:10, fontWeight:800, letterSpacing:"0.26em",
            textTransform:"uppercase", color:K.tx(0.35),
            marginBottom:5, display:"flex", alignItems:"center", gap:7,
          }}>
            <span style={{
              width:5, height:5, borderRadius:"50%",
              background: recording ? RED : T.sp[1],
              boxShadow: recording ? `0 0 ${8*G}px ${RED}` : `0 0 ${8*G}px ${T.sp[1]}`,
              transition:"all .3s",
            }}/>
            {recording ? (isReal ? "Micrófono activo" : "Grabando (demo)") : "Sesión lista"}
          </div>
          <div style={{ fontSize:fz(29), fontWeight:900, letterSpacing:"-0.045em", lineHeight:0.95, color:"#000", display:"flex", alignItems:"baseline", gap:7 }}>
            <span>HUELLA</span>
            {pro && (
              <span style={{
                fontSize:9, fontWeight:900, letterSpacing:"0.14em", color:"#fff",
                background:`linear-gradient(145deg, ${T.hi}, ${T.p})`,
                borderRadius:6, padding:"2.5px 7px",
                boxShadow:`0 2px ${10*G}px ${T.p}66, 0 1px 1px rgba(255,255,255,0.35) inset`,
              }}>PRO MAX</span>
            )}
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={() => setSettingsOpen(o => !o)} aria-label="Ajustes" style={{
            ...K.glass(settingsOpen ? 0.16 : 0.08),
            width:30, height:30, borderRadius:"50%",
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", border:"none", flexShrink:0,
            transition:"transform .35s cubic-bezier(.34,1.4,.64,1)",
            transform: settingsOpen ? "rotate(90deg)" : "rotate(0)",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={settingsOpen ? T.hi : K.tx(0.6)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3"/>
              <circle cx="4" cy="12" r="2"/><circle cx="12" cy="10" r="2"/><circle cx="20" cy="14" r="2"/>
            </svg>
          </button>

          <button onClick={minimize} aria-label="Minimizar a cápsula" style={{
            ...K.glass(0.08), width:30, height:30, borderRadius:"50%",
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", border:"none", flexShrink:0,
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={K.tx(0.6)} strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14"/>
            </svg>
          </button>

          <div style={{ position:"relative", width:58, height:58, flexShrink:0 }}>
            <svg viewBox="0 0 100 100" style={{ width:"100%", height:"100%", animation:`spinSlow ${dur(16)} linear infinite` }}>
              <defs><path id="circ" d="M 50,50 m -36,0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0"/></defs>
              <text style={{ fontSize:12.5, fontWeight:800, letterSpacing:"0.32em", fill:K.tx(0.55) }}>
                <textPath href="#circ">TRANSCRIPCIÓN · EN VIVO ·</textPath>
              </text>
            </svg>
            <div style={{
              position:"absolute", inset:16, borderRadius:"50%",
              background:`linear-gradient(145deg, ${T.p}, ${T.deep})`,
              boxShadow:`0 1px 1px rgba(255,255,255,0.4) inset, 0 4px ${16*G}px ${T.p}80`,
              display:"flex", alignItems:"center", justifyContent:"center",
              transition:"background .35s",
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 11a3 3 0 0 0-3 3c0 1.8-.3 3.4-.8 4.8"/>
                <path d="M12 11a3 3 0 0 1 3 3c0 2.2.3 4-.5 6"/>
                <path d="M7 9.5A6 6 0 0 1 18 13c0 1.5.1 3-.2 4.5"/>
                <path d="M5.2 13.5c-.1.5-.2 1.8-.2 2.5"/>
                <path d="M8.5 5.6A8 8 0 0 1 20 13"/>
                <path d="M4.6 9A8 8 0 0 1 6 7"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* AJUSTES */}
      {settingsOpen && !pro && (
        <div style={{
          ...K.glass(0.10), borderRadius:r(24), padding:"16px",
          animation:"rise .35s cubic-bezier(.2,.8,.3,1) both",
          display:"flex", flexDirection:"column", gap:13,
        }}>
          {/* estilo */}
          <div>
            <div style={{ fontSize:9, fontWeight:800, letterSpacing:"0.2em", textTransform:"uppercase", color:K.tx(0.4), marginBottom:7 }}>
              Estilo del widget
            </div>
            <Segment T={T} K={K} value={skin} onChange={setSkin}
              options={[["cristal","✦ Cristal"],["slawn","✎ Slawn"]]}/>
          </div>
          {/* modo profesor */}
          <button onClick={enterProfesor} style={{
            width:"100%", padding:"11px 0",
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            borderRadius:r(14), border:`1px solid ${T.sp[1]}66`,
            background:`linear-gradient(145deg, ${T.sp[1]}33, ${T.sp[1]}12)`,
            color:K.tx(0.95), fontSize:11.5, fontWeight:800,
            letterSpacing:"0.08em", textTransform:"uppercase",
            fontFamily:"inherit", cursor:"pointer",
            boxShadow:`0 3px ${14*G}px ${T.sp[1]}33`,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.sp[1]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 9.5 12 5l10 4.5L12 14 2 9.5Z"/>
              <path d="M6 11.5V16c0 1.4 2.7 2.8 6 2.8s6-1.4 6-2.8v-4.5"/>
            </svg>
            Modo Profesor
          </button>
          {/* tema */}
          <div>
            <div style={{ fontSize:9, fontWeight:800, letterSpacing:"0.2em", textTransform:"uppercase", color:K.tx(0.4), marginBottom:7 }}>Tema</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:6 }}>
              {Object.entries(THEMES).map(([key, th]) => (
                <button key={key} onClick={() => set({ themeKey:key })} title={th.name} style={{
                  height:32, borderRadius:10,
                  border: S.themeKey===key ? `2px solid ${th.hi}` : "2px solid rgba(128,128,150,0.15)",
                  background:`linear-gradient(145deg, ${th.hi}, ${th.p} 55%, ${th.deep})`,
                  cursor:"pointer",
                  boxShadow: S.themeKey===key ? `0 3px ${14*G}px ${th.p}66` : "none",
                  transition:"all .2s ease",
                }}/>
              ))}
            </div>
          </div>
          {/* vidrio / esquinas */}
          <div>
            <div style={{ fontSize:9, fontWeight:800, letterSpacing:"0.2em", textTransform:"uppercase", color:K.tx(0.4), marginBottom:7 }}>Densidad del vidrio</div>
            <Segment T={T} K={K} value={glassSegVal} onChange={v => set(GLASS_SEG[v])}
              options={[["fino","Fino"],["medio","Medio"],["denso","Esmerilado"]]}/>
          </div>
          <div>
            <div style={{ fontSize:9, fontWeight:800, letterSpacing:"0.2em", textTransform:"uppercase", color:K.tx(0.4), marginBottom:7 }}>Esquinas</div>
            <Segment T={T} K={K} value={radiusSegVal} onChange={v => set({ radius:RADIUS_SEG[v] })}
              options={[["nitido","Nítido"],["suave","Suave"],["capsula","Cápsula"]]}/>
          </div>
          <div>
            <div style={{ fontSize:9, fontWeight:800, letterSpacing:"0.2em", textTransform:"uppercase", color:K.tx(0.4), marginBottom:7 }}>Texto · según tu fondo</div>
            <Segment T={T} K={K} value={S.textMode} onChange={v => set({ textMode:v })}
              options={[["claro","Claro · fondo oscuro"],["oscuro","Oscuro · fondo claro"]]}/>
          </div>
          <Toggle label="Flotación suave" value={S.floating} onChange={v => set({ floating:v })} T={T} K={K}/>

          {/* PRO MAX lock */}
          <button onClick={() => proUnlocked ? enterPro() : askPro()} style={{
            width:"100%", padding:"11px 0",
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            borderRadius:r(14), border:`1px solid ${T.p}66`,
            background:`linear-gradient(145deg, ${T.p}38, ${T.p}14)`,
            color:K.tx(0.95), fontSize:11.5, fontWeight:800,
            letterSpacing:"0.08em", textTransform:"uppercase",
            fontFamily:"inherit", cursor:"pointer",
            boxShadow:`0 3px ${14*G}px ${T.p}40`,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.hi} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              {proUnlocked
                ? <><rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/></>
                : <><rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></>}
            </svg>
            {proUnlocked ? "Entrar a PRO MAX" : "PRO MAX · bloqueado"}
          </button>
        </div>
      )}

      {/* AJUSTES PRO (panel completo) */}
      {settingsOpen && pro && (
        <div className="pro-panel" style={{
          ...K.glass(0.10), borderRadius:r(24), padding:"14px",
          animation:"rise .35s cubic-bezier(.2,.8,.3,1) both",
          maxHeight:400, overflowY:"auto",
        }}>
          <div style={{ fontSize:9, fontWeight:800, letterSpacing:"0.2em", textTransform:"uppercase", color:K.tx(0.4), marginBottom:8 }}>Presets rápidos</div>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:13 }}>
            {Object.entries(PRESETS).map(([name, patch]) => (
              <button key={name} onClick={() => set(patch)} style={{
                padding:"6px 12px", borderRadius:999,
                border:`1px solid ${T.p}4D`, background:`${T.p}1A`,
                color:K.tx(0.85), fontSize:10.5, fontWeight:700,
                fontFamily:"inherit", cursor:"pointer",
              }}>{name}</button>
            ))}
          </div>

          <Section title="Tema y color" open={section==="tema"} onToggle={() => setSection(s => s==="tema" ? "" : "tema")} T={T} K={K}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:6, marginBottom:11 }}>
              {Object.entries(THEMES).map(([key, th]) => (
                <button key={key} onClick={() => set({ themeKey:key })} title={th.name} style={{
                  height:34, borderRadius:10,
                  border: S.themeKey===key ? `2px solid ${th.hi}` : "2px solid rgba(128,128,150,0.15)",
                  background:`linear-gradient(145deg, ${th.hi}, ${th.p} 55%, ${th.deep})`,
                  cursor:"pointer",
                  boxShadow: S.themeKey===key ? `0 3px ${14*G}px ${th.p}66` : "none",
                }}/>
              ))}
              <button onClick={() => set({ themeKey:"custom" })} title="A medida" style={{
                height:34, borderRadius:10,
                border: S.themeKey==="custom" ? "2px solid #fff" : "2px solid rgba(128,128,150,0.15)",
                background:"conic-gradient(red, yellow, lime, cyan, blue, magenta, red)",
                cursor:"pointer",
              }}/>
            </div>
            {S.themeKey === "custom" && (
              <>
                <Slider label="Tono" value={S.customHue} min={0} max={360} onChange={v => set({ customHue:v })} T={T} K={K} suffix="°"
                  track="linear-gradient(to right, hsl(0 85% 55%), hsl(60 85% 55%), hsl(120 85% 55%), hsl(180 85% 55%), hsl(240 85% 55%), hsl(300 85% 55%), hsl(360 85% 55%))"/>
                <Slider label="Saturación" value={S.customSat} min={20} max={100} onChange={v => set({ customSat:v })} T={T} K={K} suffix="%"/>
              </>
            )}
            <Segment T={T} K={K} value={S.textMode} onChange={v => set({ textMode:v })}
              options={[["claro","Claro · fondo oscuro"],["oscuro","Oscuro · fondo claro"]]}/>
          </Section>

          <Section title="Vidrio" open={section==="vidrio"} onToggle={() => setSection(s => s==="vidrio" ? "" : "vidrio")} T={T} K={K}>
            <Slider label="Desenfoque (blur)" value={S.blur} min={8} max={60} onChange={v => set({ blur:v })} T={T} K={K} suffix="px"/>
            <Slider label="Densidad" value={S.density} min={0.3} max={2} step={0.05} onChange={v => set({ density:v })} T={T} K={K}/>
            <Toggle label="Brillo especular" value={S.specular} onChange={v => set({ specular:v })} T={T} K={K}/>
          </Section>

          <Section title="Forma y tamaño" open={section==="forma"} onToggle={() => setSection(s => s==="forma" ? "" : "forma")} T={T} K={K}>
            <Slider label="Redondez de esquinas" value={S.radius} min={2} max={30} onChange={v => set({ radius:v })} T={T} K={K}/>
            <Slider label="Ancho del widget" value={S.width} min={300} max={420} onChange={v => set({ width:v })} T={T} K={K} suffix="px"/>
            <Segment T={T} K={K} value={S.spacing} onChange={v => set({ spacing:v })}
              options={[["compacto","Compacto"],["normal","Normal"],["amplio","Amplio"]]}/>
          </Section>

          <Section title="Contenido y texto" open={section==="texto"} onToggle={() => setSection(s => s==="texto" ? "" : "texto")} T={T} K={K}>
            <Slider label="Tamaño de letra" value={S.fontScale} min={0.85} max={1.2} step={0.01} onChange={v => set({ fontScale:v })} T={T} K={K} suffix="×"/>
            <Toggle label="Mostrar marcas de tiempo" value={S.showTimes} onChange={v => set({ showTimes:v })} T={T} K={K}/>
            <Toggle label="Mostrar avatares" value={S.showAvatars} onChange={v => set({ showAvatars:v })} T={T} K={K}/>
          </Section>

          <Section title="Movimiento y efectos" open={section==="mov"} onToggle={() => setSection(s => s==="mov" ? "" : "mov")} T={T} K={K}>
            <Toggle label="Flotación suave" value={S.floating} onChange={v => set({ floating:v })} T={T} K={K}/>
            <Slider label="Velocidad de animación" value={S.speed} min={0.5} max={2} step={0.05} onChange={v => set({ speed:v })} T={T} K={K} suffix="×"/>
            <Slider label="Intensidad del glow" value={S.glow} min={0} max={2} step={0.05} onChange={v => set({ glow:v })} T={T} K={K} suffix="×"/>
            <Segment T={T} K={K} value={S.waveStyle} onChange={v => set({ waveStyle:v })}
              options={[["barras","Barras"],["linea","Línea"],["puntos","Puntos"]]}/>
          </Section>

          <div style={{ display:"flex", gap:6, marginTop:4 }}>
            <button onClick={handleCopyConfig} style={{
              flex:1.2, padding:"9px 0", borderRadius:11,
              border:`1px solid ${T.p}59`, background:`${T.p}1F`,
              color:K.tx(0.9), fontSize:10.5, fontWeight:700, fontFamily:"inherit", cursor:"pointer",
            }}>{copiedCfg ? "Copiados ✓" : "Copiar ajustes"}</button>
            <button onClick={() => set(DEFAULTS)} style={{
              flex:1, padding:"9px 0", borderRadius:11,
              border:"1px solid rgba(128,128,150,0.25)", background:"transparent",
              color:K.tx(0.55), fontSize:10.5, fontWeight:700, fontFamily:"inherit", cursor:"pointer",
            }}>Restablecer</button>
            <button onClick={exitPro} style={{
              flex:1, padding:"9px 0", borderRadius:11,
              border:`1px solid ${RED}66`, background:`${RED}1A`,
              color:RED, fontSize:10.5, fontWeight:800, fontFamily:"inherit", cursor:"pointer",
            }}>Salir de PRO</button>
          </div>
        </div>
      )}

      {/* isla de grabación */}
      <div onMouseMove={handleSpecular} style={{
        ...K.glass(0.10), borderRadius:r(30), padding:`${sp(15)}px ${sp(17)}px`,
        display:"flex", alignItems:"center", gap:sp(14),
        animation:`rise ${dur(0.5)} 0.12s cubic-bezier(.2,.8,.3,1) both`,
        position:"relative", overflow:"hidden",
      }}>
        {S.specular && (
          <div style={{
            position:"absolute", inset:0, pointerEvents:"none",
            background:`radial-gradient(circle 120px at ${spec.x}% ${spec.y}%, rgba(255,255,255,0.14), transparent 70%)`,
            transition:"background .1s ease-out",
          }}/>
        )}
        <RecordButton recording={recording} level={level} onToggle={toggleRecording} T={T} glow={G}/>
        <div style={{ flex:1, minWidth:0, position:"relative" }}>
          <div style={{ color:K.tx(0.95), fontSize:fz(14), fontWeight:700, marginBottom:5, display:"flex", alignItems:"center", gap:8 }}>
            {recording ? "Escuchando" : "Toca para grabar"}
            {recording && (
              <span style={{
                fontSize:11, fontWeight:800, color:RED, fontVariantNumeric:"tabular-nums",
                background:"rgba(255,70,85,0.14)", border:"1px solid rgba(255,70,85,0.3)",
                borderRadius:999, padding:"1px 8px",
              }}>{fmt(sec)}</span>
            )}
          </div>
          <Waveform bands={bands} active={recording} T={T} style={S.waveStyle} glow={G}/>
          <div style={{ marginTop:5 }}><LiveTyping active={recording} K={K}/></div>
          {!recording && (
            <input
              value={meetingUrl} onChange={e => setMeetingUrl(e.target.value)}
              placeholder="Enlace Google Meet / Teams (opcional)"
              style={{ marginTop:7, width:"100%", boxSizing:"border-box", padding:"5px 9px",
                background:"rgba(128,128,150,0.10)", border:"1px solid rgba(128,128,150,0.22)",
                borderRadius:10, color:K.tx(0.8), fontSize:10.5, fontFamily:"inherit", outline:"none" }}/>
          )}
        </div>
      </div>

      {/* tabs */
      <div style={{ animation:`rise ${dur(0.5)} 0.19s cubic-bezier(.2,.8,.3,1) both` }}>
        <Tabs tabs={tabList} tab={tab} setTab={setTab} T={T} K={K} glow={G}/>
      </div>

      {/* contenido */}
      <div style={{ animation:`rise ${dur(0.5)} 0.26s cubic-bezier(.2,.8,.3,1) both` }}>
        {tab === "live" && (
          <div style={{ display:"flex", flexDirection:"column", gap:sp(8) }}>
            {lines.slice(0, visible).map((line, i) => {
              const col = T.sp[line.spIdx];
              return (
                <div key={line.id} style={{
                  ...K.glass(0.085), borderRadius:r(20), padding:`${sp(12)}px ${sp(14)}px`,
                  display:"flex", gap:sp(11), alignItems:"flex-start",
                  animation:`rise .45s ${i*0.06}s cubic-bezier(.2,.8,.3,1) both`,
                  position:"relative", overflow:"hidden",
                }}>
                  <div style={{
                    position:"absolute", left:-30, top:"50%", transform:"translateY(-50%)",
                    width:110, height:110, borderRadius:"50%",
                    background:col, opacity:0.13, filter:"blur(34px)", pointerEvents:"none",
                  }}/>
                  {S.showAvatars && (
                    <div style={{ width:34, height:34, flexShrink:0, position:"relative", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <div style={{ position:"absolute", inset:-4, borderRadius:"50%", background:col, opacity:0.22, filter:"blur(12px)" }}/>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                        stroke={col} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                        style={{ position:"relative", filter:`drop-shadow(0 0 ${6*G}px ${col}99)` }}>
                        <circle cx="12" cy="8" r="4"/>
                        <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>
                      </svg>
                    </div>
                  )}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                      <span style={{ color:`${col}cc`, fontSize:fz(10), fontWeight:700, letterSpacing:"0.14em", textShadow:`0 0 ${10*G}px ${col}66` }}>{line.speaker}</span>
                      {S.showTimes && <span style={{ color:K.tx(0.32), fontSize:10, fontVariantNumeric:"tabular-nums" }}>{line.time}</span>}
                    </div>
                    <p style={{ color:K.tx(0.88), fontSize:fz(13.5), lineHeight:1.5, margin:0 }}>{line.text}</p>
                  </div>
                </div>
              );
            })}
            {recording && (
              <div style={{ ...K.glass(0.06), borderRadius:r(16), padding:"10px 14px", display:"flex", alignItems:"center", gap:9, animation:"rise .4s ease both" }}>
                <div style={{ display:"flex", gap:3 }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width:5, height:5, borderRadius:"50%", background:T.hi, animation:`blink 1.2s ${i*0.2}s ease infinite` }}/>
                  ))}
                </div>
                <span style={{ fontSize:11.5, color:K.tx(0.45), fontWeight:500 }}>Transcribiendo nueva intervención…</span>
              </div>
            )}
          </div>
        )}

        {pro && tab === "chat" && (
          <ChatTab T={T} K={K} r={r} fz={fz} sp={sp} glow={G}
            msgs={chat.msgs} input={chat.input} setInput={chat.setInput}
            loading={chat.loading} onSend={chat.send}/>
        )}
        {pro && tab === "voces" && <VocesTab T={T} K={K} r={r} fz={fz} sp={sp} glow={G} lines={lines}/>}
        {pro && tab === "buscar" && (
          <BuscarTab T={T} K={K} r={r} fz={fz} sp={sp}
            query={chat.query} setQuery={chat.setQuery} who={chat.who} setWho={chat.setWho} lines={lines}/>
        )}

        {tab === "actas" && (
          <div style={{ display:"flex", flexDirection:"column", gap:sp(8) }}>
            {ACTAS.map((item,i) => {
              const col = T.sp[item.spIdx];
              return (
                <div key={i} style={{
                  ...K.glass(0.085), borderRadius:r(18), padding:`${sp(13)}px ${sp(15)}px`,
                  display:"flex", gap:sp(12), alignItems:"center",
                  animation:`rise .45s ${i*0.06}s cubic-bezier(.2,.8,.3,1) both`,
                  opacity: item.done ? 0.75 : 1,
                }}>
                  <div style={{
                    width:24, height:24, borderRadius:r(8), flexShrink:0,
                    background: item.done ? `linear-gradient(145deg, ${col}, ${col}99)` : "rgba(128,128,150,0.1)",
                    border: item.done ? "none" : `1.5px solid ${K.tx(0.2)}`,
                    boxShadow: item.done ? `0 1px 1px rgba(255,255,255,0.35) inset, 0 2px ${10*G}px ${col}50` : "none",
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}>
                    {item.done && (
                      <svg width="12" height="12" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{
                      color: item.done ? K.tx(0.4) : K.tx(0.9),
                      fontSize:fz(13), fontWeight:500, lineHeight:1.4,
                      textDecoration: item.done ? "line-through" : "none",
                    }}>{item.text}</div>
                    <div style={{ color:col, fontSize:9.5, fontWeight:800, letterSpacing:"0.14em", marginTop:3 }}>{item.who}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "resumen" && (
          <div style={{ ...K.glass(0.085), borderRadius:r(24), padding:sp(17), position:"relative", overflow:"hidden" }}>
            <div style={{
              position:"absolute", top:0, left:0, right:0, height:1,
              background:"linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
              backgroundSize:"200% 100%", animation:`shimmer ${dur(3)} linear infinite`,
            }}/>
            <div style={{ display:"flex", gap:sp(8), marginBottom:sp(15) }}>
              {[["4","voces"],["1:02","min"],["3","tareas"]].map(([n,l],i) => (
                <div key={l} style={{
                  flex:1, borderRadius:r(14), padding:"12px 6px", textAlign:"center",
                  background: i===0 ? `linear-gradient(145deg, ${T.p}, ${T.deep})` : "rgba(128,128,150,0.08)",
                  border: i===0 ? "none" : "1px solid rgba(128,128,150,0.15)",
                  boxShadow: i===0 ? `0 1px 1px rgba(255,255,255,0.4) inset, 0 4px ${18*G}px ${T.p}73` : "none",
                }}>
                  <div style={{ color: i===0 ? "#fff" : K.tx(0.95), fontSize:fz(23), fontWeight:900, lineHeight:1, fontVariantNumeric:"tabular-nums" }}>{n}</div>
                  <div style={{
                    color: i===0 ? "rgba(255,255,255,0.75)" : K.tx(0.38),
                    fontSize:9, marginTop:4, fontWeight:700, letterSpacing:"0.16em", textTransform:"uppercase",
                  }}>{l}</div>
                </div>
              ))}
            </div>
            {RESUMEN_ROWS.map((row,i) => (
              <div key={row.k} style={{
                display:"flex", gap:10, alignItems:"baseline", padding:"9px 0",
                borderTop: i>0 ? `1px solid ${K.tx(0.07)}` : "none",
              }}>
                <span style={{ color:T.hi, fontSize:9, fontWeight:800, letterSpacing:"0.18em", flexShrink:0, width:56 }}>{row.k}</span>
                <span style={{ color:K.tx(0.85), fontSize:fz(13), lineHeight:1.45 }}>{row.v}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* exportar */}
      <button onClick={handleExport} style={{
        borderRadius:r(18), padding:`${sp(14)}px 0`, width:"100%",
        background: copied
          ? "linear-gradient(145deg, #00E8A2, #00B87E)"
          : `linear-gradient(145deg, ${T.hi} 0%, ${T.p} 45%, ${T.deep} 100%)`,
        border:"none", color:"#fff", fontSize:fz(13), fontWeight:800,
        fontFamily:"inherit", cursor:"pointer",
        letterSpacing:"0.10em", textTransform:"uppercase",
        boxShadow:[
          "0 1px 1px rgba(255,255,255,0.45) inset",
          "0 -2px 5px rgba(0,0,0,0.3) inset",
          copied ? `0 6px ${28*G}px rgba(0,232,162,0.45)` : `0 6px ${28*G}px ${T.p}80`,
        ].join(", "),
        transition:"transform .18s cubic-bezier(.34,1.56,.64,1), background .3s",
        animation:`rise ${dur(0.5)} 0.33s cubic-bezier(.2,.8,.3,1) both`,
      }}
        onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; }}
      >
        {copied ? "Copiado al portapapeles ✓" : "Exportar transcripción ↗"}
      </button>

      <div style={{
        textAlign:"center", marginTop:2,
        fontSize:9, fontWeight:700, letterSpacing:"0.3em",
        color:K.tx(0.18), textTransform:"uppercase",
        animation:`rise ${dur(0.5)} 0.4s cubic-bezier(.2,.8,.3,1) both`,
      }}>
        Huella{pro ? " Pro Max" : ""} · {T.name}
      </div>
    </div>
  );
}

/* ════════ WIDGET PROFESOR 🎓 ════════ */
function ProfesorWidget({ shared, S, T, K, exitProfesor, roster, setRoster, notes, setNotes }) {
  const { recording, setRecording, sec, fmt, bands, level, isReal, pos, onPointerDown, handleExport, copied, minimize, toggleRecording, lines, meetingUrl, setMeetingUrl, transcriptCtx } = shared;
  const [tab, setTab] = useState("clase");
  const [visible, setVisible] = useState(0);

  const r  = useCallback(b => Math.round(b * (S.radius / 18)), [S.radius]);
  const fz = useCallback(b => Math.round(b * S.fontScale * 10) / 10, [S.fontScale]);
  const sp = useCallback(b => Math.round(b * SPACING[S.spacing]), [S.spacing]);
  const dur = useCallback(s => `${(s / S.speed).toFixed(2)}s`, [S.speed]);
  const G = S.glow;

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => { i+=1; setVisible(i); if (i >= lines.length) clearInterval(id); }, 180);
    return () => clearInterval(id);
  }, []);

  /* ── semáforo de ruido (usa el micro real) ── */
  const zone = !recording ? "off" : level < 0.12 ? "verde" : level < 0.3 ? "ambar" : "rojo";
  const [noiseWarnings, setNoiseWarnings] = useState(0);
  const lastZone = useRef("off");
  useEffect(() => {
    if (zone === "rojo" && lastZone.current !== "rojo") setNoiseWarnings(n => n + 1);
    lastZone.current = zone;
  }, [zone]);

  /* ── asistencia ── */
  const ST_CFG = {
    none:    { label:"Sin marcar", col:"rgba(128,128,150,0.55)" },
    presente:{ label:"Presente",   col:T.sp[1] },
    tarde:   { label:"Tarde",      col:"#FFC24B" },
    ausente: { label:"Ausente",    col:RED },
  };
  const CYCLE = { none:"presente", presente:"tarde", tarde:"ausente", ausente:"none" };
  const cycleStatus = id => setRoster(rs => rs.map(s => s.id === id ? { ...s, status:CYCLE[s.status] } : s));
  const [newName, setNewName] = useState("");
  const addStudent = () => {
    const n = newName.trim();
    if (!n) return;
    setRoster(rs => [...rs, { id:Date.now(), name:n, status:"none", points:0 }]);
    setNewName("");
  };
  const removeStudent = id => setRoster(rs => rs.filter(s => s.id !== id));
  const counts = {
    presente: roster.filter(s => s.status==="presente").length,
    tarde:    roster.filter(s => s.status==="tarde").length,
    ausente:  roster.filter(s => s.status==="ausente").length,
  };
  const [copiedLista, setCopiedLista] = useState(false);
  const exportLista = async () => {
    const f = new Date().toLocaleDateString("es-ES");
    const grp = st => roster.filter(s => s.status===st).map(s => s.name).join(", ") || "—";
    const text = [`ASISTENCIA · ${f}`, "─".repeat(26),
      `✓ Presentes (${counts.presente}): ${grp("presente")}`,
      `🕐 Tarde (${counts.tarde}): ${grp("tarde")}`,
      `✗ Ausentes (${counts.ausente}): ${grp("ausente")}`,
      `Sin marcar: ${grp("none")}`].join("\n");
    try { await navigator.clipboard.writeText(text); setCopiedLista(true); setTimeout(() => setCopiedLista(false), 1800); } catch {}
  };

  /* ── participación + selector aleatorio ── */
  const addPoint = (id, d) => setRoster(rs => rs.map(s => s.id === id ? { ...s, points:Math.max(0, s.points + d) } : s));
  const maxPts = Math.max(...roster.map(s => s.points), 0);
  const [noRepeat, setNoRepeat] = useState(true);
  const [pickedIds, setPickedIds] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [highlightId, setHighlightId] = useState(null);
  const [winner, setWinner] = useState(null);
  const eligible = roster.filter(s => s.status !== "ausente" && (!noRepeat || !pickedIds.includes(s.id)));
  const spin = () => {
    if (!eligible.length || spinning) return;
    setSpinning(true); setWinner(null);
    let i = 0;
    const id = setInterval(() => { i++; setHighlightId(eligible[i % eligible.length].id); }, 70);
    setTimeout(() => {
      clearInterval(id);
      const win = eligible[Math.floor(Math.random() * eligible.length)];
      setHighlightId(win.id);
      setPickedIds(p => [...p, win.id]);
      setWinner(win.name);
      setSpinning(false);
    }, 1400);
  };

  /* ── temporizador ── */
  const [total, setTotal] = useState(0);
  const [left, setLeft] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setLeft(l => {
      if (l <= 1) { setRunning(false); return 0; }
      return l - 1;
    }), 1000);
    return () => clearInterval(id);
  }, [running]);
  const setPreset = min => { setTotal(min*60); setLeft(min*60); setRunning(false); };
  const bump = d => { const t = Math.max(60, total + d*60); setTotal(t); setLeft(t); };
  const finished = total > 0 && left === 0;
  const RING_R = 52, CIRC = 2 * Math.PI * RING_R;
  const prog = total ? left / total : 1;

  /* ── quiz IA ── */
  const [quiz, setQuiz] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState("");
  const generateQuiz = async () => {
    if (quizLoading) return;
    setQuizLoading(true); setQuizError(""); setQuiz([]);
    try {
      const res = await fetch("/api/ia", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          type:"quiz",
          messages:[{ role:"user", content:
            `${transcriptCtx}\n\nGenera exactamente 3 preguntas de repaso para estudiantes sobre esta lección, con su respuesta breve. Responde SOLO con un array JSON válido sin texto adicional ni markdown: [{"pregunta":"...","respuesta":"..."}]` }],
        }),
      });
      const data = await res.json();
      const raw = (data.content || []).map(b => b.type === "text" ? b.text : "").join("");
      const clean = raw.replace(/```json|```/g, "").trim();
      const arr = JSON.parse(clean);
      setQuiz(arr.slice(0, 5).map((x, i) => ({ id:i, q:x.pregunta || "", a:x.respuesta || "", open:false })));
    } catch {
      setQuizError("No pude generar el quiz ahora mismo. Inténtalo de nuevo.");
    }
    setQuizLoading(false);
  };
  const toggleCard = id => setQuiz(q => q.map(c => c.id === id ? { ...c, open:!c.open } : c));

  /* ── notas / deberes ── */
  const NOTE_TYPES = {
    nota:    { label:"Nota",    icon:"📌", col:T.hi },
    deberes: { label:"Deberes", icon:"📚", col:T.sp[1] },
    examen:  { label:"Examen",  icon:"⚠️", col:RED },
  };
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState("deberes");
  const addNote = () => {
    const t = noteText.trim();
    if (!t) return;
    setNotes(ns => [...ns, { id:Date.now(), type:noteType, text:t }]);
    setNoteText("");
  };
  const [copiedNotas, setCopiedNotas] = useState(false);
  const exportNotas = async () => {
    const f = new Date().toLocaleDateString("es-ES");
    const by = t => notes.filter(n => n.type === t).map(n => `· ${n.text}`).join("\n") || "· —";
    const text = [`RESUMEN PARA ALUMNOS · ${f}`, "─".repeat(26),
      `TEMA: ${RESUMEN_ROWS[0].v}`,
      `\n📚 DEBERES:\n${by("deberes")}`,
      `\n⚠️ PARA EL EXAMEN:\n${by("examen")}`,
      `\n📌 NOTAS:\n${by("nota")}`].join("\n");
    try { await navigator.clipboard.writeText(text); setCopiedNotas(true); setTimeout(() => setCopiedNotas(false), 1800); } catch {}
  };

  const tabList = [
    { k:"clase", label:"Clase" }, { k:"lista", label:"Lista" }, { k:"participa", label:"Participa" },
    { k:"timer", label:"Timer" }, { k:"quiz", label:"Quiz" }, { k:"notas", label:"Notas" },
  ];

  return (
    <div style={{
      width:S.width, display:"flex", flexDirection:"column", gap:sp(10),
      position:"relative", zIndex:2,
      transform:`translate(${pos.x}px, ${pos.y}px)`,
      animation: S.floating && pos.x === 0 && pos.y === 0 ? `breathe ${dur(6)} ease-in-out infinite` : "none",
    }}>

      {/* encabezado */}
      <div onPointerDown={onPointerDown} style={{
        display:"flex", alignItems:"flex-end", justifyContent:"space-between",
        marginBottom:sp(6), cursor:"grab", touchAction:"none", userSelect:"none",
        animation:`rise ${dur(0.5)} 0.05s cubic-bezier(.2,.8,.3,1) both`,
      }}>
        <div>
          <div style={{
            fontSize:10, fontWeight:800, letterSpacing:"0.26em",
            textTransform:"uppercase", color:K.tx(0.35),
            marginBottom:5, display:"flex", alignItems:"center", gap:7,
          }}>
            <span style={{
              width:5, height:5, borderRadius:"50%",
              background: recording ? RED : T.sp[1],
              boxShadow: recording ? `0 0 ${8*G}px ${RED}` : `0 0 ${8*G}px ${T.sp[1]}`,
            }}/>
            {recording ? (isReal ? "Micrófono activo" : "Grabando (demo)") : "Aula lista"}
          </div>
          <div style={{ fontSize:fz(29), fontWeight:900, letterSpacing:"-0.045em", lineHeight:0.95, color:"#000", display:"flex", alignItems:"baseline", gap:7 }}>
            <span>HUELLA</span>
            <span style={{
              fontSize:9, fontWeight:900, letterSpacing:"0.12em", color:"#fff",
              background:`linear-gradient(145deg, ${T.sp[1]}, ${T.p})`,
              borderRadius:6, padding:"2.5px 7px",
              boxShadow:`0 2px ${10*G}px ${T.p}66, 0 1px 1px rgba(255,255,255,0.35) inset`,
            }}>🎓 PROFESOR</span>
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={minimize} aria-label="Minimizar" style={{
            ...K.glass(0.08), width:30, height:30, borderRadius:"50%",
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", border:"none", flexShrink:0,
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={K.tx(0.6)} strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14"/></svg>
          </button>
          <button onClick={exitProfesor} aria-label="Salir del modo profesor" style={{
            ...K.glass(0.08), width:30, height:30, borderRadius:"50%",
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", border:"none", flexShrink:0,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={K.tx(0.6)} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
          </button>
          {/* birrete */}
          <div style={{
            width:46, height:46, borderRadius:"50%", flexShrink:0,
            background:`linear-gradient(145deg, ${T.p}, ${T.deep})`,
            boxShadow:`0 1px 1px rgba(255,255,255,0.4) inset, 0 4px ${16*G}px ${T.p}80`,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 9.5 12 5l10 4.5L12 14 2 9.5Z"/>
              <path d="M6 11.5V16c0 1.4 2.7 2.8 6 2.8s6-1.4 6-2.8v-4.5"/>
              <path d="M22 9.5V15"/>
            </svg>
          </div>
        </div>
      </div>

      {/* isla de grabación */}
      <div style={{
        ...K.glass(0.10), borderRadius:r(30), padding:`${sp(15)}px ${sp(17)}px`,
        display:"flex", alignItems:"center", gap:sp(14),
        animation:`rise ${dur(0.5)} 0.12s cubic-bezier(.2,.8,.3,1) both`,
        position:"relative", overflow:"hidden",
      }}>
        <RecordButton recording={recording} level={level} onToggle={toggleRecording} T={T} glow={G}/>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ color:K.tx(0.95), fontSize:fz(14), fontWeight:700, marginBottom:5, display:"flex", alignItems:"center", gap:8 }}>
            {recording ? "Grabando la clase" : "Graba la lección"}
            {recording && (
              <span style={{
                fontSize:11, fontWeight:800, color:RED, fontVariantNumeric:"tabular-nums",
                background:"rgba(255,70,85,0.14)", border:"1px solid rgba(255,70,85,0.3)",
                borderRadius:999, padding:"1px 8px",
              }}>{fmt(sec)}</span>
            )}
          </div>
          <Waveform bands={bands} active={recording} T={T} style={S.waveStyle} glow={G}/>
        </div>
      </div>

      {/* tabs */}
      <div style={{ animation:`rise ${dur(0.5)} 0.19s cubic-bezier(.2,.8,.3,1) both` }}>
        <Tabs tabs={tabList} tab={tab} setTab={setTab} T={T} K={K} glow={G}/>
      </div>

      <div style={{ animation:`rise ${dur(0.5)} 0.26s cubic-bezier(.2,.8,.3,1) both` }}>

        {/* ═══ CLASE: transcripción + semáforo de ruido ═══ */}
        {tab === "clase" && (
          <div style={{ display:"flex", flexDirection:"column", gap:sp(8) }}>
            {/* semáforo */}
            <div style={{ ...K.glass(0.09), borderRadius:r(20), padding:"12px 14px" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:9 }}>
                <span style={{ fontSize:10, fontWeight:800, letterSpacing:"0.16em", textTransform:"uppercase", color:K.tx(0.4) }}>
                  Semáforo de ruido
                </span>
                <span style={{
                  fontSize:10, fontWeight:800, color: noiseWarnings > 0 ? RED : K.tx(0.4),
                  fontVariantNumeric:"tabular-nums",
                }}>⚡ {noiseWarnings} aviso{noiseWarnings !== 1 ? "s" : ""}</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ display:"flex", gap:7 }}>
                  {[["verde", T.sp[1], "Silencio"],["ambar","#FFC24B","Murmullo"],["rojo", RED, "¡Ruido!"]].map(([z, col]) => (
                    <div key={z} style={{
                      width:22, height:22, borderRadius:"50%",
                      background: zone === z ? col : "rgba(128,128,150,0.18)",
                      boxShadow: zone === z ? `0 0 ${14*G}px ${col}, 0 1px 1px rgba(255,255,255,0.4) inset` : "0 1px 2px rgba(0,0,0,0.2) inset",
                      transition:"all .25s ease",
                    }}/>
                  ))}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ height:7, borderRadius:4, background:"rgba(128,128,150,0.16)", overflow:"hidden", marginBottom:4 }}>
                    <div style={{
                      height:"100%", borderRadius:4,
                      width:`${Math.min(100, level*160)}%`,
                      background: zone === "rojo" ? RED : zone === "ambar" ? "#FFC24B" : T.sp[1],
                      transition:"width .12s ease-out, background .25s",
                    }}/>
                  </div>
                  <div style={{ fontSize:10.5, color:K.tx(0.5), fontWeight:600 }}>
                    {zone === "off" ? "Activa el micro para medir el ruido del aula"
                      : zone === "verde" ? "Silencio — perfecto para trabajar"
                      : zone === "ambar" ? "Murmullo de trabajo"
                      : "¡Demasiado ruido!"}
                  </div>
                </div>
              </div>
            </div>

            {/* transcripción */}
            {lines.slice(0, visible).map((line, i) => {
              const col = T.sp[line.spIdx];
              return (
                <div key={line.id} style={{
                  ...K.glass(0.085), borderRadius:r(20), padding:`${sp(11)}px ${sp(14)}px`,
                  animation:`rise .45s ${i*0.06}s cubic-bezier(.2,.8,.3,1) both`,
                }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                    <span style={{ color:`${col}cc`, fontSize:fz(10), fontWeight:700, letterSpacing:"0.14em" }}>{line.speaker}</span>
                    <span style={{ color:K.tx(0.32), fontSize:10, fontVariantNumeric:"tabular-nums" }}>{line.time}</span>
                  </div>
                  <p style={{ color:K.tx(0.88), fontSize:fz(13), lineHeight:1.5, margin:0 }}>{line.text}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ LISTA: asistencia ═══ */}
        {tab === "lista" && (
          <div style={{ display:"flex", flexDirection:"column", gap:sp(8) }}>
            <div style={{ ...K.glass(0.06), borderRadius:r(16), padding:"10px 14px", display:"flex", alignItems:"center", gap:10 }}>
              {[["presente", counts.presente, T.sp[1]],["tarde", counts.tarde, "#FFC24B"],["ausente", counts.ausente, RED]].map(([k,n,col]) => (
                <span key={k} style={{ fontSize:11, fontWeight:800, color:K.tx(0.7), display:"flex", alignItems:"center", gap:5 }}>
                  <span style={{ width:8, height:8, borderRadius:"50%", background:col, boxShadow:`0 0 ${6*G}px ${col}88` }}/>
                  <span style={{ fontVariantNumeric:"tabular-nums" }}>{n}</span>
                </span>
              ))}
              <button onClick={() => setRoster(rs => rs.map(s => ({ ...s, status:"presente" })))} style={{
                marginLeft:"auto", padding:"5px 10px", borderRadius:999,
                border:`1px solid ${T.sp[1]}66`, background:`${T.sp[1]}1F`,
                color:K.tx(0.85), fontSize:10, fontWeight:800,
                fontFamily:"inherit", cursor:"pointer",
              }}>Todos ✓</button>
            </div>

            {roster.map((s, i) => {
              const cfg = ST_CFG[s.status];
              return (
                <div key={s.id} style={{
                  ...K.glass(0.085), borderRadius:r(16), padding:"10px 13px",
                  display:"flex", alignItems:"center", gap:11,
                  animation:`rise .4s ${i*0.04}s cubic-bezier(.2,.8,.3,1) both`,
                }}>
                  <span style={{ color:K.tx(0.9), fontSize:fz(13.5), fontWeight:600, flex:1 }}>{s.name}</span>
                  <button onClick={() => cycleStatus(s.id)} style={{
                    padding:"5px 12px", borderRadius:999,
                    border:`1px solid ${cfg.col}`,
                    background: s.status === "none" ? "transparent" : `${cfg.col}26`,
                    color: s.status === "none" ? K.tx(0.45) : K.tx(0.92),
                    fontSize:10.5, fontWeight:800, fontFamily:"inherit",
                    cursor:"pointer", minWidth:84, transition:"all .2s",
                    boxShadow: s.status !== "none" ? `0 2px ${10*G}px ${cfg.col}40` : "none",
                  }}>{cfg.label}</button>
                  <button onClick={() => removeStudent(s.id)} aria-label="Quitar" style={{
                    border:"none", background:"rgba(128,128,150,0.18)", borderRadius:"50%",
                    width:18, height:18, cursor:"pointer", color:K.tx(0.55),
                    fontSize:11, lineHeight:1, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                  }}>×</button>
                </div>
              );
            })}

            <div style={{ ...K.glass(0.07), borderRadius:999, padding:"5px 5px 5px 14px", display:"flex", alignItems:"center", gap:8 }}>
              <input value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addStudent(); }}
                placeholder="Añadir alumno…"
                style={{ flex:1, background:"transparent", border:"none", outline:"none", color:K.tx(0.92), fontSize:fz(12.5), fontFamily:"inherit" }}/>
              <button onClick={addStudent} style={{
                width:30, height:30, borderRadius:"50%", border:"none",
                background:`linear-gradient(145deg, ${T.hi}, ${T.p})`,
                color:"#fff", fontSize:16, cursor:"pointer", flexShrink:0,
                boxShadow:`0 2px ${10*G}px ${T.p}59`,
              }}>+</button>
            </div>

            <button onClick={exportLista} style={{
              padding:"10px 0", borderRadius:r(14),
              border:`1px solid ${T.p}59`, background:`${T.p}1F`,
              color:K.tx(0.9), fontSize:11, fontWeight:800,
              letterSpacing:"0.06em", textTransform:"uppercase",
              fontFamily:"inherit", cursor:"pointer",
            }}>{copiedLista ? "Lista copiada ✓" : "Copiar asistencia"}</button>
          </div>
        )}

        {/* ═══ PARTICIPA: selector aleatorio + puntos ═══ */}
        {tab === "participa" && (
          <div style={{ display:"flex", flexDirection:"column", gap:sp(8) }}>
            {/* ruleta */}
            <div style={{ ...K.glass(0.09), borderRadius:r(22), padding:"15px 14px", textAlign:"center" }}>
              <div style={{
                minHeight:34, display:"flex", alignItems:"center", justifyContent:"center",
                marginBottom:10,
              }}>
                {winner && !spinning ? (
                  <span style={{
                    fontSize:fz(20), fontWeight:900, color:K.tx(0.97),
                    animation:"pop .35s cubic-bezier(.34,1.5,.64,1) both",
                  }}>🎯 {winner}</span>
                ) : spinning ? (
                  <span style={{ fontSize:fz(15), fontWeight:800, color:T.hi }}>
                    {roster.find(s => s.id === highlightId)?.name || "…"}
                  </span>
                ) : (
                  <span style={{ fontSize:12, color:K.tx(0.45) }}>¿A quién le toca responder?</span>
                )}
              </div>
              <button onClick={spin} disabled={!eligible.length || spinning} style={{
                width:"100%", padding:"12px 0", borderRadius:r(14), border:"none",
                background: eligible.length
                  ? `linear-gradient(145deg, ${T.hi}, ${T.p})`
                  : "rgba(128,128,150,0.2)",
                color:"#fff", fontSize:12.5, fontWeight:800,
                letterSpacing:"0.06em", textTransform:"uppercase",
                fontFamily:"inherit", cursor: eligible.length ? "pointer" : "default",
                boxShadow: eligible.length ? `0 4px ${18*G}px ${T.p}66, 0 1px 1px rgba(255,255,255,0.4) inset` : "none",
              }}>
                {spinning ? "Eligiendo…" : eligible.length ? "🎲 Elegir alumno al azar" : "No quedan alumnos"}
              </button>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:9 }}>
                <button onClick={() => setNoRepeat(v => !v)} style={{
                  border:"none", background:"transparent", cursor:"pointer",
                  fontSize:10.5, fontWeight:700, fontFamily:"inherit",
                  color: noRepeat ? T.hi : K.tx(0.4),
                }}>{noRepeat ? "✓ sin repetir" : "○ puede repetir"}</button>
                <button onClick={() => { setPickedIds([]); setWinner(null); setHighlightId(null); }} style={{
                  border:"none", background:"transparent", cursor:"pointer",
                  fontSize:10.5, fontWeight:700, fontFamily:"inherit", color:K.tx(0.4),
                }}>↺ reiniciar ronda</button>
              </div>
            </div>

            {/* puntos */}
            {roster.map((s, i) => {
              const lead = s.points > 0 && s.points === maxPts;
              return (
                <div key={s.id} style={{
                  ...K.glass(0.085), borderRadius:r(16), padding:"9px 12px",
                  display:"flex", alignItems:"center", gap:10,
                  animation:`rise .4s ${i*0.04}s cubic-bezier(.2,.8,.3,1) both`,
                  border: highlightId === s.id && spinning ? `1px solid ${T.hi}` : undefined,
                  boxShadow: highlightId === s.id && spinning ? `0 0 ${16*G}px ${T.p}66` : undefined,
                  opacity: s.status === "ausente" ? 0.45 : 1,
                }}>
                  <span style={{ color:K.tx(0.9), fontSize:fz(13), fontWeight:600, flex:1, display:"flex", alignItems:"center", gap:6 }}>
                    {s.name}{lead && " 👑"}
                  </span>
                  <button onClick={() => addPoint(s.id, -1)} style={{
                    width:26, height:26, borderRadius:"50%", border:"1px solid rgba(128,128,150,0.3)",
                    background:"transparent", color:K.tx(0.6), fontSize:14, cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}>−</button>
                  <span style={{
                    minWidth:26, textAlign:"center",
                    color: s.points > 0 ? T.hi : K.tx(0.4),
                    fontSize:fz(15), fontWeight:900, fontVariantNumeric:"tabular-nums",
                  }}>{s.points}</span>
                  <button onClick={() => addPoint(s.id, 1)} style={{
                    width:26, height:26, borderRadius:"50%", border:"none",
                    background:`linear-gradient(145deg, ${T.hi}, ${T.p})`,
                    color:"#fff", fontSize:14, cursor:"pointer",
                    boxShadow:`0 2px ${8*G}px ${T.p}59`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}>+</button>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ TIMER ═══ */}
        {tab === "timer" && (
          <div style={{ ...K.glass(0.09), borderRadius:r(24), padding:"18px 16px", textAlign:"center" }}>
            <div style={{ position:"relative", width:140, height:140, margin:"0 auto 14px" }}>
              <svg width="140" height="140">
                <circle cx="70" cy="70" r={RING_R} fill="none" stroke="rgba(128,128,150,0.18)" strokeWidth="9"/>
                <circle cx="70" cy="70" r={RING_R} fill="none"
                  stroke={finished ? RED : T.hi} strokeWidth="9" strokeLinecap="round"
                  strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - prog)}
                  transform="rotate(-90 70 70)"
                  style={{ transition:"stroke-dashoffset .4s ease, stroke .3s", filter:`drop-shadow(0 0 ${8*G}px ${finished ? RED : T.p})` }}/>
              </svg>
              <div style={{
                position:"absolute", inset:0,
                display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
              }}>
                <span style={{
                  fontSize:fz(26), fontWeight:900, fontVariantNumeric:"tabular-nums",
                  color: finished ? RED : K.tx(0.95),
                  animation: finished ? "blink 1s step-start infinite" : "none",
                }}>{fmt(left)}</span>
                {finished && <span style={{ fontSize:11, fontWeight:800, color:RED }}>⏰ ¡Tiempo!</span>}
              </div>
            </div>

            <div style={{ display:"flex", gap:6, justifyContent:"center", marginBottom:10, flexWrap:"wrap" }}>
              {[1,5,10,15].map(m => (
                <button key={m} onClick={() => setPreset(m)} style={{
                  padding:"6px 13px", borderRadius:999,
                  border: total === m*60 ? `1px solid ${T.p}88` : "1px solid rgba(128,128,150,0.25)",
                  background: total === m*60 ? `${T.p}26` : "transparent",
                  color:K.tx(0.8), fontSize:11, fontWeight:800,
                  fontFamily:"inherit", cursor:"pointer",
                }}>{m} min</button>
              ))}
              <button onClick={() => bump(-1)} disabled={running} style={{
                padding:"6px 11px", borderRadius:999, border:"1px solid rgba(128,128,150,0.25)",
                background:"transparent", color:K.tx(0.6), fontSize:11, fontWeight:800,
                fontFamily:"inherit", cursor:"pointer",
              }}>−1</button>
              <button onClick={() => bump(1)} disabled={running} style={{
                padding:"6px 11px", borderRadius:999, border:"1px solid rgba(128,128,150,0.25)",
                background:"transparent", color:K.tx(0.6), fontSize:11, fontWeight:800,
                fontFamily:"inherit", cursor:"pointer",
              }}>+1</button>
            </div>

            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => total > 0 && setRunning(v => !v)} style={{
                flex:1.4, padding:"11px 0", borderRadius:r(14), border:"none",
                background: running
                  ? "linear-gradient(145deg, #FFC24B, #E8960F)"
                  : `linear-gradient(145deg, ${T.hi}, ${T.p})`,
                color:"#fff", fontSize:12, fontWeight:800,
                letterSpacing:"0.08em", textTransform:"uppercase",
                fontFamily:"inherit", cursor:"pointer",
                boxShadow:`0 4px ${16*G}px ${running ? "rgba(255,194,75,0.5)" : `${T.p}66`}, 0 1px 1px rgba(255,255,255,0.4) inset`,
              }}>{running ? "Pausa" : "Iniciar"}</button>
              <button onClick={() => { setRunning(false); setLeft(total); }} style={{
                flex:1, padding:"11px 0", borderRadius:r(14),
                border:"1px solid rgba(128,128,150,0.3)", background:"transparent",
                color:K.tx(0.6), fontSize:12, fontWeight:800,
                letterSpacing:"0.08em", textTransform:"uppercase",
                fontFamily:"inherit", cursor:"pointer",
              }}>Reiniciar</button>
            </div>
          </div>
        )}

        {/* ═══ QUIZ IA ═══ */}
        {tab === "quiz" && (
          <div style={{ display:"flex", flexDirection:"column", gap:sp(8) }}>
            <button onClick={generateQuiz} disabled={quizLoading} style={{
              padding:"12px 0", borderRadius:r(16), border:"none",
              background:`linear-gradient(145deg, ${T.hi}, ${T.p})`,
              color:"#fff", fontSize:12, fontWeight:800,
              letterSpacing:"0.06em", textTransform:"uppercase",
              fontFamily:"inherit", cursor:"pointer",
              boxShadow:`0 4px ${16*G}px ${T.p}66, 0 1px 1px rgba(255,255,255,0.4) inset`,
              opacity: quizLoading ? 0.7 : 1,
            }}>
              {quizLoading ? "Generando preguntas…" : quiz.length ? "↺ Generar otro quiz" : "✨ Quiz de repaso con IA"}
            </button>

            {quizLoading && (
              <div style={{ ...K.glass(0.07), borderRadius:r(16), padding:"14px", display:"flex", justifyContent:"center", gap:4 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width:5, height:5, borderRadius:"50%", background:T.hi, animation:`blink 1.1s ${i*0.18}s ease infinite` }}/>
                ))}
              </div>
            )}
            {quizError && (
              <div style={{ ...K.glass(0.06), borderRadius:r(16), padding:"12px 14px", fontSize:12, color:RED, fontWeight:600 }}>⚠️ {quizError}</div>
            )}
            {!quizLoading && !quiz.length && !quizError && (
              <div style={{ ...K.glass(0.05), borderRadius:r(16), padding:"20px 16px", textAlign:"center" }}>
                <div style={{ fontSize:20, marginBottom:6 }}>🧠</div>
                <div style={{ fontSize:12, color:K.tx(0.5), lineHeight:1.5 }}>
                  La IA creará preguntas de repaso a partir de lo transcrito en la lección.
                </div>
              </div>
            )}

            {quiz.map((c, i) => (
              <button key={c.id} onClick={() => toggleCard(c.id)} style={{
                ...K.glass(0.085), borderRadius:r(18), padding:"13px 15px",
                textAlign:"left", border:"none", cursor:"pointer", fontFamily:"inherit",
                animation:`rise .4s ${i*0.07}s cubic-bezier(.2,.8,.3,1) both`,
              }}>
                <div style={{ display:"flex", gap:9, alignItems:"flex-start" }}>
                  <span style={{
                    width:20, height:20, borderRadius:7, flexShrink:0,
                    background:`linear-gradient(145deg, ${T.hi}, ${T.p})`,
                    color:"#fff", fontSize:10.5, fontWeight:900,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    boxShadow:`0 2px ${8*G}px ${T.p}59`,
                  }}>{i+1}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ color:K.tx(0.92), fontSize:fz(13), fontWeight:600, lineHeight:1.45 }}>{c.q}</div>
                    {c.open ? (
                      <div style={{
                        marginTop:8, padding:"8px 11px", borderRadius:r(11),
                        background:`${T.sp[1]}1C`, border:`1px solid ${T.sp[1]}4D`,
                        color:K.tx(0.85), fontSize:fz(12.5), lineHeight:1.45,
                        animation:"rise .25s ease both",
                      }}>✓ {c.a}</div>
                    ) : (
                      <div style={{ marginTop:5, fontSize:10.5, color:T.hi, fontWeight:700 }}>tocar para ver la respuesta</div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ═══ NOTAS / DEBERES ═══ */}
        {tab === "notas" && (
          <div style={{ display:"flex", flexDirection:"column", gap:sp(8) }}>
            <div style={{ display:"flex", gap:5 }}>
              {Object.entries(NOTE_TYPES).map(([k, t]) => (
                <button key={k} onClick={() => setNoteType(k)} style={{
                  flex:1, padding:"7px 0", borderRadius:r(11),
                  border: noteType === k ? `1px solid ${t.col}88` : "1px solid rgba(128,128,150,0.2)",
                  background: noteType === k ? `${t.col}22` : "transparent",
                  color: noteType === k ? K.tx(0.95) : K.tx(0.45),
                  fontSize:10.5, fontWeight:800, fontFamily:"inherit", cursor:"pointer",
                }}>{t.icon} {t.label}</button>
              ))}
            </div>

            <div style={{ ...K.glass(0.07), borderRadius:999, padding:"5px 5px 5px 14px", display:"flex", alignItems:"center", gap:8 }}>
              <input value={noteText} onChange={e => setNoteText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addNote(); }}
                placeholder={noteType === "deberes" ? "Ej: ejercicios 3 y 4, pág. 52…" : noteType === "examen" ? "Ej: entra el tema 5…" : "Apunta algo rápido…"}
                style={{ flex:1, background:"transparent", border:"none", outline:"none", color:K.tx(0.92), fontSize:fz(12.5), fontFamily:"inherit" }}/>
              <button onClick={addNote} style={{
                width:30, height:30, borderRadius:"50%", border:"none",
                background:`linear-gradient(145deg, ${T.hi}, ${T.p})`,
                color:"#fff", fontSize:16, cursor:"pointer", flexShrink:0,
                boxShadow:`0 2px ${10*G}px ${T.p}59`,
              }}>+</button>
            </div>

            {notes.length === 0 ? (
              <div style={{ ...K.glass(0.05), borderRadius:r(16), padding:"18px", textAlign:"center", fontSize:12, color:K.tx(0.45) }}>
                Sin notas todavía — apunta deberes, avisos de examen o ideas.
              </div>
            ) : notes.map((n, i) => {
              const t = NOTE_TYPES[n.type];
              return (
                <div key={n.id} style={{
                  ...K.glass(0.085), borderRadius:r(15), padding:"10px 13px",
                  display:"flex", alignItems:"center", gap:10,
                  animation:`rise .35s ${i*0.04}s cubic-bezier(.2,.8,.3,1) both`,
                }}>
                  <span style={{ fontSize:14, flexShrink:0 }}>{t.icon}</span>
                  <span style={{ flex:1, color:K.tx(0.88), fontSize:fz(13), lineHeight:1.4 }}>{n.text}</span>
                  <button onClick={() => setNotes(ns => ns.filter(x => x.id !== n.id))} aria-label="Borrar" style={{
                    border:"none", background:"rgba(128,128,150,0.18)", borderRadius:"50%",
                    width:18, height:18, cursor:"pointer", color:K.tx(0.55),
                    fontSize:11, lineHeight:1, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                  }}>×</button>
                </div>
              );
            })}

            <button onClick={exportNotas} style={{
              padding:"10px 0", borderRadius:r(14),
              border:`1px solid ${T.p}59`, background:`${T.p}1F`,
              color:K.tx(0.9), fontSize:11, fontWeight:800,
              letterSpacing:"0.06em", textTransform:"uppercase",
              fontFamily:"inherit", cursor:"pointer",
            }}>{copiedNotas ? "Resumen copiado ✓" : "📋 Copiar resumen para alumnos"}</button>
          </div>
        )}
      </div>

      {/* exportar transcripción */}
      <button onClick={handleExport} style={{
        borderRadius:r(18), padding:`${sp(13)}px 0`, width:"100%",
        background: copied
          ? "linear-gradient(145deg, #00E8A2, #00B87E)"
          : `linear-gradient(145deg, ${T.hi} 0%, ${T.p} 45%, ${T.deep} 100%)`,
        border:"none", color:"#fff", fontSize:fz(12.5), fontWeight:800,
        fontFamily:"inherit", cursor:"pointer",
        letterSpacing:"0.10em", textTransform:"uppercase",
        boxShadow:[
          "0 1px 1px rgba(255,255,255,0.45) inset",
          "0 -2px 5px rgba(0,0,0,0.3) inset",
          copied ? `0 6px ${28*G}px rgba(0,232,162,0.45)` : `0 6px ${28*G}px ${T.p}80`,
        ].join(", "),
        animation:`rise ${dur(0.5)} 0.33s cubic-bezier(.2,.8,.3,1) both`,
      }}>
        {copied ? "Copiado al portapapeles ✓" : "Exportar transcripción ↗"}
      </button>

      <div style={{
        textAlign:"center", marginTop:2,
        fontSize:9, fontWeight:700, letterSpacing:"0.3em",
        color:K.tx(0.18), textTransform:"uppercase",
        animation:`rise ${dur(0.5)} 0.4s cubic-bezier(.2,.8,.3,1) both`,
      }}>
        Huella Profesor · {T.name}
      </div>
    </div>
  );
}

/* ════════════════ APP ════════════════ */
export default function HuellaSuite() {
  const [skin, setSkin] = useState("cristal");           // cristal | slawn
  const [mode, setMode] = useState("classic");           // classic | pro | profesor
  const [proUnlocked, setProUnlocked] = useState(false);
  const [askingPwd, setAskingPwd] = useState(false);
  const [slawnSettingsOpen, setSlawnSettingsOpen] = useState(false);

  const [recording, setRecording] = useState(false);
  const [sec, setSec] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  const [S, setS] = useState(DEFAULTS);
  const set = patch => setS(s => ({ ...s, ...patch }));

  /* estado de pestañas pro (persiste) */
  const [query, setQuery] = useState("");
  const [who, setWho] = useState("TODOS");
  const [chatMsgs, setChatMsgs] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  /* ── Vexa / transcripción en vivo ─────────────────────────────── */
  const [lines, setLines] = useState(DEMO_LINES);
  const [meetingUrl, setMeetingUrl] = useState("");
  const [vexaSession, setVexaSession] = useState(null);
  const pollRef = useRef(null);
  const initCtx = "Eres el asistente integrado del widget HUELLA. Esta es la transcripción de una reunión:\n" +
    DEMO_LINES.map(l => `[${l.time}] ${l.speaker}: ${l.text}`).join("\n") +
    "\nResponde en español, de forma breve y directa, basándote únicamente en la transcripción. Si algo no aparece en ella, dilo.";
  const [transcriptCtx, setTranscriptCtx] = useState(initCtx);
  useEffect(() => {
    setTranscriptCtx(
      "Eres el asistente integrado del widget HUELLA. Esta es la transcripción de una reunión:\n" +
      lines.map(l => `[${l.time}] ${l.speaker}: ${l.text}`).join("\n") +
      "\nResponde en español, de forma breve y directa, basándote únicamente en la transcripción. Si algo no aparece en ella, dilo."
    );
  }, [lines]);

  const toggleRecording = useCallback(async () => {
    if (!recording) {
      if (meetingUrl.trim()) {
        try {
          const r = await fetch("/api/bots", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ meetingUrl }),
          });
          const d = await r.json();
          if (d.platform) {
            setVexaSession(d);
            pollRef.current = setInterval(async () => {
              try {
                const tr = await fetch(`/api/transcript?platform=${encodeURIComponent(d.platform)}&nativeId=${encodeURIComponent(d.nativeId)}`);
                const td = await tr.json();
                if (td.lines?.length > 0) setLines(td.lines);
              } catch {}
            }, 3000);
          }
        } catch (e) { console.error("Vexa:", e); }
      }
      setRecording(true);
    } else {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      if (vexaSession) {
        fetch("/api/bots-stop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(vexaSession),
        }).catch(() => {});
        setVexaSession(null);
      }
      setRecording(false);
    }
  }, [recording, meetingUrl, vexaSession]);

  /* estado del modo profesor (persiste entre modos) */
  const [roster, setRoster] = useState([
    { id:1, name:"Lucía",   status:"none", points:0 },
    { id:2, name:"Mateo",   status:"none", points:0 },
    { id:3, name:"Sofía",   status:"none", points:0 },
    { id:4, name:"Hugo",    status:"none", points:0 },
    { id:5, name:"Valeria", status:"none", points:0 },
    { id:6, name:"Daniel",  status:"none", points:0 },
  ]);
  const [notes, setNotes] = useState([]);

  const timerRef = useRef(null);
  const { level, bands, isReal } = useMicrophone(recording);
  const { pos, onPointerDown } = useDrag();

  useEffect(() => {
    if (recording) timerRef.current = setInterval(() => setSec(s => s+1), 1000);
    else { clearInterval(timerRef.current); setSec(0); }
    return () => clearInterval(timerRef.current);
  }, [recording]);

  const fmt = useCallback(s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`, []);

  const T = useMemo(() => {
    if (S.themeKey === "custom") {
      const h = S.customHue, s = S.customSat;
      return {
        name:"A medida",
        p:hslToHex(h, s, 55), hi:hslToHex(h, s, 72), deep:hslToHex(h, s, 36),
        sp:[hslToHex((h+75)%360, s, 64), hslToHex((h+165)%360, s, 58), hslToHex((h+265)%360, s, 62)],
      };
    }
    return THEMES[S.themeKey];
  }, [S.themeKey, S.customHue, S.customSat]);

  const K = useMemo(() => {
    const light = S.textMode === "claro";
    const tint = light ? "255,255,255" : "20,20,35";
    const tx = o => light ? `rgba(255,255,255,${o})` : `rgba(12,12,24,${o})`;
    const glass = (a = 0.09) => {
      const A = a * S.density;
      return {
        background: `linear-gradient(160deg, rgba(${tint},${A + 0.05*S.density}) 0%, rgba(${tint},${A * 0.5}) 50%, rgba(${tint},${A * 0.75}) 100%)`,
        backdropFilter: `blur(${S.blur}px) saturate(210%)`,
        WebkitBackdropFilter: `blur(${S.blur}px) saturate(210%)`,
        border: "1px solid transparent",
        backgroundClip: "padding-box",
        boxShadow: [
          `0 1px 1px rgba(255,255,255,${light ? 0.35 : 0.5}) inset`,
          "0 -1px 1px rgba(0,0,0,0.18) inset",
          `0 0 0 1px rgba(${tint},0.14) inset`,
          "0 12px 40px rgba(0,0,0,0.30)",
          "0 2px 8px rgba(0,0,0,0.20)",
        ].join(", "),
      };
    };
    return { tx, glass, light };
  }, [S.textMode, S.density, S.blur]);

  const handleExport = async () => {
    const text = ["HUELLA · Transcripción", "─".repeat(28),
      ...lines.map(l => `[${l.time}] ${l.speaker}: ${l.text}`)].join("\n");
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  const sendChat = useCallback(async (preset) => {
    const question = (preset ?? chatInput).trim();
    if (!question || chatLoading) return;
    setChatInput("");
    const next = [...chatMsgs, { role:"user", text:question }];
    setChatMsgs(next);
    setChatLoading(true);
    try {
      const apiMessages = next.map((m, i) => ({
        role: m.role,
        content: i === 0 && m.role === "user" ? `${transcriptCtx}\n\nPregunta: ${m.text}` : m.text,
      }));
      const res = await fetch("/api/ia", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ type:"chat", messages: apiMessages }),
      });
      const data = await res.json();
      const text = (data.content || []).map(b => (b.type === "text" ? b.text : "")).filter(Boolean).join("\n").trim()
        || "No he podido generar una respuesta.";
      setChatMsgs(m => [...m, { role:"assistant", text }]);
    } catch {
      setChatMsgs(m => [...m, { role:"assistant", text:"⚠️ No pude conectar con la IA ahora mismo. Vuelve a intentarlo." }]);
    }
    setChatLoading(false);
  }, [chatInput, chatMsgs, chatLoading]);

  const shared = { recording, setRecording, sec, fmt, bands, level, isReal, pos, onPointerDown, handleExport, copied, minimize: () => setCollapsed(true), toggleRecording, lines, meetingUrl, setMeetingUrl, transcriptCtx };
  const chat = { msgs:chatMsgs, input:chatInput, setInput:setChatInput, loading:chatLoading, send:sendChat, query, setQuery, who, setWho };

  const isSlawn = mode === "classic" && skin === "slawn";

  /* ── CÁPSULA (skin-aware) ── */
  if (collapsed) {
    return (
      <div style={{
        minHeight:"100vh", background:"transparent",
        display:"flex", alignItems:"flex-start", justifyContent:"center",
        padding:24,
        fontFamily: isSlawn ? HAND : "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Patrick+Hand&display=swap');
          @keyframes blink { 50%{opacity:0} }
          @keyframes pop { from{transform:scale(.85);opacity:0} to{transform:scale(1);opacity:1} }
          @keyframes wiggle { 0%,100%{transform:rotate(-2deg)} 50%{transform:rotate(2deg)} }
        `}</style>
        {isSlawn ? (
          <button onClick={() => setCollapsed(false)} style={{
            ...canvasCard(0, -1.5), padding:"9px 18px",
            display:"flex", alignItems:"center", gap:10,
            cursor:"pointer", fontFamily:MARKER, fontSize:15, color:INK, position:"relative",
            transform:`translate(${pos.x}px, ${pos.y}px) rotate(-1.5deg)`,
            animation: recording ? "wiggle 0.5s ease infinite" : "none",
          }}>
            <ScrawlFace color={recording ? S_RED : S_YEL} seed={1} talking={recording} size={26}/>
            HUELLA
            {recording && <span style={{ fontFamily:HAND, fontSize:14, color:S_RED, fontWeight:700 }}>{fmt(sec)}</span>}
            <Drip color={recording ? S_RED : S_YEL} left={24}/>
          </button>
        ) : (
          <button onClick={() => setCollapsed(false)} style={{
            ...K.glass(0.12), borderRadius:999, padding:"10px 18px",
            display:"flex", alignItems:"center", gap:10,
            border:"none", cursor:"pointer", fontFamily:"inherit",
            animation:"pop .3s cubic-bezier(.34,1.4,.64,1) both",
            transform:`translate(${pos.x}px, ${pos.y}px)`,
          }}>
            <div style={{
              width:8, height:8, borderRadius:"50%",
              background: recording ? RED : T.sp[1],
              boxShadow: recording ? `0 0 10px ${RED}` : `0 0 10px ${T.sp[1]}`,
              animation: recording ? "blink 1.2s ease infinite" : "none",
            }}/>
            <span style={{ color:K.tx(0.95), fontSize:13, fontWeight:800 }}>HUELLA</span>
            {mode !== "classic" && <span style={{ color:T.hi, fontSize:9, fontWeight:900, letterSpacing:"0.1em" }}>{mode === "pro" ? "PRO" : "PROF"}</span>}
            {recording && <span style={{ color:K.tx(0.6), fontSize:12, fontWeight:700, fontVariantNumeric:"tabular-nums" }}>{fmt(sec)}</span>}
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{
      minHeight:"100vh", background:"transparent",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily:"-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', sans-serif",
      padding:24, position:"relative", overflow:"hidden",
      WebkitFontSmoothing:"antialiased",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Patrick+Hand&display=swap');
        @keyframes ring   { 0%{transform:scale(1);opacity:.8} 100%{transform:scale(1.85);opacity:0} }
        @keyframes blink  { 50%{opacity:0} }
        @keyframes breathe{ 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes rise   { from{opacity:0;transform:translateY(14px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes spinSlow { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes shimmer  { from{background-position:-200% 0} to{background-position:200% 0} }
        @keyframes pop      { from{transform:scale(.85);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes shakeX   { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-7px)} 40%{transform:translateX(7px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
        @keyframes plop     { from{opacity:0;transform:translateY(12px) rotate(-3deg) scale(.9)} to{opacity:1;transform:translateY(0) rotate(var(--rot,0deg)) scale(1)} }
        @keyframes wiggle   { 0%,100%{transform:rotate(calc(var(--rot,0deg) - 0.6deg))} 50%{transform:rotate(calc(var(--rot,0deg) + 0.6deg))} }
        @keyframes shake    { 0%,100%{transform:translate(0,0) rotate(0)} 25%{transform:translate(-1px,1px) rotate(-1deg)} 75%{transform:translate(1px,-1px) rotate(1deg)} }
        .pro-slider { -webkit-appearance:none; appearance:none; height:5px; border-radius:3px; outline:none; cursor:pointer; }
        .pro-slider::-webkit-slider-thumb {
          -webkit-appearance:none; appearance:none;
          width:15px; height:15px; border-radius:50%;
          background:#fff; border:none;
          box-shadow:0 1px 5px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,0,0,0.1); cursor:grab;
        }
        .pro-slider::-moz-range-thumb { width:15px; height:15px; border-radius:50%; background:#fff; border:none; box-shadow:0 1px 5px rgba(0,0,0,0.45); cursor:grab; }
        .pro-panel::-webkit-scrollbar { width:4px; }
        .pro-panel::-webkit-scrollbar-thumb { background:rgba(128,128,150,0.35); border-radius:2px; }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
        }
      `}</style>

      {mode === "profesor" ? (
        <ProfesorWidget shared={shared} S={S} T={T} K={K}
          exitProfesor={() => setMode("classic")}
          roster={roster} setRoster={setRoster}
          notes={notes} setNotes={setNotes}/>
      ) : mode === "pro" ? (
        <GlassWidget pro shared={shared} S={S} set={set} T={T} K={K}
          skin={skin} setSkin={setSkin}
          askPro={() => setAskingPwd(true)} proUnlocked={proUnlocked}
          enterPro={() => setMode("pro")} exitPro={() => setMode("classic")}
          enterProfesor={() => setMode("profesor")}
          chat={chat}/>
      ) : isSlawn ? (
        <SlawnWidget shared={shared}
          openSettings={() => setSlawnSettingsOpen(o => !o)} settingsOpen={slawnSettingsOpen}
          skin={skin} setSkin={k => { setSkin(k); if (k === "cristal") setSlawnSettingsOpen(false); }}
          caos={S.caos} setCaos={v => set({ caos:v })}
          askPro={() => setAskingPwd(true)} proUnlocked={proUnlocked}
          enterPro={() => setMode("pro")}
          enterProfesor={() => setMode("profesor")}/>
      ) : (
        <GlassWidget pro={false} shared={shared} S={S} set={set} T={T} K={K}
          skin={skin} setSkin={setSkin}
          askPro={() => setAskingPwd(true)} proUnlocked={proUnlocked}
          enterPro={() => setMode("pro")} exitPro={() => setMode("classic")}
          enterProfesor={() => setMode("profesor")}
          chat={chat}/>
      )}

      {askingPwd && (
        <PasswordModal
          skin={isSlawn ? "slawn" : "cristal"} T={T} K={K}
          onClose={() => setAskingPwd(false)}
          onSuccess={() => { setProUnlocked(true); setAskingPwd(false); setMode("pro"); }}/>
      )}
    </div>
  );
}
