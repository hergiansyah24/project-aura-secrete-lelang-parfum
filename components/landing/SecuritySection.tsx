import {
  Eye,
  Lock,
  ShieldCheck,
  ShieldHalf,
} from "lucide-react";

const ITEMS = [
  {
    icon: ShieldHalf,
    title: "SHA-256 Commitment",
    body: "Hash unik untuk setiap penawaran.",
  },
  {
    icon: Lock,
    title: "AES-256-GCM",
    body: "Melindungi data pribadi nama, telepon, dan alamat.",
  },
  {
    icon: Eye,
    title: "Verifikasi Integritas",
    body: "Memastikan keaslian setiap penawaran.",
  },
  {
    icon: ShieldCheck,
    title: "Otorisasi & Audit Log",
    body: "Akses admin terotorisasi dan tindakan penting tercatat.",
  },
];

export function SecuritySection() {
  return (
    <section
      id="keamanan"
      className="scroll-mt-24 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-5 space-y-4">
          <span className="lp-eyebrow">Keamanan</span>
          <h2 className="font-serif text-4xl sm:text-5xl text-[#1E1A17] font-bold uppercase tracking-tight leading-[0.95]">
            Terpercaya dengan <br />
            Teknologi Terdepan.
          </h2>
          <p className="text-xs sm:text-sm text-[#2E241E]/75 font-light leading-relaxed max-w-md pt-1">
            Keamanan data dan integritas lelang adalah prioritas utama kami.
            Dengan teknologi kriptografi dan sistem keamanan modern, setiap
            penawaran Anda terlindungi.
          </p>
        </div>
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ITEMS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="bg-[#FDFBF8] border border-[#EAE1D3]/80 rounded-2xl p-6 space-y-4"
            >
              <div className="w-11 h-11 rounded-full bg-[#F1E9DD] grid place-items-center text-[#7F3F22]">
                <Icon className="w-5 h-5" strokeWidth={1.8} />
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-lg font-bold text-[#1E1A17]">
                  {title}
                </h3>
                <p className="text-xs text-[#2E241E]/75 leading-relaxed font-light">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
