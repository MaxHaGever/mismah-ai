import BrandMark from "./BrandMark";

interface SiteFooterProps {
  tone?: "auth" | "app";
}

const footerItems = [
  "מסמכים מקצועיים בעברית",
  "עד 5 תמונות לכל מסמך",
  "עיצוב וסידור בסיוע AI",
];

export default function SiteFooter({ tone = "app" }: SiteFooterProps) {
  const isApp = tone === "app";

  return (
    <footer
      className={`mt-10 border-t px-4 py-6 sm:px-6 lg:px-8 ${
        isApp ? "border-slate-200/80 text-slate-600" : "border-white/10 text-slate-300"
      }`}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <BrandMark tone={isApp ? "app" : "auth"} />
          <p className={`max-w-xl text-sm leading-6 ${isApp ? "text-slate-500" : "text-slate-300/85"}`}>
            מערכת ליצירת דוחות, הצעות מחיר וסיכומי ביקור שנראים מסודרים ללקוח כבר מהגרסה הראשונה.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
            {footerItems.map((item) => (
              <span
                key={item}
                className={`border px-3 py-1.5 text-xs font-medium tracking-[0.08em] ${
                  isApp
                    ? "border-slate-200 bg-white/80 text-slate-600"
                    : "border-white/12 bg-white/5 text-slate-200"
                }`}
              >
                {item}
              </span>
            ))}
          </div>
          <p className={`text-xs ${isApp ? "text-slate-400" : "text-slate-400/90"}`}>
            בקשות גישה ותמיכה:{" "}
            <span dir="ltr" className="font-medium">
              maxspectorr@gmail.com
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
