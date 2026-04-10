import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  ClipboardListIcon,
  DocumentTextIcon,
  LogoutIcon,
  OfficeBuildingIcon,
  SparklesIcon,
} from "@heroicons/react/outline";

const documents = [
  {
    title: "דוח איתור נזילות",
    description: "דוח מקצועי עם מוקדי נזילה, כלי בדיקה, המלצות ותמונות.",
    to: "/dashboard",
    accent: "from-cyan-500 to-emerald-400",
  },
  {
    title: "הצעת מחיר",
    description: "מסמך הצעה ללקוח עם תיאור עבודה, פירוט פריטים, מחיר ותנאים.",
    to: "/documents/price-quote",
    accent: "from-amber-400 to-orange-500",
  },
  {
    title: "סיכום ביקור טכנאי",
    description: "סיכום שירות קצר ומסודר עם ממצאים, עבודה שבוצעה והמשך טיפול.",
    to: "/documents/service-visit",
    accent: "from-slate-700 to-cyan-600",
  },
];

export default function DocumentMenuPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.14),_transparent_24%),radial-gradient(circle_at_bottom_left,_rgba(245,158,11,0.12),_transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-slate-200/70 bg-white/85 px-5 py-4 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <SparklesIcon className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-950">{user?.companyName || "Mismah AI"}</h1>
              <p className="text-sm text-slate-500">בחר איזה מסמך ליצור</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate("/setup-profile")}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
            >
              <span className="inline-flex items-center gap-2">
                <OfficeBuildingIcon className="h-4 w-4" />
                פרטי חברה
              </span>
            </button>
            {user?.isAdmin && (
              <button
                type="button"
                onClick={() => navigate("/admin")}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
              >
                לוח ניהול
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
            >
              <span className="inline-flex items-center gap-2">
                <LogoutIcon className="h-4 w-4" />
                התנתקות
              </span>
            </button>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200/70 bg-white/90 p-5 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.3)] sm:p-8">
          <div className="mb-6 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">Document menu</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950">מה תרצה ליצור?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              כל מסמך משתמש בפרטי החברה שלך, במיתוג ובמכסת המסמכים החודשית של החשבון.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {documents.map((doc) => (
              <button
                key={doc.to}
                type="button"
                onClick={() => navigate(doc.to)}
                className="group rounded-[1.75rem] border border-slate-200 bg-white p-5 text-right shadow-sm transition hover:-translate-y-1 hover:border-cyan-200 hover:shadow-xl"
              >
                <span className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${doc.accent} text-white`}>
                  {doc.to === "/dashboard" ? <DocumentTextIcon className="h-6 w-6" /> : <ClipboardListIcon className="h-6 w-6" />}
                </span>
                <h3 className="text-lg font-bold text-slate-950">{doc.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{doc.description}</p>
                <p className="mt-5 text-sm font-semibold text-cyan-700 transition group-hover:text-cyan-900">
                  פתח מסמך
                </p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
