interface BrandMarkProps {
  tone?: "auth" | "app";
  compact?: boolean;
}

export default function BrandMark({ tone = "auth", compact = false }: BrandMarkProps) {
  const isApp = tone === "app";
  const frameClasses = isApp
    ? "border border-cyan-100 bg-[linear-gradient(145deg,#ecfeff_0%,#ffffff_55%,#fef3c7_100%)] text-slate-900 shadow-[0_12px_30px_-20px_rgba(14,165,233,0.55)]"
    : "border border-white/12 bg-[linear-gradient(145deg,rgba(34,211,238,0.18)_0%,rgba(15,23,42,0.25)_52%,rgba(250,204,21,0.14)_100%)] text-white shadow-[0_18px_45px_-24px_rgba(8,145,178,0.75)] backdrop-blur";
  const titleClasses = isApp ? "text-slate-950" : "text-white";
  const subtitleClasses = isApp ? "text-slate-500" : "text-slate-300/80";
  const monogramClasses = isApp
    ? "border border-cyan-100 bg-slate-950 text-cyan-100"
    : "border border-white/12 bg-white/10 text-cyan-100";
  const accentClasses = isApp ? "text-cyan-600" : "text-cyan-200";

  return (
    <div
      className={`inline-flex items-center gap-3 rounded-[1.4rem] px-3 py-2 transition ${frameClasses} ${
        compact ? "pr-2.5" : "pr-3.5"
      }`}
    >
      <span className={`relative inline-flex h-11 w-11 items-center justify-center rounded-[1rem] ${monogramClasses}`}>
        <svg viewBox="0 0 52 52" className="h-7 w-7" aria-hidden="true">
          <path
            d="M14 11.5h17.5L38 18v20.5a2.5 2.5 0 0 1-2.5 2.5h-21A2.5 2.5 0 0 1 12 38.5V14a2.5 2.5 0 0 1 2-2.45Z"
            fill="currentColor"
            fillOpacity="0.14"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path d="M31.5 11.5V18H38" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path
            d="M18.5 33.5V21.5l6.5 7.5 6.5-7.5v12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M39.5 10.5l1.2 2.9 2.8 1.1-2.8 1.2-1.2 2.9-1.1-2.9-2.9-1.2 2.9-1.1 1.1-2.9Z" fill="currentColor" />
        </svg>
      </span>

      <span className="flex flex-col items-start leading-none">
        <span className={`text-[1rem] font-semibold tracking-[0.16em] ${titleClasses}`}>MISMAH</span>
        <span className={`mt-1 flex items-center gap-2 text-[0.69rem] font-medium tracking-[0.28em] ${subtitleClasses}`}>
          <span className={accentClasses}>AI</span>
          <span>SMART PDF STUDIO</span>
        </span>
      </span>
    </div>
  );
}
