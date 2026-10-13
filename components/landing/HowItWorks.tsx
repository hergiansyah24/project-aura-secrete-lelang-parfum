import { Eye, Lock, Trophy } from "lucide-react";

const STEPS = [
  {
    icon: Lock,
    title: "1. Commit",
    body: "Masukkan penawaran Anda secara tertutup. Sistem akan menghasilkan hash sebagai bukti komitmen.",
  },
  {
    icon: Eye,
    title: "2. Reveal",
    body: "Ungkapkan penawaran Anda sesuai waktu yang ditentukan. Sistem akan memverifikasi keaslian data Anda.",
  },
  {
    icon: Trophy,
    title: "3. Pemenang",
    body: "Penawaran valid tertinggi akan menjadi pemenang. Hasil lelang diumumkan secara transparan.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="cara-kerja"
      className="scroll-mt-24 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12"
    >
      <div className="mb-12">
        <span className="lp-eyebrow mb-1">Cara Kerja</span>
        <h2 className="font-serif text-4xl sm:text-5xl text-[#1E1A17] font-bold uppercase tracking-tight leading-[0.95]">
          Mekanisme Sealed-Bid yang Aman.
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {STEPS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="space-y-4">
            <div className="w-12 h-12 rounded-full border border-[#DED1BF] bg-white flex items-center justify-center shadow-sm">
              <Icon className="w-5 h-5 text-[#231B16]" strokeWidth={1.8} />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#1E1A17]">
              {title}
            </h3>
            <p className="text-xs text-[#2E241E]/75 leading-relaxed font-light">
              {body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
