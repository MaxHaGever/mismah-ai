import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  MailIcon,
  EyeIcon,
  EyeOffIcon,
  UserCircleIcon,
} from "@heroicons/react/outline";
import AuthFrame from "../components/AuthFrame";
import GoogleLoginButton from "../components/GoogleLoginButton";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  const continueFromUser = (user: Awaited<ReturnType<typeof login>>) => {
    if (!user.hasAcceptedTerms) {
      navigate("/terms", { replace: true });
    } else if (!user.companyName) {
      navigate("/setup-profile", { replace: true });
    } else {
      navigate("/documents", { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);

  try {
    const user = await login(email, password); 
    continueFromUser(user);
  } catch (err) {
    console.error("Login error:", err);
    setError("אימייל או סיסמה שגויים");
  }
};

  const handleGoogleLogin = async (credential: string) => {
    setError(null);

    try {
      const user = await loginWithGoogle(credential);
      continueFromUser(user);
    } catch (err) {
      console.error("Google login error:", err);
      setError("ההתחברות עם Google נכשלה");
    }
  };


  return (
    <AuthFrame
      title="התחברות למערכת"
      subtitle="התחברות לחשבון שלך."
      icon={<UserCircleIcon className="h-6 w-6" />}
      footer={
        <div className="border-t border-slate-200 pt-4 text-center text-sm text-slate-500">
          <span>
            אין לך חשבון?{" "}
            <Link to="/register" className="font-medium text-cyan-700 hover:underline">
              הירשם כאן
            </Link>
          </span>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">אימייל</label>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
              dir="ltr"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pl-12 text-left text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-100"
            />
            <MailIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">סיסמה</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              dir="ltr"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pl-12 text-left text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-100"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-4 top-1/2 -translate-y-1/2"
              aria-label={showPassword ? "הסתר סיסמה" : "הצג סיסמה"}
            >
              {showPassword ? (
                <EyeOffIcon className="h-5 w-5 text-slate-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          התחבר
        </button>

        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">או</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="flex justify-center">
            <GoogleLoginButton onCredential={handleGoogleLogin} />
          </div>
        </div>
      </form>
    </AuthFrame>
  );
}
