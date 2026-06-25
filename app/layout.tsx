import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Job Hunter — JC Turgné",
  description: "Tableau de bord de recherche d'emploi",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Job Hunter" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0f1e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" style={{ height: "100%" }}>
      <body style={{ height: "100%" }}>{children}</body>
    </html>
  );
}
