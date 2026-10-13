type PerfumeIllustrationProps = {
  className?: string;
};

export function PerfumeIllustration({ className }: PerfumeIllustrationProps) {
  return (
    <svg
      viewBox="0 0 400 460"
      role="img"
      aria-label="Ilustrasi botol parfum"
      className={className}
    >
      <defs>
        <linearGradient id="lp-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ebbd90" />
          <stop offset="0.55" stopColor="#c9783f" />
          <stop offset="1" stopColor="#8a4122" />
        </linearGradient>
        <linearGradient id="lp-cap" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3a2f26" />
          <stop offset="0.5" stopColor="#5a4636" />
          <stop offset="1" stopColor="#2b241d" />
        </linearGradient>
        <linearGradient id="lp-stone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ddd2bd" />
          <stop offset="1" stopColor="#bfb199" />
        </linearGradient>
      </defs>
      <ellipse cx="200" cy="405" rx="150" ry="22" fill="#3c2814" opacity=".16" />
      <path
        d="M70 380h260l-20 52H90z"
        fill="url(#lp-stone)"
        stroke="#a99b83"
        strokeWidth="2"
      />
      <rect x="143" y="132" width="114" height="220" rx="22" fill="url(#lp-glass)" stroke="#f7e1c7" strokeWidth="5" />
      <path d="M158 159v160" stroke="#fff4e5" strokeWidth="8" strokeLinecap="round" opacity=".55" />
      <rect x="184" y="102" width="32" height="34" rx="4" fill="#d9c1a0" />
      <rect x="178" y="60" width="44" height="46" rx="6" fill="url(#lp-cap)" />
      <rect x="151" y="218" width="98" height="78" rx="6" fill="#faf5ea" />
      <text
        x="200"
        y="255"
        textAnchor="middle"
        fontSize="15"
        letterSpacing="3"
        fill="#2b241d"
        style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontWeight: 700 }}
      >
        AURA
      </text>
      <text
        x="200"
        y="278"
        textAnchor="middle"
        fontSize="11"
        letterSpacing="2.5"
        fill="#a9532f"
        style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontWeight: 600 }}
      >
        SECRÈTE
      </text>
    </svg>
  );
}
