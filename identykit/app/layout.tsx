import "./globals.css";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Identy-Kit — Tu identidad, segura en un QR",
  description: "Tu información esencial protegida, lista para una emergencia.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta name="theme-color" content="#08080c" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body>
        <ClerkProvider>
          <div className="halo" />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
