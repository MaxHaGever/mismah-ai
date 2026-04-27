import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import axios from '../lib/axios';
import { useAuth } from '../hooks/useAuth';
import { detectLeakKeywords, keywordGroups } from '../lib/leakKeywords';
import {
  CheckCircleIcon,
  ClipboardListIcon,
  DocumentTextIcon,
  DownloadIcon,
  ExclamationCircleIcon,
  LogoutIcon,
  PhotographIcon,
  SparklesIcon,
  TrashIcon,
  UserCircleIcon,
} from '@heroicons/react/outline';
import SiteFooter from '../components/SiteFooter';

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

const quickGuide = [
  'כתוב חופשי כמו שאתה מסכם בדיקה בשטח.',
  'תאר מי הלקוח, איפה בוצעה הבדיקה, מה נמצא ואיך בדקת.',
  'הסתכל על סרגל ההתקדמות ועל מילות המפתח עד שהעמוד כמעט כולו ירוק.',
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<ImageDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const staticBaseUrl = import.meta.env.VITE_STATIC_URL?.replace(/\/+$/, '') || '';
  const logoSrc = user?.companyLogo
    ? user.companyLogo.startsWith('http')
      ? user.companyLogo
      : `${staticBaseUrl}/${user.companyLogo.replace(/^\/+/, '')}`
    : null;

  const detection = useMemo(() => detectLeakKeywords(prompt), [prompt]);
  const allKeywords = Object.values(keywordGroups).flat();
  const matchedKeywords = allKeywords.filter((keyword) => detection.matched.has(keyword));
  const matchedCount = matchedKeywords.length;
  const totalKeywords = allKeywords.length;
  const progressPercent = totalKeywords ? Math.round((matchedCount / totalKeywords) * 100) : 0;
  const progressTone =
    progressPercent >= 75
      ? 'from-emerald-600 to-lime-500'
      : progressPercent >= 45
        ? 'from-cyan-600 to-emerald-500'
        : 'from-amber-500 to-cyan-500';

  const groupCards = useMemo(
    () =>
      Object.entries(keywordGroups).map(([group, keywords]) => {
        const keywordList = [...keywords];
        const groupMatched = keywordList.filter((keyword) => detection.matched.has(keyword));
        return {
          group,
          keywords: keywordList,
          matchedKeywords: groupMatched,
          missingKeywords: keywordList.filter((keyword) => !detection.matched.has(keyword)),
          complete: groupMatched.length === keywordList.length,
          progress: Math.round((groupMatched.length / keywordList.length) * 100),
        };
      }),
    [detection]
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, MAX_IMAGES - images.length);
    const newItems = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      description: '',
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
    setPdfUrl(null);
    setError(null);

    try {
      let uploadedImages: UploadedImageResponse[] = [];

      if (images.length) {
        const formData = new FormData();
        images.forEach((img) => formData.append('images', img.file));
        formData.append('descriptions', JSON.stringify(images.map((img) => img.description)));

        const uploadRes = await axios.post('/uploads/images', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        uploadedImages = uploadRes.data.images;
      }

      const pdfRes = await axios.post(
        '/ai/leak-detection',
        { prompt, images: uploadedImages },
        { responseType: 'blob' }
      );

      const blob = new Blob([pdfRes.data], { type: 'application/pdf' });
      setPdfUrl(URL.createObjectURL(blob));
    } catch (err) {
      if (isAxiosError(err) && typeof err.response?.data?.error === 'string') {
        setError(err.response.data.error);
      } else {
        setError('שגיאה ביצירת הדוח');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_24%),radial-gradient(circle_at_bottom_left,_rgba(15,23,42,0.07),_transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-slate-200/80 bg-white/90 px-5 py-4 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.28)]">
          <div className="flex items-center gap-3">
            {logoSrc ? (
              <img
                src={logoSrc}
                alt="Logo"
                className="h-12 w-12 rounded-2xl border border-slate-200 object-cover"
                crossOrigin="use-credentials"
              />
            ) : (
              <UserCircleIcon className="h-12 w-12 text-slate-400" />
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-950">{user?.companyName || 'Mismah AI'}</h1>
              <p className="text-sm text-slate-500">דוח איתור נזילות</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate('/documents')}
              className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-medium text-cyan-800 transition hover:bg-cyan-100"
            >
              <span className="inline-flex items-center gap-2">
                <ClipboardListIcon className="h-4 w-4" />
                בחירת מסמך
              </span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/setup-profile')}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
            >
              פרטי חברה
            </button>
            {user?.isAdmin && (
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
              >
                לוח ניהול
              </button>
            )}
            {user?.authProvider !== 'google' && (
              <button
                type="button"
                onClick={() => navigate('/update-password', { state: { from: '/dashboard' } })}
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
            className="rounded-[2rem] border border-slate-200/80 bg-white/92 p-5 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.28)] sm:p-6"
          >
            <div className="grid gap-5">
              <section className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-2xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">Leak detection</p>
                    <h2 className="mt-2 text-3xl font-bold text-slate-950">כתוב חופשי את מה שקרה בבדיקה</h2>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      כתוב כמו שאתה מסכם בדיקה אמיתית: מי הלקוח, איפה בוצעה הבדיקה, באילו כלים השתמשת, מה היה מוקד הנזילה,
                      מה להערכתך מקור התקלה ומה ההמלצה להמשך. המערכת תזהה את החלקים החשובים ותבנה מהם PDF מקצועי.
                    </p>
                  </div>

                  <div className="min-w-[220px] rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">איך זה עובד</p>
                    <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-700">
                      {quickGuide.map((item, index) => (
                        <li key={item} className="flex gap-2">
                          <span className="font-bold text-cyan-700">{index + 1}.</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">התקדמות התוכן</p>
                      <p className="text-xs leading-5 text-slate-500">
                        {matchedCount} מתוך {totalKeywords} רמזים זוהו. ככל שהסרגל ירוק יותר, הדוח יהיה שלם ומדויק יותר.
                      </p>
                    </div>
                    <div className="text-base font-bold text-slate-800">{progressPercent}%</div>
                  </div>

                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${progressTone} transition-all duration-500`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="relative mt-5">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="לדוגמה: אתמול הגעתי לבצע בדיקה בדירה של הלקוח יואב כהן ברחוב הגפן 12, דירה 4, חיפה. מדובר בדירת מגורים בקומה שלישית. הבדיקה בוצעה על ידי דוד לוי, הנדסאי בניין עם 12 שנות ניסיון. במהלך הבדיקה השתמשתי במצלמה תרמית, מד לחות ובדיקת הצפה. מוקד הנזילה נמצא במרפסת השירות ובחדר הרחצה מתחת לכיור. להערכתי מקור התקלה קשור לכשל באיטום במרפסת בשילוב נזילה מקומית בצנרת. ההמלצה היא לבצע תיקון איטום, החלפת המקטע הפגום וייבוש מקצועי. הערה נוספת: מומלץ לבצע בדיקת חוזר לאחר התיקון."
                    rows={13}
                    className="w-full rounded-[1.75rem] border border-slate-200 bg-white px-4 py-4 pr-12 text-sm leading-8 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-4 focus:ring-cyan-100"
                  />
                  <DocumentTextIcon className="absolute right-4 top-4 h-5 w-5 text-slate-400" />
                </div>
              </section>

              <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-950">תמונות ותיאור קצר</h3>
                    <p className="text-sm leading-6 text-slate-600">
                      אפשר לצרף עד 5 תמונות. לכל תמונה כתוב שורה קצרה כדי שהמסמך יידע לקשור אותה לממצאים.
                    </p>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
                    {images.length}/{MAX_IMAGES}
                  </div>
                </div>

                <div className="relative rounded-[1.75rem] border-2 border-dashed border-slate-300 bg-white px-5 py-8 text-center transition hover:border-cyan-300 hover:bg-cyan-50/50">
                  <PhotographIcon className="mx-auto h-11 w-11 text-slate-400" />
                  <p className="mt-3 text-sm font-semibold text-slate-700">לחץ כדי לצרף תמונות מהבדיקה</p>
                  <p className="mt-1 text-sm text-slate-500">תמונה של מוקד הרטיבות, מקור התקלה או צילום כללי של האזור.</p>
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
                    <div
                      key={`${img.file.name}-${idx}`}
                      className="grid gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-3 sm:grid-cols-[80px_1fr_auto] sm:items-center"
                    >
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
                  {loading ? (
                    <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  ) : (
                    <SparklesIcon className="h-5 w-5" />
                  )}
                  {loading ? 'יוצר דוח...' : 'צור דוח PDF'}
                </button>

                {pdfUrl && (
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100"
                  >
                    <DownloadIcon className="h-5 w-5" />
                    פתח את הדוח שנוצר
                  </a>
                )}
              </section>
            </div>
          </form>

          <aside className="grid gap-5">
            <section className="rounded-[2rem] border border-slate-200/80 bg-white/92 p-5 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.28)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">Checklist</p>
                  <h2 className="text-lg font-bold text-slate-950">מה כדאי שיופיע בטקסט</h2>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  {matchedCount}/{totalKeywords}
                </div>
              </div>

              <div className="grid gap-3">
                {groupCards.map(({ group, complete, progress, matchedKeywords, missingKeywords }) => (
                  <div
                    key={group}
                    className={`rounded-[1.5rem] border p-4 ${
                      complete ? 'border-emerald-200 bg-emerald-50/80' : 'border-slate-200 bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{group}</h3>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {complete
                            ? 'הקבוצה הזו כבר מכוסה בטקסט.'
                            : matchedKeywords.length
                              ? `כבר זוהו ${matchedKeywords.length} פריטים מתוך הקבוצה.`
                              : 'כדאי להוסיף בטקסט פרטים מהקבוצה הזו.'}
                        </p>
                      </div>
                      {complete ? (
                        <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <ExclamationCircleIcon className="h-5 w-5 text-amber-500" />
                      )}
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                      <div
                        className={`h-full rounded-full ${complete ? 'bg-emerald-500' : 'bg-cyan-500'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {[...matchedKeywords, ...missingKeywords].map((keyword) => {
                        const matched = detection.matched.has(keyword);
                        return (
                          <span
                            key={keyword}
                            className={`rounded-full border px-3 py-2 text-xs font-semibold ${
                              matched
                                ? 'border-emerald-300 bg-white text-emerald-700'
                                : 'border-slate-200 bg-white text-slate-500'
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
