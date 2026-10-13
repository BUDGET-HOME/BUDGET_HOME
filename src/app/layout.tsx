import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Budget & Projet Immo",
  description: "Gestion de budget familiale et simulateur d'achat immobilier",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
