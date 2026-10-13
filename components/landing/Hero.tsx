import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  Lock,
  ShieldCheck,
  Trophy,
} from "lucide-react";

export function Hero({
  imageSrc = "/landing/hero-perfume.webp",
  imageAlt = "Parfum dengan kabut aroma dan bunga gardenia",
}: {
  imageSrc?: string;
  imageAlt?: string;
}) {
  return (
    <section className="relative w-full min-h-[760px] lg:min-h-[860px] flex items-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-right md:object-center"
        />
        <div className="absolute inset-0 lp-hero-glow" />
        <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-[#F6F1EA]/85 to-transparent" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full pt-28 pb-44">
        <div className="max-w-2xl space-y-6">
          <span className="lp-eyebrow">Discover rare fragrances</span>
          <h1 className="font-serif font-bold uppercase leading-[0.92] tracking-tight text-4xl sm:text-6xl lg:text-[4rem] text-[#1E1A17]">
            TEMUKAN AROMA LANGKA.
          </h1>
          <p className="font-serif font-medium uppercase tracking-tight text-2xl sm:text-3xl lg:text-[2.25rem] text-[#1E1A17]/80 mt-4">
            Menangkan dengan elegan.
          </p>
          <p className="max-w-md text-sm sm:text-base text-[#1E1A17]/75 leading-relaxed">
            Jelajahi koleksi parfum pilihan dan ikuti lelang dengan mekanisme
            penawaran tertutup yang dirancang untuk menjaga kerahasiaan serta
            integritas penawaran.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href="#katalog"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#9B512F] hover:bg-[#7F3F22] text-white text-sm font-medium transition-colors shadow-md"
            >
              Jelajahi Koleksi <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="#cara-kerja"
              className="inline-flex items-center px-6 py-3 rounded-full border border-[#1E1A17]/20 bg-white/50 backdrop-blur-sm text-[#1E1A17] hover:bg-white text-sm font-medium transition-colors"
            >
              Cara Kerja
            </Link>
          </div>
          <div className="flex items-center gap-3 pt-3">
            <div className="flex -space-x-2">
              {[Lock, Eye, Trophy].map((Icon, index) => (
                <span
                  key={index}
                  className="w-9 h-9 rounded-full bg-[#F1E9DD] border-2 border-[#F6F1EA] grid place-items-center text-[#9B512F]"
                >
                  <Icon className="w-4 h-4" />
                </span>
              ))}
            </div>
            <div className="leading-tight">
              <div className="font-serif font-bold uppercase text-lg">
                3 Fase
              </div>
              <div className="text-xs text-[#1E1A17]/65">
                Commit · Reveal · Pemenang
              </div>
            </div>
          </div>
        </div>
      </div>
      <Link
        href="#lelang-unggulan"
        className="hidden lg:flex absolute right-10 top-32 z-10 w-72 items-center gap-4 rounded-2xl bg-[#FDFBF8]/95 backdrop-blur p-4 shadow-lg hover:shadow-xl transition-shadow"
      >
        <span className="w-14 h-14 rounded-xl bg-[#F1E9DD] grid place-items-center text-[#9B512F] shrink-0">
          <Lock className="w-6 h-6" />
        </span>
        <span className="leading-tight">
          <span className="block text-xs text-[#1E1A17]/60">Mekanisme</span>
          <span className="block font-serif font-bold uppercase text-xl">
            Sealed-Bid
          </span>
          <span className="block text-xs text-[#1E1A17]/60 mt-1">
            Penawaran dibuka bertahap
          </span>
        </span>
        <ArrowRight className="w-4 h-4 ml-auto text-[#1E1A17]/60" />
      </Link>
      <div className="hidden lg:block absolute right-10 bottom-40 z-10 w-72 rounded-2xl bg-[#FDFBF8]/95 backdrop-blur p-4 shadow-lg space-y-3">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-[#F1E9DD] grid place-items-center text-[#1E1A17] shrink-0">
            <Lock className="w-4 h-4" />
          </span>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Commit Tersegel</div>
            <div className="text-xs text-[#1E1A17]/60">
              Hanya hash SHA-256 dikirim
            </div>
          </div>
        </div>
        <div className="h-px bg-[#E7DFD3]" />
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-[#F1E9DD] grid place-items-center text-[#1E1A17] shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </span>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Data Terenkripsi</div>
            <div className="text-xs text-[#1E1A17]/60">
              Profil dilindungi AES-256-GCM
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
