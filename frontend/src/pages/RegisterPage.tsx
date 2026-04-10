import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { UserAddIcon } from "@heroicons/react/outline";
import AuthFrame from "../components/AuthFrame";
import GoogleLoginButton from "../components/GoogleLoginButton";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();

  const handleGoogleLogin = async (credential: string) => {
    try {
      const user = await loginWithGoogle(credential);
      if (!user.hasAcceptedTerms) {
        navigate("/terms", { replace: true });
      } else if (!user.companyName) {
        navigate("/setup-profile", { replace: true });
      } else {
        navigate("/documents", { replace: true });
      }
    } catch (err) {
      console.error("Google registration/login error:", err);
    }
  };

  return (
    <AuthFrame
      title="בקשת גישה למערכת"
      subtitle="כרגע מצרפים משתמשים חדשים דרך Google או בהזמנה ידנית בלבד."
      icon={<UserAddIcon className="h-6 w-6" />}
      footer={
        <div className="border-t border-slate-200 pt-4 text-center text-sm text-slate-500">
          כבר יש לך חשבון?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="font-medium text-cyan-700 hover:underline"
          >
            התחבר כאן
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
          <p className="font-semibold text-slate-900">יש כרגע 2 דרכים להיכנס למערכת:</p>
          <p>1. התחברות עם Google דרך הכפתור למטה.</p>
          <p>2. שליחת כתובת האימייל אליי, כדי שאפתח משתמש ידנית ואשלח פרטי התחברות.</p>
        </div>

        <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-5 text-sm leading-7 text-amber-900">
          <p className="font-semibold">אין כרגע פתיחת חשבון עצמאית עם אימייל וסיסמה.</p>
          <p>אם אתה רוצה משתמש רגיל, שלח לי אימייל ואצור אותו ידנית עבורך.</p>
        </div>

        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">או</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="space-y-1 text-center">
            <p className="text-sm font-medium text-slate-700">כניסה או יצירת משתמש עם Google</p>
          </div>
          <div className="flex justify-center">
            <GoogleLoginButton onCredential={handleGoogleLogin} />
          </div>
        </div>
      </div>
    </AuthFrame>
  );
}
