import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { isAxiosError } from "axios";
import api from "../lib/axios";
import {
  CheckCircleIcon,
  ClipboardListIcon,
  DownloadIcon,
  ExclamationCircleIcon,
  LogoutIcon,
  OfficeBuildingIcon,
  PhotographIcon,
  SparklesIcon,
  TrashIcon,
  UserCircleIcon,
} from "@heroicons/react/outline";
import { useAuth } from "../hooks/useAuth";
import SiteFooter from "../components/SiteFooter";

interface UploadedImageResponse {
  url: string;
  description: string;
}

interface ImageDraft {
  file: File;
  preview: string;
  description: string;
}

const MAX_IMAGES = 5;

const documentConfig = {
  "price-quote": {
    title: "הצעת מחיר",
    available: false,
    endpoint: "/ai/price-quote",
    helper: "כתוב למי ההצעה, מה העבודה, מחיר, תוקף ההצעה ותנאי תשלום.",
    placeholder:
      "לדוגמה: להכין הצעת מחיר ללקוח יואב כהן עבור תיקון איטום במרפסת והחלפת מקטע צנרת. העבודה כוללת חומרים, עבודה ובדיקת סיום. המחיר הכולל 2,800 ש״ח לפני מע״מ, ההצעה בתוקף ל-14 יום...",
    keywords: {
      "פרטי לקוח": ["שם הלקוח", "כתובת הלקוח"],
      "פרטי ההצעה": ["תיאור העבודה", "מחיר", "תוקף ההצעה"],
      "תנאים": ["תנאי תשלום", "הערות"],
    },
    patterns: {
      "שם הלקוח": /לקוח|לקוחה|עבור|שם הלקוח/i,
      "כתובת הלקוח": /כתובת|רחוב|רח׳|שדרות|דירה|עיר/i,
      "תיאור העבודה": /עבודה|תיקון|החלפה|התקנה|איטום|כולל|לבצע/i,
      "מחיר": /מחיר|עלות|סכום|סה"כ|ש״ח|₪|מע״מ|\d{2,}/i,
      "תוקף ההצעה": /תוקף|בתוקף|ימים|עד תאריך/i,
      "תנאי תשלום": /תשלום|מקדמה|שוטף|אשראי|העברה|מזומן/i,
      "הערות": /הערה|בנוסף|חשוב|אחריות|לא כולל/i,
    },
  },
  "service-visit": {
    title: "סיכום ביקור טכנאי",
    available: false,
    endpoint: "/ai/service-visit",
    helper: "כתוב מה קרה בביקור, מה נמצא, מה בוצע ומה מומלץ להמשך.",
    placeholder:
      "לדוגמה: אתמול הטכנאי דוד לוי הגיע ללקוח יואב כהן ברחוב הגפן 12 בחיפה. נבדקה רטיבות בחדר הרחצה, בוצע חיזוק חיבור בצנרת ונמצאה המלצה להחליף אטם ולבצע בדיקה חוזרת בעוד שבוע...",
    keywords: {
      "פרטי ביקור": ["שם הלקוח", "כתובת", "שם הטכנאי", "תאריך"],
      "סיכום עבודה": ["מה בוצע", "ממצאים"],
      "המשך טיפול": ["המלצות", "הערות"],
    },
    patterns: {
      "שם הלקוח": /לקוח|לקוחה|עבור|אצל/i,
      "כתובת": /כתובת|רחוב|רח׳|שדרות|דירה|חיפה|תל אביב|ירושלים/i,
      "שם הטכנאי": /טכנאי|הטכנאי|בוצע על ידי|הגיע\s+\S+|שם הטכנאי/i,
      "תאריך": /היום|אתמול|בתאריך|\b\d{1,2}[./-]\d{1,2}/i,
      "מה בוצע": /בוצע|תוקן|הוחלף|נבדק|חוזק|הותקן/i,
      "ממצאים": /נמצא|זוהה|ממצא|רטיבות|תקלה|בעיה|כשל/i,
      "המלצות": /מומלץ|המלצה|יש לבצע|נדרש|כדאי|להחליף/i,
      "הערות": /הערה|בנוסף|חשוב|מעקב|בדיקה חוזרת/i,
    },
  },
} as const;

type DocumentSlug = keyof typeof documentConfig;

export default function SimpleDocumentPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { type } = useParams();
  const config = documentConfig[type as DocumentSlug];

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<ImageDraft[]>([]);

  const keywordState = useMemo(() => {
    if (!config) return { all: [] as string[], matched: new Set<string>(), groups: [] as { group: string; keywords: string[]; complete: boolean }[] };
    const all = Object.values(config.keywords).flat();
    const matched = new Set<string>();
    all.forEach((keyword) => {
      const pattern = config.patterns[keyword as keyof typeof config.patterns] as RegExp | undefined;
      if (pattern?.test(prompt)) matched.add(keyword);
    });
    const groups = Object.entries(config.keywords).map(([group, keywords]) => {
      const keywordList = [...keywords] as string[];
      return {
      group,
      keywords: keywordList,
      complete: keywordList.every((keyword) => matched.has(keyword)),
    };
    });
    return { all, matched, groups };
  }, [config, prompt]);

  const matchedCount = keywordState.matched.size;
  const totalKeywords = keywordState.all.length;
  const missingCount = totalKeywords - matchedCount;
  const progressPercent = totalKeywords ? Math.round((matchedCount / totalKeywords) * 100) : 0;
  const progressTone =
    progressPercent >= 75
      ? "from-emerald-500 to-lime-400"
      : progressPercent >= 45
        ? "from-cyan-500 to-emerald-400"
        : "from-amber-400 to-cyan-500";

  if (!config) {
    return null;
  }

  if (!config.available) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.14),_transparent_24%),radial-gradient(circle_at_bottom_left,_rgba(245,158,11,0.12),_transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-6 sm:px-6 lg:px-8"
      >
        <div className="mx-auto flex min-h-[80vh] max-w-3xl flex-col justify-center gap-6">
          <section className="rounded-[2rem] border border-slate-200/70 bg-white/90 p-8 text-center shadow-[0_24px_70px_-40px_rgba(15,23,42,0.3)]">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-500">
              <ClipboardListIcon className="h-7 w-7" />
            </span>
            <h1 className="mt-5 text-2xl font-bold text-slate-950">{config.title}</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              המסמך הזה עדיין לא פתוח ללקוחות. כרגע אפשר ליצור רק דוח איתור נזילות.
            </p>
            <button
              type="button"
              onClick={() => navigate('/documents')}
              className="mt-6 inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-cyan-300 hover:text-cyan-700"
            >
              חזור לבחירת מסמך
            </button>
          </section>
          <SiteFooter tone="app" />
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, MAX_IMAGES - images.length);
    const newItems = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      description: "",
    }));
    setImages((prev) => [...prev, ...newItems]);
  };

  const handleDescChange = (index: number, description: string) => {
    setImages((prev) => prev.map((img, i) => (i === index ? { ...img, description } : img)));
  };

  const handleRemove = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPdfUrl(null);

    try {
      let uploadedImages: UploadedImageResponse[] = [];

      if (images.length) {
        const formData = new FormData();
        images.forEach((img) => formData.append("images", img.file));
        formData.append("descriptions", JSON.stringify(images.map((img) => img.description)));

        const uploadRes = await api.post("/uploads/images", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        uploadedImages = uploadRes.data.images;
      }

      const pdfRes = await api.post(
        config.endpoint,
        { prompt, images: uploadedImages },
        { responseType: "blob" }
      );
      const blob = new Blob([pdfRes.data], { type: "application/pdf" });
      setPdfUrl(URL.createObjectURL(blob));
    } catch (err) {
      if (isAxiosError(err) && typeof err.response?.data?.error === "string") {
        setError(err.response.data.error);
      } else {
        setError("שגיאה ביצירת המסמך");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.14),_transparent_24%),radial-gradient(circle_at_bottom_left,_rgba(245,158,11,0.12),_transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-slate-200/70 bg-white/85 px-5 py-4 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="flex items-center gap-3">
            {user?.companyLogo ? (
              <img
                src={user.companyLogo.startsWith("http") ? user.companyLogo : `/${user.companyLogo.replace(/^\/+/, "")}`}
                alt="Logo"
                className="h-12 w-12 rounded-2xl border border-slate-200 object-cover"
                crossOrigin="use-credentials"
              />
            ) : (
              <UserCircleIcon className="h-12 w-12 text-slate-400" />
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-950">{user?.companyName || "מסמך"}</h1>
              <p className="text-sm text-slate-500">יצירת {config.title}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate("/documents")}
              className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-medium text-cyan-800 transition hover:bg-cyan-100"
            >
              <span className="inline-flex items-center gap-2">
                <ClipboardListIcon className="h-4 w-4" />
                בחירת מסמך
              </span>
            </button>
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
            {user?.authProvider !== "google" && (
              <button
                type="button"
                onClick={() => navigate("/update-password", { state: { from: `/documents/${type}` } })}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
              >
                שינוי סיסמה
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

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-[2rem] border border-slate-200/70 bg-white/90 p-5 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.3)] sm:p-6"
          >
            <div className="grid gap-6">
              <section className="grid gap-5 rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_38%,#f0fdfa_100%)] p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">AI document</p>
                    <h1 className="mt-2 text-3xl font-bold text-slate-950">{config.title}</h1>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{config.helper}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-white px-3 py-1.5 text-slate-700 shadow-sm">{matchedCount} זוהו</span>
                    <span className="rounded-full bg-white px-3 py-1.5 text-slate-700 shadow-sm">{missingCount} נותרו</span>
                  </div>
                </div>

                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={config.placeholder}
                  rows={10}
                  className="w-full rounded-[1.75rem] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-4 focus:ring-cyan-100"
                />

                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">התקדמות השדות</p>
                      <p className="text-xs leading-5 text-slate-500">
                        {matchedCount} מתוך {totalKeywords} כבר נקלטו, {missingCount} עדיין חסרים.
                      </p>
                    </div>
                    <div className="text-sm font-bold text-slate-700">{progressPercent}%</div>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${progressTone} transition-all duration-500`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-950">תמונות ותיאורים</h3>
                    <p className="text-sm leading-6 text-slate-600">אפשר לצרף עד 5 תמונות שיופיעו במסמך.</p>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
                    {images.length}/{MAX_IMAGES}
                  </div>
                </div>

                <div className="relative rounded-[1.75rem] border-2 border-dashed border-slate-300 bg-white px-5 py-8 text-center transition hover:border-cyan-300 hover:bg-cyan-50/50">
                  <PhotographIcon className="mx-auto h-11 w-11 text-slate-400" />
                  <p className="mt-3 text-sm font-semibold text-slate-700">גרור לכאן תמונות או לחץ כדי להוסיף</p>
                  <p className="mt-1 text-sm text-slate-500">תיאור קצר לכל תמונה יעזור למסמך להיות מדויק יותר.</p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleAddImages}
                    disabled={images.length >= MAX_IMAGES}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </div>

                <div className="mt-4 grid gap-3">
                  {images.map((img, idx) => (
                    <div key={idx} className="grid gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-3 sm:grid-cols-[80px_1fr_auto] sm:items-center">
                      <img src={img.preview} alt="preview" className="h-20 w-20 rounded-2xl object-cover" />
                      <input
                        type="text"
                        value={img.description}
                        onChange={(e) => handleDescChange(idx, e.target.value)}
                        placeholder={`תיאור תמונה ${idx + 1}`}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-4 focus:ring-cyan-100"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemove(idx)}
                        className="inline-flex items-center justify-center rounded-full p-2 transition hover:bg-rose-50"
                      >
                        <TrashIcon className="h-5 w-5 text-rose-600" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="grid gap-3 border-t border-slate-200 pt-2">
                {error && (
                  <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-700">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !prompt.trim()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <SparklesIcon className="h-5 w-5" />
                  {loading ? "יוצר מסמך..." : `צור ${config.title}`}
                </button>

                {pdfUrl && (
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100"
                  >
                    <DownloadIcon className="h-5 w-5" />
                    פתח את המסמך שנוצר
                  </a>
                )}
              </section>
            </div>
          </form>

          <aside className="grid gap-5">
            <section className="rounded-[2rem] border border-slate-200/70 bg-white/90 p-5 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.3)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">מילות מפתח</p>
                  <h2 className="text-lg font-bold text-slate-950">מה כבר זוהה ומה עוד חסר</h2>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  {matchedCount}/{totalKeywords}
                </div>
              </div>

              <div className="grid gap-3">
                {keywordState.groups.map(({ group, keywords, complete }) => (
                  <div
                    key={group}
                    className={`rounded-[1.5rem] border p-4 transition ${
                      complete ? "border-emerald-200 bg-emerald-50/80" : "border-slate-200 bg-slate-50/70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-bold text-slate-900">{group}</h3>
                      {complete ? (
                        <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <ExclamationCircleIcon className="h-5 w-5 text-amber-500" />
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {keywords.map((keyword) => {
                        const matched = keywordState.matched.has(keyword);
                        return (
                          <span
                            key={keyword}
                            className={`rounded-full border px-3 py-2 text-xs font-semibold ${
                              matched
                                ? "border-emerald-300 bg-white text-emerald-700"
                                : "border-slate-200 bg-white text-slate-500"
                            }`}
                          >
                            {keyword}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
        <SiteFooter tone="app" />
      </div>
    </div>
  );
}
