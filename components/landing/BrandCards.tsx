import Link from "next/link";
import { ArrowRight } from "lucide-react";

const BRANDS = [
  { name: "Mykonos", query: "Mykonos" },
  { name: "HMNS", query: "HMNS" },
  { name: "SAFF & Co.", query: "SAFF" },
  { name: "Alchemist", query: "Alchemist" },
];

export function BrandCards() {
  return (
    <div
      id="brands"
      aria-label="Fragrance house"
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
    >
      {BRANDS.map((brand) => (
        <Link
          key={brand.name}
          href={`/?search=${encodeURIComponent(brand.query)}#katalog`}
          className="lp-lift group rounded-2xl bg-[#F6F2EC] p-4 sm:p-5 flex flex-col justify-between min-h-[10.5rem]"
        >
          <div className="flex-1 grid place-items-center">
            <span className="font-serif font-bold text-6xl leading-none text-[#9B512F]/85">
              {brand.name.charAt(0)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 pt-3">
            <span className="text-sm sm:text-base font-medium">{brand.name}</span>
            <span className="w-9 h-9 rounded-full bg-[#EAE3D8] grid place-items-center shrink-0 group-hover:bg-[#9B512F] group-hover:text-white transition-colors">
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
