import type { Metadata } from "next";
import { Barlow_Condensed, Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthContext";

// Teks isi & UI: sans bersih seperti pada referensi
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Judul: sans kondensed tebal (dipakai lewat kelas `font-serif` yang sudah
// ada di komponen, jadi semua judul di seluruh halaman ikut berganti)
const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Riggisa parfume Secrète — Lelang Parfum Langka Penawaran Tertutup (Commit-Reveal)",
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
      className={`${inter.variable} ${barlow.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-zinc-100">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}