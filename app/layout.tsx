import type { Metadata } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Serif elegan bergaya editorial, selaras dengan tipografi pada gambar hero
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Aura Secrète — Lelang Parfum Langka Penawaran Tertutup (Commit-Reveal)",
  description:
    "Platform lelang parfum ultra-rare & vintage dengan skema komitmen kriptografi SHA-256 Commit-Reveal dan enkripsi data profil AES-256-GCM.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-zinc-100">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}