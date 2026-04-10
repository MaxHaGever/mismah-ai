import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../lib/axios";
import { isAxiosError, type AxiosError } from "axios";
import { MailOpenIcon } from "@heroicons/react/outline";
import AuthFrame from "../components/AuthFrame";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function isApiError(err: unknown): err is AxiosError<{ error: string }> {
    return isAxiosError(err) && typeof err.response?.data?.error === "string";
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      await axiosInstance.post("/forgot-password", { email });
          setMessage(
      "קישור לאיפוס הסיסמה נשלח לכתובת המייל שלך. אנא בדוק/י את תיבת הדואר (כולל ספאם)."
    );

    } catch (err: unknown) {
      setError(
        isApiError(err)
          ? err.response!.data.error
          : "שגיאה בשליחת בקשת איפוס"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFrame
      title="שחזור גישה"
      subtitle="נשלח קישור איפוס לכתובת המייל שלך כדי שתוכל לחזור לדשבורד במהירות."
      icon={<MailOpenIcon className="h-6 w-6" />}
      footer={
        <p className="text-center text-sm text-slate-500">
          נזכרת בסיסמה?{" "}
          <button
            onClick={() => navigate("/login")}
            className="font-medium text-cyan-700 hover:underline"
          >
            התחבר
          </button>
        </p>
      }
    >
      <div className="space-y-5">
        {message && (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-700">
            {message}
          </p>
        )}
        {error && (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-700">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">אימייל</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              dir="ltr"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "שולח..." : "שלח קישור איפוס"}
          </button>
        </form>
      </div>
    </AuthFrame>
  );
}
