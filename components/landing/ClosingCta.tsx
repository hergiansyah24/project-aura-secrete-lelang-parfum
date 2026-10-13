import Link from "next/link";

export function ClosingCta() {
  return (
    <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
      <div className="relative overflow-hidden rounded-3xl bg-[#EDE4D6] border border-[#EAE1D3]/80 py-12 px-6 sm:px-12 text-center shadow-sm">
        <svg
          aria-hidden={true}
          className="absolute -left-10 -bottom-10 w-52 h-52 text-[#9B512F]/10 pointer-events-none"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          viewBox="0 0 100 100"
        >
          <circle cx="50" cy="50" r="40" />
          <path d="M50 10 C60 35 65 35 90 50 C65 65 60 65 50 90 C40 65 35 65 10 50 C35 35 40 35 50 10 Z" />
        </svg>
        <svg
          aria-hidden={true}
          className="absolute -right-8 -bottom-8 w-60 h-60 text-[#9B512F]/10 pointer-events-none"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          viewBox="0 0 100 100"
        >
          <path d="M0 80 Q50 30 100 80" />
          <path d="M20 100 Q60 50 100 100" />
        </svg>
        <div className="relative z-10 max-w-xl mx-auto space-y-4">
          <h2 className="font-serif text-4xl sm:text-5xl text-[#1E1A17] font-bold uppercase tracking-tight leading-[0.95]">
            Siap menemukan parfum langka berikutnya?
          </h2>
          <p className="text-xs sm:text-sm text-[#2E241E]/75 font-light">
            Jelajahi koleksi lelang eksklusif dan temukan aroma yang sempurna
            untuk Anda.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Link
              href="#katalog"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#9B512F] hover:bg-[#7F3F22] text-white text-xs font-semibold tracking-wider transition-colors shadow-sm"
            >
              <span>Jelajahi Koleksi</span>
              <span aria-hidden={true}>→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
