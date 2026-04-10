import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { ClipboardListIcon } from "@heroicons/react/outline";
import { useAuth } from "../hooks/useAuth";
import axios from "../lib/axios"
import AuthFrame from "../components/AuthFrame";

export default function TermsAndConditionsPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);

  const token = localStorage.getItem("token");
  if (!token || !user) return <Navigate to="/login" replace />;

  const handleContinue = async () => {
  if (!agreed || !user) return;

  try {
    await axios.post("/accepted-terms");

    const updatedUser = { ...user, hasAcceptedTerms: true };
    updateUser(updatedUser);

    if (!updatedUser.companyName) {
      navigate("/setup-profile");
    } else {
      navigate("/documents");
    }
  } catch (err) {
    console.error("Failed to accept terms:", err);
  }
};


  return (
    <AuthFrame
      title="תנאי שימוש"
      subtitle="ממשיכים רק אחרי קריאה ואישור של התנאים."
      icon={<ClipboardListIcon className="h-6 w-6" />}
      mode="compact"
      footer={
        <div className="flex justify-end text-sm">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="font-medium text-cyan-700 hover:underline"
          >
            יציאה
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
          <p>ברוכים הבאים לשירות שלנו.</p>
          <p>
            השירות מסופק כפי שהוא. ייתכנו תקלות, שינויים, אי-דיוקים או השבתות זמניות או קבועות של השירות, על פי שיקול דעתנו הבלעדי.
          </p>
          <p>
            השירות ניתן כפי שהוא ("as is") וללא כל התחייבות או אחריות מכל סוג שהוא, לרבות אך לא רק, אחריות להתאמה למטרה מסוימת, זמינות השירות, דיוק הפלטים או תקינות טכנית.
          </p>
          <p>
            מובהר כי איננו אחראים לכל נזק ישיר או עקיף, תוצאתי או מקרי, שייגרם עקב שימוש או הסתמכות על השירות או הפלטים המתקבלים ממנו.
          </p>
          <p>
            כל הזכויות בתוכן, בקוד, בלוגו ובדוחות שמורות. אין להעתיק, לשכפל, להפיץ או להשתמש בהם ללא אישור בכתב.
          </p>
          <p>
            תנאים אלו עשויים להשתנות מעת לעת. המשך השימוש בשירות מהווה הסכמה לתנאים אלו גם לאחר עדכונם.
          </p>
          <p>
            השימוש כפוף לדין הישראלי ולסמכות השיפוט הבלעדית של בתי המשפט במחוז תל אביב.
          </p>
        </div>

        <div className="flex items-start gap-3 rounded-3xl border border-slate-200 px-4 py-3">
          <input
            type="checkbox"
            id="agree"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
          />
          <label htmlFor="agree" className="text-sm leading-6 text-slate-600">
            אני מאשר שקראתי ואני מסכים לתנאים והגבלות
          </label>
        </div>

        <button
          type="button"
          onClick={handleContinue}
          disabled={!agreed}
          className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          המשך
        </button>
      </div>
    </AuthFrame>
  );
}
