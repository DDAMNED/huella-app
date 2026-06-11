import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HUELLA",
  description: "Transcripción inteligente de reuniones",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: 0, background: "transparent" }}>
        {children}
      </body>
    </html>
  );
}
