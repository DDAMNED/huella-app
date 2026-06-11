"use client";

import dynamic from "next/dynamic";

// Importar el widget con SSR desactivado (usa APIs del navegador: AudioContext, navigator, etc.)
const HuellaWidget = dynamic(() => import("../components/HuellaWidget"), { ssr: false });

export default function Home() {
  return <HuellaWidget />;
}
