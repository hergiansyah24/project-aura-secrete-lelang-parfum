import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="pt-16 pb-12 mt-12 text-[#231B16]">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex flex-col md:flex-row items-center justify-between pb-8 gap-6 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-[#7F3F22]/40 bg-white/60 flex items-center justify-center text-[#7F3F22] font-serif font-bold text-xs shadow-sm">
              AS
            </div>
            <div>
              <span className="font-serif font-bold text-sm tracking-[0.16em] uppercase text-[#1E1A17]">
                Aura Secrète
              </span>
              <span className="block text-[11px] text-[#4E443B] font-normal">
                Exclusive Perfume Auction
              </span>
            </div>
          </div>
          <div className="flex items-center flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-[#2E241E] font-medium">
            <Link href="/" className="hover:text-[#7F3F22] transition-colors">
              Beranda
            </Link>
            <Link
              href="#katalog"
              className="hover:text-[#7F3F22] transition-colors"
            >
              Katalog
            </Link>
            <Link
              href="#cara-kerja"
              className="hover:text-[#7F3F22] transition-colors"
            >
              Cara Kerja
            </Link>
            <Link
              href="#keamanan"
              className="hover:text-[#7F3F22] transition-colors"
            >
              Keamanan
            </Link>
          </div>
        </div>
        <div className="pt-6 border-t border-[#EAE1D3] text-center text-[11px] text-[#4E443B] font-normal">
          © 2026 Aura Secrète · Proyek Mata Kuliah
          Pemrograman Web &amp; Keamanan Siber by rizqy
        </div>
      </div>
    </footer>
  );
}
